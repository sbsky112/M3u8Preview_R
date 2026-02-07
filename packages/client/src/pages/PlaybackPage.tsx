import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
import { historyApi } from '../services/historyApi.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { QualitySelector } from '../components/media/QualitySelector.js';
import { useWatchProgress } from '../hooks/useWatchProgress.js';

const OVERLAY_TIMEOUT = 3000;

export function PlaybackPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [overlayVisible, setOverlayVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: media, isLoading, error } = useQuery({
    queryKey: ['media', id],
    queryFn: () => mediaApi.getById(id!),
    enabled: !!id,
  });

  const { data: progress, isFetched: progressFetched } = useQuery({
    queryKey: ['watchProgress', id],
    queryFn: () => historyApi.getProgress(id!),
    enabled: !!id,
  });

  const { handleTimeUpdate } = useWatchProgress({ mediaId: id! });

  // 显示覆盖栏并重置隐藏定时器
  const showOverlay = useCallback(() => {
    setOverlayVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setOverlayVisible(false);
    }, OVERLAY_TIMEOUT);
  }, []);

  // 初始化：启动自动隐藏定时器
  useEffect(() => {
    hideTimerRef.current = setTimeout(() => {
      setOverlayVisible(false);
    }, OVERLAY_TIMEOUT);
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // 返回时刷新进度数据，确保详情页能看到最新进度
  // 延迟 invalidate，等待 sendBeacon 的进度数据先到达服务端
  useEffect(() => {
    return () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['watchProgress', id] });
        queryClient.invalidateQueries({ queryKey: ['progressMap'] });
      }, 300);
    };
  }, [id, queryClient]);

  // 键盘快捷键：Escape 返回详情页
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(-1);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  function handleBack() {
    navigate(-1);
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emby-green"></div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-emby-text-secondary mb-4">媒体不存在或已被删除</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-emby-green text-white rounded-md hover:bg-emby-green-dark"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black z-50"
      style={{ cursor: overlayVisible ? 'default' : 'none' }}
      onMouseMove={showOverlay}
      onTouchStart={showOverlay}
    >
      {/* 全屏播放器 */}
      {progressFetched ? (
        <VideoPlayer
          media={media}
          startTime={progress?.progress || 0}
          onTimeUpdate={handleTimeUpdate}
          autoPlay
          fillContainer
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emby-green" />
        </div>
      )}

      {/* 顶部覆盖栏 */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 flex items-center gap-4 transition-opacity duration-300 ${
          overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          aria-label="返回"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-medium text-lg truncate flex-1">{media.title}</h1>
        <QualitySelector dropDirection="down" />
      </div>
    </div>
  );
}
