import { Router } from 'express';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import dns from 'node:dns/promises';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// 代理端点独立限流：每 IP 每 15 分钟最多 300 次（segment 请求量较大）
const proxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: '代理请求过于频繁，请稍后再试' },
});

router.use(proxyLimiter);

/** 允许代理的文件扩展名白名单 */
const ALLOWED_EXTENSIONS = new Set([
  '.m3u8', '.ts', '.m4s', '.mp4', '.aac', '.key', '.jpeg', '.jpg', '.png',
]);

/** 提取路径最后一段的文件扩展名 */
function getPathExtension(pathname: string): string {
  const lastSegment = pathname.split('/').pop() || '';
  // 取查询参数前的部分（URL 类已处理，但保险起见）
  const cleanSegment = lastSegment.split('?')[0];
  const dotIndex = cleanSegment.lastIndexOf('.');
  return dotIndex >= 0 ? cleanSegment.slice(dotIndex).toLowerCase() : '';
}

/** 判断 IP 地址是否为私有/内网地址 */
function isPrivateIp(ip: string): boolean {
  // IPv4
  const v4Parts = ip.split('.').map(Number);
  if (v4Parts.length === 4 && v4Parts.every(p => p >= 0 && p <= 255)) {
    return (
      v4Parts[0] === 0 ||
      v4Parts[0] === 127 ||
      v4Parts[0] === 10 ||
      (v4Parts[0] === 172 && v4Parts[1] >= 16 && v4Parts[1] <= 31) ||
      (v4Parts[0] === 192 && v4Parts[1] === 168) ||
      (v4Parts[0] === 169 && v4Parts[1] === 254) ||
      (v4Parts[0] === 100 && v4Parts[1] >= 64 && v4Parts[1] <= 127)
    );
  }
  return false;
}

/** SSRF 防护：在 hostname 字符串级别做初步检查 */
function isPrivateHostname(hostname: string): boolean {
  // 移除 IPv6 方括号
  const clean = hostname.replace(/^\[|\]$/g, '');

  // 常见内网主机名
  if (
    clean === 'localhost' ||
    clean === '127.0.0.1' ||
    clean === '0.0.0.0' ||
    clean === '::1' ||
    clean === '::ffff:127.0.0.1'
  ) {
    return true;
  }

  // 内网域名后缀
  if (clean.endsWith('.local') || clean.endsWith('.internal') || clean.endsWith('.localhost')) {
    return true;
  }

  // IPv4 字符串级别检查
  if (isPrivateIp(clean)) {
    return true;
  }

  // IPv6 映射的 IPv4（::ffff:x.x.x.x）
  const v4MappedMatch = clean.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4MappedMatch && isPrivateIp(v4MappedMatch[1])) {
    return true;
  }

  return false;
}

/** SSRF 防护：DNS 解析后校验实际 IP 地址（防 DNS Rebinding） */
async function validateResolvedIp(hostname: string): Promise<void> {
  try {
    const addresses = await dns.resolve4(hostname);
    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        throw new AppError('不允许代理内网地址', 403);
      }
    }
  } catch (error) {
    // 如果是我们主动抛出的 AppError，继续向上抛
    if (error instanceof AppError) throw error;
    // DNS 解析失败（可能是纯 IPv6 域名等），跳过 IPv4 校验
    // 尝试 IPv6 解析
    try {
      const addresses = await dns.resolve6(hostname);
      for (const addr of addresses) {
        const clean = addr.replace(/^\[|\]$/g, '');
        if (clean === '::1' || clean.startsWith('fe80:') || clean.startsWith('fc') || clean.startsWith('fd')) {
          throw new AppError('不允许代理内网地址', 403);
        }
        // 检查 IPv6 映射的 IPv4
        const v4Match = clean.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
        if (v4Match && isPrivateIp(v4Match[1])) {
          throw new AppError('不允许代理内网地址', 403);
        }
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // DNS 完全解析失败，让后续 fetch 自行处理
    }
  }
}

/** 校验代理 URL 合法性 */
async function validateProxyUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError('无效的 URL', 400);
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new AppError('仅支持 HTTP/HTTPS 协议', 400);
  }

  // 字符串级别 SSRF 检查
  if (isPrivateHostname(parsed.hostname)) {
    throw new AppError('不允许代理内网地址', 403);
  }

  // DNS 解析级别 SSRF 检查（防 DNS Rebinding）
  await validateResolvedIp(parsed.hostname);

  // 校验扩展名：提取路径最后一段的扩展名
  const ext = getPathExtension(parsed.pathname);
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new AppError('不支持代理此类型的资源', 400);
  }

  return parsed;
}

/**
 * 重写 m3u8 playlist 中的相对/绝对路径为代理 URL
 * 将 segment 路径改写为通过 /api/v1/proxy/m3u8?url=<encoded> 访问
 */
function rewriteM3u8Content(content: string, baseUrl: string): string {
  const lines = content.split('\n');
  const proxyPrefix = '/api/v1/proxy/m3u8?url=';

  return lines
    .map(line => {
      const trimmed = line.trim();

      // 跳过空行
      if (trimmed === '') return line;

      // 处理含 URI="..." 的标签（如 #EXT-X-MAP、#EXT-X-KEY、#EXT-X-I-FRAME-STREAM-INF 等）
      if (trimmed.startsWith('#') && trimmed.includes('URI="')) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
          const absoluteUrl = resolveUrl(uri, baseUrl);
          return `URI="${proxyPrefix}${encodeURIComponent(absoluteUrl)}"`;
        });
      }

      // 跳过其它纯注释行
      if (trimmed.startsWith('#')) return line;

      // segment 行：将路径解析为绝对 URL 并改写
      const absoluteUrl = resolveUrl(trimmed, baseUrl);
      return `${proxyPrefix}${encodeURIComponent(absoluteUrl)}`;
    })
    .join('\n');
}

