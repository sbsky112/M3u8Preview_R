import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

/**
 * 从 m3u8 视频流中提取封面缩略图。
 *
 * 当传入 watchedPercentage 时，截取观看进度所在帧；否则随机截取 10%~40% 位置的帧。
 * 优先级：posterUrl > 内存缓存(进度匹配) > localStorage 缓存(进度匹配) > 在线提取。
 * 并发控制：最多同时 3 个提取任务，超出排队等待。
 */

const MAX_CONCURRENT = 3;
const EXTRACT_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// 模块级单例缓存
const memoryCache = new Map<string, string>();
const cachedPctMap = new Map<string, number | undefined>(); // 记录每个 mediaId 提取缩略图时使用的 roundedPct
let activeExtractions = 0;
const pendingQueue: Array<() => void> = [];

/** 清除过期 localStorage 缩略图 */
function purgeExpiredThumbs() {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith('thumb_ts_')) continue;
      const ts = Number(localStorage.getItem(key));
      if (now - ts > CACHE_TTL_MS) {
        const mediaId = key.replace('thumb_ts_', '');
        localStorage.removeItem(`thumb_${mediaId}`);
        localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage 不可用时静默忽略
  }
}

/** 等待并发槽位可用 */
function acquireSlot(): Promise<void> {
  if (activeExtractions < MAX_CONCURRENT) {
    activeExtractions++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    pendingQueue.push(() => {
      activeExtractions++;
      resolve();
    });
  });
}

/** 释放并发槽位 */
function releaseSlot() {
  activeExtractions--;
  const next = pendingQueue.shift();
  next?.();
}

/** 从 localStorage 读取缓存 */
function readLocalCache(mediaId: string): string | null {
  try {
    const data = localStorage.getItem(`thumb_${mediaId}`);
    if (!data) return null;
    const ts = Number(localStorage.getItem(`thumb_ts_${mediaId}`));
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(`thumb_${mediaId}`);
      localStorage.removeItem(`thumb_ts_${mediaId}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** 写入 localStorage 缓存 */
function writeLocalCache(mediaId: string, dataUrl: string) {
  try {
    localStorage.setItem(`thumb_${mediaId}`, dataUrl);
    localStorage.setItem(`thumb_ts_${mediaId}`, String(Date.now()));
  } catch {
    // quota 超出时静默降级
  }
}

/**
 * 从 m3u8 提取一帧画面。
 * 返回 JPEG base64 data URL 或 null（失败时）。
 */
async function extractFrame(
  m3u8Url: string,
  abortSignal: AbortSignal,
  seekPercentage?: number, // 0-100, undefined → 随机
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    if (abortSignal.aborted) {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.style.display = 'none';
    document.body.appendChild(video);

    let hls: Hls | null = null;
    let resolved = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function cleanup() {
      clearTimeout(timeoutId);
      if (hls) { hls.destroy(); hls = null; }
      video.remove();
    }

    function done(result: string | null) {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    }

    // 超时保护
    timeoutId = setTimeout(() => done(null), EXTRACT_TIMEOUT_MS);

    // 中止信号
    abortSignal.addEventListener('abort', () => done(null), { once: true });

    function onSeeked() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (!ctx) { done(null); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        done(dataUrl);
      } catch {
        // canvas tainted (CORS)
        done(null);
      }
    }

    function onManifestParsed() {
      const duration = video.duration || 0;
      if (!duration || !isFinite(duration)) {
        // 等 durationchange
        video.addEventListener('durationchange', () => {
          const d = video.duration;
          if (d && isFinite(d)) {
            video.currentTime = seekPercentage != null
              ? d * Math.min(seekPercentage / 100, 0.95)
              : d * (0.1 + Math.random() * 0.3);
          } else {
            done(null);
          }
        }, { once: true });
        return;
      }
      video.currentTime = seekPercentage != null
        ? duration * Math.min(seekPercentage / 100, 0.95)  // 进度帧（上限 95% 防末尾黑屏）
        : duration * (0.1 + Math.random() * 0.3);           // 无进度时保持随机
    }

    video.addEventListener('seeked', onSeeked, { once: true });

    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 5, maxMaxBufferLength: 10 });
      hls.loadSource(m3u8Url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) done(null);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = m3u8Url;
      video.addEventListener('loadedmetadata', onManifestParsed, { once: true });
    } else {
      done(null);
    }
  });
}

// 启动时清理过期缓存
purgeExpiredThumbs();

export function useVideoThumbnail(
  mediaId: string,
  m3u8Url: string,
  posterUrl?: string | null,
  watchedPercentage?: number, // 0-100，观看进度百分比
): string | null {
  // 5% 粒度取整，用于缓存匹配和刷新判断
  const roundedPct = watchedPercentage != null && watchedPercentage > 0
    ? Math.max(5, Math.min(95, Math.round(watchedPercentage / 5) * 5))
    : undefined;

  const [thumbnail, setThumbnail] = useState<string | null>(() => {
    // 同步初始化：posterUrl > 内存缓存 > localStorage
    if (posterUrl) return posterUrl;
    if (!mediaId) return null;
    const mem = memoryCache.get(mediaId);
    if (mem) {
      // 有缓存但进度不匹配时，仍先返回旧缓存（后续 effect 会刷新）
      return mem;
    }
    const local = readLocalCache(mediaId);
    if (local) {
      memoryCache.set(mediaId, local);
      return local;
    }
    return null;
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // posterUrl 存在时不提取
    if (posterUrl) {
      setThumbnail(posterUrl);
      return;
    }

    // 无 mediaId 或无 m3u8Url 时跳过
    if (!mediaId || !m3u8Url) return;

    // 检查缓存：命中 且 进度匹配 → 跳过提取
    const hasMem = memoryCache.has(mediaId);
    const cachedPct = cachedPctMap.get(mediaId);
    const pctMatches = roundedPct === cachedPct;

    if (hasMem && pctMatches) {
      setThumbnail(memoryCache.get(mediaId)!);
      return;
    }

    // 无内存缓存时尝试 localStorage（仅在进度也匹配时才命中）
    if (!hasMem) {
      const localCached = readLocalCache(mediaId);
      if (localCached && pctMatches) {
        memoryCache.set(mediaId, localCached);
        setThumbnail(localCached);
        return;
      }
    }

    // 需要在线提取
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    (async () => {
      await acquireSlot();
      if (cancelled || controller.signal.aborted) {
        releaseSlot();
        return;
      }

      const result = await extractFrame(m3u8Url, controller.signal, roundedPct);
      releaseSlot();

      if (cancelled) return;

      if (result) {
        memoryCache.set(mediaId, result);
        cachedPctMap.set(mediaId, roundedPct);
        // M2: 限制内存缓存大小，防止内存泄漏
        if (memoryCache.size > 200) {
          const firstKey = memoryCache.keys().next().value;
          if (firstKey) {
            memoryCache.delete(firstKey);
            cachedPctMap.delete(firstKey);
          }
        }
        writeLocalCache(mediaId, result);
        setThumbnail(result);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      abortRef.current = null;
    };
  }, [mediaId, m3u8Url, posterUrl, roundedPct]);

  return thumbnail;
}
