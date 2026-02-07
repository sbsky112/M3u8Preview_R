import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowLeft, Film, Play, Plus, Star } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
import { FavoriteButton } from '../components/media/FavoriteButton.js';
import { MediaCard } from '../components/media/MediaCard.js';
import { AddToPlaylistModal } from '../components/playlist/AddToPlaylistModal.js';
import { ScrollRow } from '../components/ui/ScrollRow.js';
import { useVideoThumbnail } from '../hooks/useVideoThumbnail.js';
import { useProgressMap } from '../hooks/useProgressMap.js';
import { formatDate } from '../lib/utils.js';

export function MediaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const { data: media, isLoading, error } = useQuery({
    queryKey: ['media', id],
    queryFn: () => mediaApi.getById(id!),
    enabled: !!id,
  });

  // 同类推荐
  const { data: categoryMedia } = useQuery({
    queryKey: ['media', 'category', media?.categoryId],
    queryFn: () => mediaApi.getAll({ categoryId: media!.categoryId!, limit: 12 }),
    enabled: !!media?.categoryId,
  });

  // 随机推荐
  const { data: randomMedia } = useQuery({
    queryKey: ['media', 'random-detail', id],
    queryFn: () => mediaApi.getRandom(12),
    enabled: !!media,
  });

  // 使用缩略图 hook 获取封面
  const thumbnail = useVideoThumbnail(
    media?.id ?? '',
    media?.m3u8Url ?? '',
    media?.posterUrl,
  );

  const { data: progressMap } = useProgressMap();

  // Increment views
  useEffect(() => {
    if (id) {
      mediaApi.incrementViews(id).catch(() => {});
    }
  }, [id]);

  function handlePlay() {
    navigate(`/play/${media!.id}`);
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
          {/* 返回按钮 */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 lg:left-6 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors z-10"
            aria-label="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

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
            </div>
          </div>
        </div>
      </div>

      {/* 推荐内容 */}
      <div className="max-w-5xl mx-auto mt-8 space-y-8 pb-8">
        {/* 同类推荐 */}
        {categoryMedia?.items && categoryMedia.items.filter(m => m.id !== media.id).length > 0 && (
          <ScrollRow title="同类推荐">
            {categoryMedia.items
              .filter(m => m.id !== media.id)
              .map(m => {
                const prog = progressMap?.[m.id];
                return (
                  <div key={m.id} className="w-[140px] sm:w-[160px] lg:w-[170px] flex-shrink-0 snap-start">
                    <MediaCard media={m} variant="portrait" showProgress={!!prog} progress={prog?.percentage} completed={prog?.completed} />
                  </div>
                );
              })}
          </ScrollRow>
        )}

        {/* 随机推荐 */}
        {randomMedia && randomMedia.filter(m => m.id !== media.id).length > 0 && (
          <ScrollRow title="你可能喜欢">
            {randomMedia
              .filter(m => m.id !== media.id)
              .map(m => {
                const prog = progressMap?.[m.id];
                return (
                  <div key={m.id} className="w-[140px] sm:w-[160px] lg:w-[170px] flex-shrink-0 snap-start">
                    <MediaCard media={m} variant="portrait" showProgress={!!prog} progress={prog?.percentage} completed={prog?.completed} />
                  </div>
                );
              })}
          </ScrollRow>
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
