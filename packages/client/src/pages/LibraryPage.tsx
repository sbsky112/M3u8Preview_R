import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { mediaApi } from '../services/mediaApi.js';
import { categoryApi } from '../services/categoryApi.js';
import { MediaGrid } from '../components/media/MediaGrid.js';
import { useProgressMap } from '../hooks/useProgressMap.js';
import type { Category } from '@m3u8-preview/shared';

export function LibraryPage() {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const search = searchParams.get('search') || '';

  // H2: 搜索变化时重置分页
  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['media', 'list', { page, search, categoryId: selectedCategory, sortBy, sortOrder }],
    queryFn: () => mediaApi.getAll({
      page,
      limit: 24,
      search: search || undefined,
      categoryId: selectedCategory || undefined,
      sortBy: sortBy as any,
      sortOrder,
    }),
  });

  const { data: progressMap } = useProgressMap();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">
          {search ? `搜索: "${search}"` : '媒体库'}
        </h1>
        {data && <span className="text-sm text-emby-text-secondary">共 {data.total} 项</span>}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emby-green"
        >
          <option value="">全部分类</option>
          {categories?.map((cat: Category) => (
            <option key={cat.id} value={cat.id}>{cat.name} ({cat._count?.media || 0})</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emby-green"
        >
          <option value="createdAt">添加时间</option>
          <option value="title">标题</option>
          <option value="year">年份</option>
          <option value="rating">评分</option>
          <option value="views">播放量</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm hover:bg-emby-bg-elevated"
        >
          {sortOrder === 'desc' ? '降序' : '升序'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-emby-bg-input rounded-lg" />
              <div className="h-4 bg-emby-bg-input rounded mt-2 w-3/4" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <MediaGrid items={data.items} emptyMessage="没有找到匹配的媒体" progressMap={progressMap} />

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated transition-colors text-sm"
              >
                上一页
              </button>
              <span className="text-emby-text-secondary text-sm">{page} / {data.totalPages}</span>
              <button
                onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated transition-colors text-sm"
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
