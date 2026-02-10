import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderTree, ArrowLeft, Search, Plus, Trash2 } from 'lucide-react';
import { categoryApi } from '../services/categoryApi.js';
import { mediaApi } from '../services/mediaApi.js';
import { MediaGrid } from '../components/media/MediaGrid.js';
import { useProgressMap } from '../hooks/useProgressMap.js';
import { useAuthStore } from '../stores/authStore.js';
import type { Category, CategoryCreateRequest } from '@m3u8-preview/shared';

const PAGE_SIZE = 24;

// ==================== 相对时间格式化 ====================

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

// ==================== Slug 生成 ====================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ==================== 主组件 ====================

export function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  return (
    <div className="space-y-6">
      {selectedCategory ? (
        <CategoryDetail
          category={selectedCategory}
          onBack={() => setSelectedCategory(null)}
        />
      ) : (
        <CategoryOverview onSelect={setSelectedCategory} />
      )}
    </div>
  );
}

// ==================== 排序类型 ====================

type OverviewSortKey = 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc' | 'updated';

// ==================== 分类概览 ====================

function CategoryOverview({ onSelect }: { onSelect: (cat: Category) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<OverviewSortKey>('name-asc');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newPosterUrl, setNewPosterUrl] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  // 管理员创建分类
  const createMutation = useMutation({
    mutationFn: (payload: CategoryCreateRequest) => categoryApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCreate(false);
      setNewName('');
      setNewSlug('');
      setNewPosterUrl('');
      setAutoSlug(true);
    },
  });

  function handleNameChange(name: string) {
    setNewName(name);
    if (autoSlug) {
      setNewSlug(generateSlug(name));
    }
  }

  function handleCreateSubmit() {
    createMutation.mutate({
      name: newName.trim(),
      slug: newSlug.trim(),
      posterUrl: newPosterUrl.trim() || undefined,
    });
  }

  // 搜索 + 排序
  const filteredCategories = useMemo(() => {
    if (!categories) return [];

    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? categories.filter((cat) => cat.name.toLowerCase().includes(query))
      : [...categories];

    switch (sortKey) {
      case 'name-asc':
        return filtered.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      case 'name-desc':
        return filtered.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'));
      case 'count-desc':
        return filtered.sort((a, b) => (b._count?.media ?? 0) - (a._count?.media ?? 0));
      case 'count-asc':
        return filtered.sort((a, b) => (a._count?.media ?? 0) - (b._count?.media ?? 0));
      case 'updated':
        return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      default:
        return filtered;
    }
  }, [categories, searchQuery, sortKey]);

  const hasSearch = searchQuery.trim().length > 0;
  const isEmpty = filteredCategories.length === 0;

  return (
    <>
      {/* 标题 + 管理员创建按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderTree className="w-6 h-6 text-emby-green" />
          <h1 className="text-2xl font-bold text-white">分类</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowCreate(!showCreate); setNewName(''); setNewSlug(''); setNewPosterUrl(''); setAutoSlug(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark text-sm"
          >
            <Plus className="w-4 h-4" />
            新建分类
          </button>
        )}
      </div>

      {/* 管理员创建表单 */}
      {isAdmin && showCreate && (
        <div className="bg-emby-bg-card border border-emby-border-subtle rounded-lg p-4 space-y-3">
          {createMutation.error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-md text-sm">
              {(createMutation.error as any)?.response?.data?.error || '创建失败，请重试'}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="分类名称 *"
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
              autoFocus
            />
            <div className="relative">
              <input
                value={newSlug}
                onChange={(e) => { setAutoSlug(false); setNewSlug(e.target.value); }}
                placeholder="Slug *（URL 标识）"
                className="w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
              />
              {autoSlug && newName && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emby-text-muted">自动</span>
              )}
            </div>
            <input
              value={newPosterUrl}
              onChange={(e) => setNewPosterUrl(e.target.value)}
              placeholder="海报 URL（可选）"
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateSubmit}
              disabled={!newName.trim() || !newSlug.trim() || createMutation.isPending}
              className="px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark disabled:opacity-50 text-sm"
            >
              {createMutation.isPending ? '创建中...' : '创建'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-emby-bg-input text-emby-text-primary rounded-lg hover:bg-emby-bg-elevated text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 搜索 + 排序控件 */}
      {!isLoading && categories && categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emby-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索分类..."
              className="w-full pl-9 pr-3 py-2 bg-emby-bg-input border border-emby-border-subtle rounded-lg text-sm text-white placeholder:text-emby-text-muted focus:outline-none focus:ring-1 focus:ring-emby-green"
            />
          </div>

          {/* 排序下拉 */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as OverviewSortKey)}
            className="px-3 py-2 bg-emby-bg-input border border-emby-border-subtle rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emby-green"
          >
            <option value="name-asc">名称 A-Z</option>
            <option value="name-desc">名称 Z-A</option>
            <option value="count-desc">媒体数量 多-少</option>
            <option value="count-asc">媒体数量 少-多</option>
            <option value="updated">最近更新</option>
          </select>
        </div>
      )}

      {/* 分类卡片网格 */}
      {isLoading ? (
        <CategorySkeleton />
      ) : !categories || categories.length === 0 ? (
        <div className="text-center py-12 text-emby-text-muted">暂无分类</div>
      ) : isEmpty && hasSearch ? (
        <div className="text-center py-12 text-emby-text-muted">未找到匹配的分类</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onClick={() => onSelect(cat)} />
          ))}
        </div>
      )}
    </>
  );
}

// ==================== 分类卡片 ====================

