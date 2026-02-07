import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { Film, Play, Plus, Star } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
import { historyApi } from '../services/historyApi.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { FavoriteButton } from '../components/media/FavoriteButton.js';
import { QualitySelector } from '../components/media/QualitySelector.js';
import { AddToPlaylistModal } from '../components/playlist/AddToPlaylistModal.js';
import { useWatchProgress } from '../hooks/useWatchProgress.js';
import { useVideoThumbnail } from '../hooks/useVideoThumbnail.js';
import { formatDate } from '../lib/utils.js';

export function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const { data: media, isLoading, error } = useQuery({
    queryKey: ['media', id],
    queryFn: () => mediaApi.getById(id!),
    enabled: !!id,
  });

  const { data: progress } = useQuery({
    queryKey: ['watchProgress', id],
    queryFn: () => historyApi.getProgress(id!),
    enabled: !!id,
  });

  const { handleTimeUpdate } = useWatchProgress({ mediaId: id! });

  // 使用缩略图 hook 获取封面
  const thumbnail = useVideoThumbnail(
    media?.id ?? '',
    media?.m3u8Url ?? '',
    media?.posterUrl,
  );

  // Increment views
  useEffect(() => {
    if (id) {
      mediaApi.incrementViews(id).catch(() => {});
    }
  }, [id]);

  // 播放器可见后自动滚动
  useEffect(() => {
    if (showPlayer && playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showPlayer]);

  function handlePlay() {
    setShowPlayer(true);
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="relative -mx-6 -mt-4 lg:-mx-8 h-[400px] bg-emby-bg-input" />
        <div className="max-w-5xl mx-auto mt-6 space-y-4">
          <div className="h-8 bg-emby-bg-input rounded w-1/3" />
          <div className="h-4 bg-emby-bg-input rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="text-center py-12">
        <p className="text-emby-text-secondary mb-4">媒体不存在或已被删除</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-emby-green text-white rounded-md hover:bg-emby-green-dark"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero section */}
      <div className="relative -mx-6 -mt-4 lg:-mx-8 overflow-hidden">
        {/* Background layer */}
        <div className="absolute inset-0">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover blur-2xl scale-110 opacity-30"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-emby-bg-elevated to-emby-bg-base" />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-emby-bg-base via-emby-bg-base/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-emby-bg-base/80 to-transparent" />
        </div>

        {/* Foreground content */}
        <div className="relative px-6 lg:px-8 py-10 flex gap-8 items-end min-h-[360px]">
          {/* Poster - hidden on mobile */}
          <div className="hidden md:block w-52 flex-shrink-0">
            <div className="aspect-[2/3] rounded-md overflow-hidden shadow-2xl">
              {thumbnail ? (
                <img src={thumbnail} alt={media.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emby-bg-card flex items-center justify-center">
                  <Film className="w-16 h-16 text-emby-text-muted" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-4">
            <h1 className="text-3xl font-bold text-white">{media.title}</h1>

            {/* Metadata row */}
            <div className="flex items-center gap-4 text-sm text-emby-text-secondary flex-wrap">
              {media.year && <span>{media.year}</span>}
              {media.rating && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  {media.rating.toFixed(1)}
                </span>
              )}
              {media.category && (
                <span className="px-2 py-0.5 bg-white/10 rounded text-emby-text-primary text-xs">{media.category.name}</span>
              )}
              <span>{media.views} 次播放</span>
              <span>添加于 {formatDate(media.createdAt)}</span>
            </div>

            {/* Tags */}
            {media.tags && media.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {media.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2.5 py-1 bg-white/10 text-emby-text-primary text-xs rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {media.description && (
              <p className="text-emby-text-primary leading-relaxed line-clamp-3">{media.description}</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-6 py-2.5 bg-emby-green text-white rounded-md hover:bg-emby-green-hover font-medium transition-colors"
              >
                <Play className="w-5 h-5 fill-white" />
                播放
              </button>
              <FavoriteButton mediaId={media.id} />
              <button
                onClick={() => setShowAddToPlaylist(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emby-text-secondary hover:text-white bg-emby-bg-input rounded-md hover:bg-emby-bg-elevated transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加到列表
              </button>
              <QualitySelector />
            </div>
          </div>
        </div>
      </div>

      {/* Player / Placeholder */}
      <div ref={playerRef} className="max-w-5xl mx-auto mt-6">
        {showPlayer ? (
          <VideoPlayer
            media={media}
            startTime={progress?.progress || 0}
            onTimeUpdate={handleTimeUpdate}
            autoPlay
          />
        ) : (
          <div
            onClick={handlePlay}
            className="aspect-video bg-emby-bg-card rounded-lg flex items-center justify-center cursor-pointer group hover:bg-emby-bg-elevated transition-colors relative overflow-hidden"
          >
            {/* 封面预览背景 */}
            {thumbnail && (
              <img
                src={thumbnail}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
              />
            )}
            <div className="relative w-20 h-20 bg-emby-green/80 group-hover:bg-emby-green rounded-full flex items-center justify-center transition-colors">
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Add to playlist modal */}
      <AddToPlaylistModal
        mediaId={media.id}
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
      />
    </div>
  );
}
