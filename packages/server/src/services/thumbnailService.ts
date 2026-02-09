import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../lib/prisma.js';

const execFile = promisify(execFileCb);
const fsStat = promisify(fs.stat);
const fsUnlink = promisify(fs.unlink);
const fsMkdir = promisify(fs.mkdir);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THUMBNAILS_DIR = path.resolve(__dirname, '../../uploads/thumbnails');

let ffmpegAvailable = false;
let ffmpegPath = 'ffmpeg';
let ffprobePath = 'ffprobe';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * 尝试从 npm 包获取 ffmpeg/ffprobe 二进制路径，失败则回退到系统 PATH
 */
function resolveBinaryPaths() {
  const require = createRequire(import.meta.url);

  // @ffmpeg-installer/ffmpeg
  try {
    const { path: fPath } = require('@ffmpeg-installer/ffmpeg');
    if (fPath && typeof fPath === 'string') {
      ffmpegPath = fPath;
      console.log('[Thumbnail] Using @ffmpeg-installer/ffmpeg:', ffmpegPath);
    }
  } catch {
    console.log('[Thumbnail] @ffmpeg-installer/ffmpeg not available, using system ffmpeg');
  }

  // @ffprobe-installer/ffprobe
  try {
    const { path: probePath } = require('@ffprobe-installer/ffprobe');
    if (probePath && typeof probePath === 'string') {
      ffprobePath = probePath;
      console.log('[Thumbnail] Using @ffprobe-installer/ffprobe:', ffprobePath);
    }
  } catch {
    console.log('[Thumbnail] @ffprobe-installer/ffprobe not available, using system ffprobe');
  }
}

/**
 * 启动时检测 ffmpeg 是否可用
 */
export async function checkFfmpeg(): Promise<boolean> {
  resolveBinaryPaths();
  try {
    await execFile(ffmpegPath, ['-version'], { timeout: 5000 });
    await execFile(ffprobePath, ['-version'], { timeout: 5000 });
    ffmpegAvailable = true;
    console.log('[Thumbnail] ffmpeg/ffprobe detected, thumbnail generation enabled');
  } catch {
    // npm 包的二进制可能不兼容（如 Alpine musl），回退到系统 PATH
    if (ffmpegPath !== 'ffmpeg' || ffprobePath !== 'ffprobe') {
      console.warn('[Thumbnail] npm ffmpeg binary failed, trying system PATH...');
      ffmpegPath = 'ffmpeg';
      ffprobePath = 'ffprobe';
      try {
        await execFile(ffmpegPath, ['-version'], { timeout: 5000 });
        await execFile(ffprobePath, ['-version'], { timeout: 5000 });
        ffmpegAvailable = true;
        console.log('[Thumbnail] Using system ffmpeg/ffprobe, thumbnail generation enabled');
      } catch {
        ffmpegAvailable = false;
        console.warn('[Thumbnail] ffmpeg/ffprobe not found, thumbnail generation disabled');
      }
    } else {
      ffmpegAvailable = false;
      console.warn('[Thumbnail] ffmpeg/ffprobe not found, thumbnail generation disabled');
    }
  }
  return ffmpegAvailable;
}

/**
 * 确保缩略图目录存在
 */
async function ensureDir() {
  await fsMkdir(THUMBNAILS_DIR, { recursive: true });
}

/**
 * 为指定媒体生成缩略图
 */
export async function generateThumbnail(mediaId: string, m3u8Url: string): Promise<string | null> {
  if (!ffmpegAvailable) {
    console.warn('[Thumbnail] ffmpeg not available, skipping generation for', mediaId);
    return null;
  }

  try {
    await ensureDir();

    // 1. 用 ffprobe 获取视频时长
    const { stdout: probeOut } = await execFile(ffprobePath, [
      '-user_agent', UA,
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      m3u8Url,
    ], { timeout: 30000 });

    const duration = parseFloat(probeOut.trim());
    if (!duration || !isFinite(duration) || duration <= 0) {
      console.warn('[Thumbnail] Could not determine duration for', mediaId);
      return null;
    }

    // 2. 随机选取 10%~40% 位置
    const seekTime = duration * (0.1 + Math.random() * 0.3);
    const outputPath = path.join(THUMBNAILS_DIR, `${mediaId}.webp`);

    // 3. ffmpeg 提取帧
    await execFile(ffmpegPath, [
      '-user_agent', UA,
      '-i', m3u8Url,
      '-ss', seekTime.toFixed(2),
      '-vframes', '1',
      '-vf', 'scale=480:-2',
      '-c:v', 'libwebp',
      '-quality', '50',
      '-y',
      outputPath,
    ], { timeout: 60000 });

    // 4. 检查文件大小，若 >30KB 则用更低质量重试
    const stat = await fsStat(outputPath);
    if (stat.size > 30 * 1024) {
      await execFile(ffmpegPath, [
        '-user_agent', UA,
        '-i', m3u8Url,
        '-ss', seekTime.toFixed(2),
        '-vframes', '1',
        '-vf', 'scale=480:-2',
        '-c:v', 'libwebp',
        '-quality', '30',
        '-y',
        outputPath,
      ], { timeout: 60000 });
    }

    // 5. 更新数据库
    const posterUrl = `/uploads/thumbnails/${mediaId}.webp`;
    await prisma.media.update({
      where: { id: mediaId },
      data: { posterUrl },
    });

    console.log(`[Thumbnail] Generated for ${mediaId} (${(await fsStat(outputPath)).size} bytes)`);
    return posterUrl;
  } catch (err) {
    console.error(`[Thumbnail] Failed to generate for ${mediaId}:`, err);
    return null;
  }
}

/**
 * 删除指定媒体的缩略图文件
 */
export async function deleteThumbnail(mediaId: string): Promise<void> {
  try {
    const filePath = path.join(THUMBNAILS_DIR, `${mediaId}.webp`);
    await fsUnlink(filePath);
    console.log(`[Thumbnail] Deleted thumbnail for ${mediaId}`);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error(`[Thumbnail] Failed to delete thumbnail for ${mediaId}:`, err);
    }
  }
}

/**
 * 后台缩略图生成队列，限制并发数避免 ffmpeg 占满 CPU
 */
class ThumbnailQueue {
  private queue: Array<{ mediaId: string; m3u8Url: string }> = [];
  private active = 0;
  private readonly concurrency = 2;

  enqueue(mediaId: string, m3u8Url: string) {
    this.queue.push({ mediaId, m3u8Url });
    this.process();
  }

  enqueueBatch(items: Array<{ mediaId: string; m3u8Url: string }>) {
    this.queue.push(...items);
    this.process();
  }

  private async process() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.active++;
      generateThumbnail(item.mediaId, item.m3u8Url)
        .catch(() => {})
        .finally(() => {
          this.active--;
          this.process();
        });
    }
  }
}

export const thumbnailQueue = new ThumbnailQueue();

/**
 * 查询所有缺失缩略图的 ACTIVE 媒体，批量入队生成
 */
export async function generateAllMissing(): Promise<number> {
  const missing = await prisma.media.findMany({
    where: {
      status: 'ACTIVE',
      posterUrl: null,
    },
    select: { id: true, m3u8Url: true },
  });

  if (missing.length > 0) {
    thumbnailQueue.enqueueBatch(
      missing.map(m => ({ mediaId: m.id, m3u8Url: m.m3u8Url })),
    );
    console.log(`[Thumbnail] Enqueued ${missing.length} media for thumbnail generation`);
  }

  return missing.length;
}