function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  const mediaCount = category._count?.media ?? 0;

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-lg overflow-hidden bg-emby-bg-card border border-emby-border-subtle hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-emby-green"
    >
      {/* 封面 */}
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        {category.posterUrl ? (
          <img
            src={category.posterUrl}
            alt={category.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emby-green/20 to-emby-bg-elevated flex items-center justify-center">
            <span className="text-3xl font-bold text-emby-text-secondary">
              {category.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-white truncate">{category.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-emby-text-secondary">{mediaCount} 项</p>
          <p className="text-xs text-emby-text-muted">{formatRelativeTime(category.updatedAt)}</p>
        </div>
      </div>
    </button>
  );
}

// ==================== 分类详情（无限滚动） ====================

function CategoryDetail({ category, onBack }: { category: Category; onBack: () => void }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'ADMIN';

  // 排序与筛选状态
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [yearFilter, setYearFilter] = useState<string>('');

  // 管理员删除分类
  const deleteMutation = useMutation({
    mutationFn: () => categoryApi.delete(category.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      onBack();
    },
  });

  function handleDelete() {
    const mediaCount = category._count?.media ?? 0;
    const msg = mediaCount > 0
      ? `分类"${category.name}"下有 ${mediaCount} 个媒体，删除后这些媒体将变为"未分类"。确定删除吗？`
      : `确定要删除分类"${category.name}"吗？`;
    if (confirm(msg)) {
      deleteMutation.mutate();
    }
  }

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['media', 'category', category.id, sortBy, sortOrder],
    queryFn: ({ pageParam }) => mediaApi.getAll({
      page: pageParam,
      limit: PAGE_SIZE,
      categoryId: category.id,
      sortBy: sortBy as 'title' | 'createdAt' | 'year' | 'rating' | 'views',
      sortOrder,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    gcTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const { data: progressMap } = useProgressMap();

  // 哨兵元素进入视口时自动加载下一页
  const handleIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          handleIntersect();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // 去重 + 年份前端过滤
  const allItems = useMemo(() => {
    const items = data?.pages.flatMap((page) => page.items) ?? [];
    const seen = new Set<string>();
    const deduped = items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // 年份筛选（后端无 year 过滤参数，前端实现）
    const yearNum = yearFilter ? parseInt(yearFilter, 10) : NaN;
    if (!isNaN(yearNum)) {
      return deduped.filter((item) => item.year === yearNum);
    }
    return deduped;
  }, [data, yearFilter]);

  const total = data?.pages[0]?.total ?? 0;
  const hasPoster = !!category.posterUrl;

  return (
    <>
      {/* Hero 头部 */}
      <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-6">
        {/* 背景图 */}
        {hasPoster && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={category.posterUrl!}
              alt=""
              className="w-full h-full object-cover blur-xl scale-110"
            />
            <div className="absolute inset-0 bg-emby-bg-primary/80" />
          </div>
        )}

        <div className={`relative px-4 sm:px-6 ${hasPoster ? 'py-10' : 'py-6'}`}>
          {/* 返回按钮 + 管理员删除按钮 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-emby-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">返回</span>
            </button>
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {deleteMutation.isPending ? '删除中...' : '删除分类'}
              </button>
            )}
          </div>

          {/* 分类信息 */}
          <div className="flex items-end gap-4">
            {hasPoster && (
              <img
                src={category.posterUrl!}
                alt={category.name}
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg shadow-lg flex-shrink-0"
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{category.name}</h1>
              {data && (
                <p className="text-sm text-emby-text-secondary mt-1">共 {total} 项媒体</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 排序与筛选控件 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* sortBy 下拉 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 bg-emby-bg-input border border-emby-border-subtle rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-emby-green"
        >
          <option value="createdAt">添加时间</option>
          <option value="title">标题</option>
          <option value="year">年份</option>
          <option value="rating">评分</option>
          <option value="views">播放量</option>
        </select>

        {/* sortOrder 切换 */}
        <button
          onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="px-3 py-2 bg-emby-bg-input border border-emby-border-subtle rounded-lg text-sm text-white hover:bg-emby-bg-elevated transition-colors"
        >
          {sortOrder === 'desc' ? '降序' : '升序'}
        </button>

        {/* 年份筛选 */}
        <input
          type="text"
          value={yearFilter}
          onChange={(e) => {
            // 只允许数字输入
            const val = e.target.value.replace(/\D/g, '');
            setYearFilter(val);
          }}
          placeholder="年份筛选"
          className="w-28 px-3 py-2 bg-emby-bg-input border border-emby-border-subtle rounded-lg text-sm text-white placeholder:text-emby-text-muted focus:outline-none focus:ring-1 focus:ring-emby-green"
        />
      </div>

      {/* 媒体列表 */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-emby-bg-input rounded-lg" />
              <div className="h-4 bg-emby-bg-input rounded mt-2 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <MediaGrid items={allItems} emptyMessage="该分类暂无媒体" progressMap={progressMap} />

          {/* 加载失败重试 */}
          {isError && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-red-400 text-sm">加载失败</p>
              <button
                onClick={() => fetchNextPage()}
                className="px-4 py-2 bg-emby-green text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                重试
              </button>
            </div>
          )}

          {/* 哨兵元素：滚动到此处时自动加载下一页 */}
          <div ref={sentinelRef}>
            {isFetchingNextPage && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] bg-emby-bg-input rounded-lg" />
                    <div className="h-4 bg-emby-bg-input rounded mt-2 w-3/4" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 到底提示 */}
          {!hasNextPage && allItems.length > 0 && (
            <div className="text-center py-6 text-emby-text-muted text-sm">没有更多了</div>
          )}
        </>
      )}
    </>
  );
}

// ==================== 骨架屏 ====================

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg overflow-hidden">
          <div className="aspect-video bg-emby-bg-input rounded-t-lg" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-emby-bg-input rounded w-3/4" />
            <div className="h-3 bg-emby-bg-input rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
