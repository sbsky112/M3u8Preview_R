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
 * 启动时检测 ffmpeg 是否可用
 * 优先尝试 npm 包（开发环境），失败则回退到系统 PATH（Docker 生产环境）
 */
export async function checkFfmpeg(): Promise<boolean> {
  // 1. 尝试 npm 包（开发环境有效，生产环境已移至 devDeps 不会安装）
  try {
    const require = createRequire(import.meta.url);
    const { path: fPath } = require('@ffmpeg-installer/ffmpeg');
    const { path: probePath } = require('@ffprobe-installer/ffprobe');
    await execFile(fPath, ['-version'], { timeout: 5000 });
    await execFile(probePath, ['-version'], { timeout: 5000 });
    ffmpegPath = fPath;
    ffprobePath = probePath;
    ffmpegAvailable = true;
    console.log('[Thumbnail] Using npm ffmpeg:', ffmpegPath);
    console.log('[Thumbnail] Using npm ffprobe:', ffprobePath);
    return true;
  } catch {
    // npm 包不可用（未安装或二进制不兼容），继续尝试系统 PATH
  }

  // 2. 尝试系统 PATH
  try {
    await execFile('ffmpeg', ['-version'], { timeout: 5000 });
    await execFile('ffprobe', ['-version'], { timeout: 5000 });
    ffmpegPath = 'ffmpeg';
    ffprobePath = 'ffprobe';
    ffmpegAvailable = true;
    console.log('[Thumbnail] Using system ffmpeg/ffprobe, thumbnail generation enabled');
    return true;
  } catch {
    ffmpegAvailable = false;
    console.warn('[Thumbnail] ffmpeg/ffprobe not found, thumbnail generation disabled');
    return false;
  }
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
      '-allowed_extensions', 'ALL',
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

    // 3. ffmpeg 提取帧（-ss 在 -i 之前，启用快速 seek 直接跳转最近关键帧）
    await execFile(ffmpegPath, [
      '-user_agent', UA,
      '-allowed_extensions', 'ALL',
      '-ss', seekTime.toFixed(2),
      '-i', m3u8Url,
      '-vframes', '1',
      '-vf', 'scale=480:-2',
      '-c:v', 'libwebp',
      '-quality', '50',
      '-y',
      outputPath,
    ], { timeout: 30000 });

    // 4. 检查文件大小，若 >30KB 则从本地文件重编码（避免重新下载远端流）
    const stat = await fsStat(outputPath);
    if (stat.size > 30 * 1024) {
      const tmpPath = `${outputPath}.tmp.webp`;
      await execFile(ffmpegPath, [
        '-i', outputPath,
        '-vf', 'scale=480:-2',
        '-c:v', 'libwebp',
        '-quality', '30',
        '-y',
        tmpPath,
      ], { timeout: 10000 });
      fs.renameSync(tmpPath, outputPath);
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
 * 后台缩略图生成队列
 * - 并发数可通过 THUMBNAIL_CONCURRENCY 环境变量配置，默认 5
 * - 自动去重，同一 mediaId 不会重复入队
 * - 支持状态查询（pending/active/completed/failed）
 */
class ThumbnailQueue {
  private queue: Array<{ mediaId: string; m3u8Url: string }> = [];
  private active = 0;
  private readonly concurrency: number;
  private enqueuedIds = new Set<string>();
  private completed = 0;
  private failed = 0;

  constructor() {
    const envVal = parseInt(process.env.THUMBNAIL_CONCURRENCY || '', 10);
    this.concurrency = envVal > 0 && envVal <= 20 ? envVal : 5;
  }

  enqueue(mediaId: string, m3u8Url: string) {
    if (this.enqueuedIds.has(mediaId)) return;
    this.enqueuedIds.add(mediaId);
    this.queue.push({ mediaId, m3u8Url });
    this.process();
  }

  enqueueBatch(items: Array<{ mediaId: string; m3u8Url: string }>) {
    for (const item of items) {
      if (!this.enqueuedIds.has(item.mediaId)) {
        this.enqueuedIds.add(item.mediaId);
        this.queue.push(item);
      }
    }
    this.process();
  }

  getStatus() {
    return {
      pending: this.queue.length,
      active: this.active,
      completed: this.completed,
      failed: this.failed,
      concurrency: this.concurrency,
    };
  }

  private async process() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.active++;
      generateThumbnail(item.mediaId, item.m3u8Url)
        .then((result) => {
          if (result) {
            this.completed++;
          } else {
            this.failed++;
          }
        })
        .catch(() => {
          this.failed++;
        })
        .finally(() => {
          this.active--;
          this.enqueuedIds.delete(item.mediaId);
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
