import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { usePlayerStore } from '../../stores/playerStore.js';
import type { Media } from '@m3u8-preview/shared';

const MAX_NETWORK_RETRY = 5;
const MAX_MEDIA_RETRY = 3;

interface VideoPlayerProps {
  media: Media;
  startTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  autoPlay?: boolean;
  fillContainer?: boolean;
}

export function VideoPlayer({ media, startTime = 0, onTimeUpdate, autoPlay = false, fillContainer = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRetryRef = useRef(0);
  const mediaRetryRef = useRef(0);
  const { setPlaying, setCurrentTime, setDuration, setQualities, setQuality, quality, reset } = usePlayerStore();

  const initHls = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Destroy previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        startPosition: startTime,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hls.loadSource(media.m3u8Url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        const levels = data.levels.map((level, index) => ({
          index,
          height: level.height,
          bitrate: level.bitrate,
        }));
        setQualities(levels);

        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay blocked, user needs to interact
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkRetryRef.current < MAX_NETWORK_RETRY) {
                networkRetryRef.current++;
                const delay = Math.min(1000 * Math.pow(2, networkRetryRef.current - 1), 16000);
                console.warn(`HLS network error, retry ${networkRetryRef.current}/${MAX_NETWORK_RETRY} in ${delay}ms`);
                setTimeout(() => hls.startLoad(), delay);
              } else {
                console.error('HLS network error: max retries exceeded');
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              if (mediaRetryRef.current < MAX_MEDIA_RETRY) {
                mediaRetryRef.current++;
                console.warn(`HLS media error, retry ${mediaRetryRef.current}/${MAX_MEDIA_RETRY}`);
                hls.recoverMediaError();
              } else {
                console.error('HLS media error: max retries exceeded');
                hls.destroy();
              }
              break;
            default:
              console.error('Fatal HLS error:', data);
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = media.m3u8Url;
      video.currentTime = startTime;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }
  }, [media.m3u8Url, startTime, setQualities, autoPlay]);

  // Handle quality change
  useEffect(() => {
    if (hlsRef.current && quality !== undefined) {
      hlsRef.current.currentLevel = quality;
    }
  }, [quality]);

  // Initialize HLS
  useEffect(() => {
    initHls();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      reset(); // Reset playerStore on unmount
    };
  }, [initHls, reset]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration || 0);
    };

    const handleDurationChange = () => {
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [setCurrentTime, setDuration, setPlaying, onTimeUpdate]);

  // Keyboard shortcuts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (!video) return;
      // S6: 输入框内不触发快捷键
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.isContentEditable) {
        return;
      }
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case 'f':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            containerRef.current?.requestFullscreen();
          }
          break;
        case 'm':
          e.preventDefault();
          video.muted = !video.muted;
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className={fillContainer ? "relative bg-black w-full h-full overflow-hidden" : "relative bg-black rounded-lg overflow-hidden"}>
      <video
        ref={videoRef}
        className={fillContainer ? "w-full h-full object-contain" : "w-full aspect-video"}
        controls
        playsInline
      />
    </div>
  );
}
