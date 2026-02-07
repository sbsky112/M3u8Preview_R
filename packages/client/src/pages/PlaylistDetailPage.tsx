import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowLeft } from 'lucide-react';
import { playlistApi } from '../services/playlistApi.js';
import type { PlaylistItem } from '@m3u8-preview/shared';

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistApi.getById(id!),
    enabled: !!id,
  });

  const removeMutation = useMutation({
    mutationFn: (mediaId: string) => playlistApi.removeItem(id!, mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', id] }),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-emby-bg-input rounded w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-emby-bg-input rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <p className="text-emby-text-secondary mb-4">播放列表不存在</p>
        <button onClick={() => navigate('/playlists')} className="px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{playlist.name}</h1>
          {playlist.description && <p className="text-emby-text-secondary mt-1">{playlist.description}</p>}
          <p className="text-sm text-emby-text-muted mt-1">{playlist.items?.length || 0} 个视频 · {playlist.isPublic ? '公开' : '私密'}</p>
        </div>
        <button onClick={() => navigate('/playlists')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emby-text-secondary hover:text-white bg-emby-bg-input rounded-md hover:bg-emby-bg-elevated">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
      </div>

      {playlist.items && playlist.items.length > 0 ? (
        <div className="space-y-2">
          {playlist.items.sort((a: PlaylistItem, b: PlaylistItem) => a.position - b.position).map((item: PlaylistItem, index: number) => (
            <div key={item.id} className="flex items-center gap-4 bg-emby-bg-card border border-emby-border-subtle rounded-lg p-3 hover:border-emby-border transition-colors group">
              <span className="text-emby-text-muted text-sm w-6 text-center">{index + 1}</span>
              <Link to={`/media/${item.mediaId}`} className="flex-1 flex items-center gap-4 min-w-0">
                <div className="w-32 flex-shrink-0">
                  <div className="aspect-video bg-emby-bg-input rounded overflow-hidden">
                    {item.media?.posterUrl ? (
                      <img src={item.media.posterUrl} alt={item.media.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emby-text-muted text-xs">无封面</div>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate group-hover:text-emby-green-light transition-colors">{item.media?.title || '未知'}</p>
                  {item.media?.category && <p className="text-emby-text-muted text-xs mt-0.5">{item.media.category.name}</p>}
                </div>
              </Link>
              <button
                onClick={() => removeMutation.mutate(item.mediaId)}
                className="opacity-0 group-hover:opacity-100 text-emby-text-muted hover:text-red-400 transition-all p-1"
                title="移除"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-emby-text-muted">播放列表为空</div>
      )}
    </div>
  );
}