/** 将可能的相对路径解析为绝对 URL */
function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  try {
    return new URL(url, baseUrl).href;
  } catch {
    // URL 解析失败，返回原值（播放器会收到 404）
    console.warn(`[proxy] 无法解析相对 URL: ${url}, base: ${baseUrl}`);
    return url;
  }
}

/** 校验数据库中是否存在该 m3u8Url 对应的媒体记录 */
async function validateMediaExists(targetUrl: URL): Promise<void> {
  const fullUrl = targetUrl.href;
  // 优先精确匹配完整 URL
  const exactMatch = await prisma.media.findFirst({
    where: { m3u8Url: fullUrl, status: 'ACTIVE' },
    select: { id: true },
  });
  if (exactMatch) return;

  // 回退：去掉查询参数后匹配（部分 CDN 会在 URL 后追加鉴权参数）
  const urlWithoutSearch = `${targetUrl.protocol}//${targetUrl.host}${targetUrl.pathname}`;
  const prefixMatch = await prisma.media.findFirst({
    where: {
      m3u8Url: { startsWith: urlWithoutSearch },
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  if (prefixMatch) return;

  throw new AppError('未找到对应的媒体记录，拒绝代理', 403);
}

/** 校验 segment 请求的域名是否存在于数据库的某条 m3u8Url 中 */
async function validateSegmentDomain(targetUrl: URL): Promise<void> {
  const hostPrefix = `${targetUrl.protocol}//${targetUrl.host}`;
  const domainMatch = await prisma.media.findFirst({
    where: {
      m3u8Url: { startsWith: hostPrefix },
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  if (!domainMatch) {
    throw new AppError('未找到对应的媒体记录，拒绝代理', 403);
  }
}

/** 判断 content-type 是否为 m3u8 类型 */
function isM3u8ContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return (
    lower.includes('mpegurl') ||
    lower.includes('vnd.apple.mpegurl') ||
    lower === 'audio/mpegurl'
  );
}

/** 整体请求超时时间（含流式传输） */
const TOTAL_TIMEOUT_MS = 120_000;
/** fetch 连接超时时间 */
const CONNECT_TIMEOUT_MS = 15_000;

/**
 * GET /api/v1/proxy/m3u8?url=<encoded_url>
 * 代理外部 m3u8/ts 等媒体资源，解决 CORS 问题
 */
router.get('/m3u8', asyncHandler(async (req, res) => {
  const rawUrl = req.query.url as string | undefined;
  if (!rawUrl) {
    throw new AppError('缺少 url 参数', 400);
  }

  const targetUrl = await validateProxyUrl(rawUrl);

  const pathname = targetUrl.pathname.toLowerCase();
  const isM3u8 = pathname.endsWith('.m3u8');

  // 数据库校验：m3u8 精确匹配，segment 校验域名
  if (isM3u8) {
    await validateMediaExists(targetUrl);
  } else {
    await validateSegmentDomain(targetUrl);
  }

  // 连接级别超时控制
  const connectController = new AbortController();
  const connectTimeout = setTimeout(() => connectController.abort(), CONNECT_TIMEOUT_MS);

  // 整体请求超时控制（含流式传输）
  const totalController = new AbortController();
  const totalTimeout = setTimeout(() => totalController.abort(), TOTAL_TIMEOUT_MS);

  // 任一超时都触发中止
  connectController.signal.addEventListener('abort', () => totalController.abort());

  try {
    const response = await fetch(targetUrl.href, {
      signal: totalController.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: '*/*',
        ...(req.headers.range ? { Range: req.headers.range } : {}),
      },
      redirect: 'follow',
    });

    clearTimeout(connectTimeout);

    if (!response.ok) {
      clearTimeout(totalTimeout);
      res.status(response.status).json({
        success: false,
        error: `上游服务器返回 ${response.status}`,
      });
      return;
    }

    // 转发关键响应头
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
      res.status(206);
    }

    // 缓存策略：m3u8 不缓存，segment 缓存
    if (isM3u8) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    // 对 m3u8 内容进行路径重写
    const shouldRewrite = isM3u8 && isM3u8ContentType(contentType);
    if (shouldRewrite) {
      const body = await response.text();
      clearTimeout(totalTimeout);
      const rewritten = rewriteM3u8Content(body, targetUrl.href);
      res.removeHeader('Content-Length');
      res.send(rewritten);
      return;
    }

    // 非 m3u8 内容：使用 Node.js stream pipeline 流式转发
    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as import('stream/web').ReadableStream);

      // 客户端断开或总超时时销毁上游流
      req.on('close', () => {
        nodeStream.destroy();
        clearTimeout(totalTimeout);
      });

      totalController.signal.addEventListener('abort', () => {
        nodeStream.destroy(new Error('总超时'));
      });

      try {
        await pipeline(nodeStream, res);
      } finally {
        clearTimeout(totalTimeout);
      }
    } else {
      clearTimeout(totalTimeout);
      res.end();
    }
  } catch (error: unknown) {
    clearTimeout(connectTimeout);
    clearTimeout(totalTimeout);

    if (error instanceof Error && error.name === 'AbortError') {
      if (!res.headersSent) {
        res.status(504).json({ success: false, error: '代理请求超时' });
      }
      return;
    }

    throw error;
  }
}));

export default router;
