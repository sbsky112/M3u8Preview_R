import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Film } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
import { MediaGrid } from '../components/media/MediaGrid.js';
import { useProgressMap } from '../hooks/useProgressMap.js';

export function ArtistDetailPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const artistName = name ? decodeURIComponent(name) : '';

  const { data, isLoading } = useQuery({
    queryKey: ['media', 'artist', artistName],
    queryFn: () => mediaApi.getAll({ artist: artistName, limit: 100 }),
    enabled: !!artistName,
  });

  const { data: progressMap } = useProgressMap();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-emby-bg-input rounded w-48" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-emby-bg-input rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-emby-bg-elevated text-emby-text-secondary hover:text-white transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-full bg-emby-bg-elevated flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-emby-text-secondary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">{artistName}</h1>
          <p className="text-sm text-emby-text-secondary flex items-center gap-1">
            <Film className="w-3.5 h-3.5" />
            {data?.total ?? 0} 部作品
          </p>
        </div>
      </div>

      {/* 视频网格 */}
      <MediaGrid
        items={data?.items ?? []}
        emptyMessage="该作者暂无关联视频"
        progressMap={progressMap}
      />
    </div>
  );
}
