import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Film, Plus, Trash2, ToggleLeft, X } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
import { adminApi } from '../services/adminApi.js';
import { categoryApi } from '../services/categoryApi.js';
import type { Media, MediaCreateRequest, Category } from '@m3u8-preview/shared';

export function AdminMediaPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MediaCreateRequest>>({ title: '', m3u8Url: '' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // 搜索变化时重置分页和选择
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'media', page, pageSize, search],
    queryFn: () => mediaApi.getAll({ page, limit: pageSize, search: search || undefined }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  // 当前页所有 ID
  const currentPageIds = useMemo(
    () => data?.items?.map((m: Media) => m.id) ?? [],
    [data],
  );

  const isAllSelected = currentPageIds.length > 0 && currentPageIds.every((id: string) => selectedIds.has(id));
  const isPartialSelected = !isAllSelected && currentPageIds.some((id: string) => selectedIds.has(id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentPageIds.forEach((id: string) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentPageIds.forEach((id: string) => next.add(id));
        return next;
      });
    }
  }, [isAllSelected, currentPageIds]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const invalidateBatch = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    queryClient.invalidateQueries({ queryKey: ['media'] });
    clearSelection();
  };

  const createMutation = useMutation({
    mutationFn: (payload: MediaCreateRequest) => mediaApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setShowAdd(false);
      setForm({ title: '', m3u8Url: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MediaCreateRequest> }) => mediaApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setEditId(null);
      setForm({ title: '', m3u8Url: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => adminApi.batchDeleteMedia(ids),
    onSuccess: invalidateBatch,
  });

  const batchStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 'ACTIVE' | 'INACTIVE' }) =>
      adminApi.batchUpdateMediaStatus(ids, status),
    onSuccess: invalidateBatch,
  });

  const batchCategoryMutation = useMutation({
    mutationFn: ({ ids, categoryId }: { ids: string[]; categoryId: string | null }) =>
      adminApi.batchUpdateMediaCategory(ids, categoryId),
    onSuccess: invalidateBatch,
  });

  const batchError = batchDeleteMutation.error || batchStatusMutation.error || batchCategoryMutation.error;
  const isBatchPending = batchDeleteMutation.isPending || batchStatusMutation.isPending || batchCategoryMutation.isPending;

  function startEdit(media: Media) {
    setEditId(media.id);
    setForm({
      title: media.title,
      m3u8Url: media.m3u8Url,
      posterUrl: media.posterUrl || '',
      description: media.description || '',
      year: media.year || undefined,
      rating: media.rating || undefined,
      artist: media.artist || '',
    });
    setShowAdd(true);
  }

  function handleSubmit() {
    if (editId) {
      updateMutation.mutate({ id: editId, payload: form });
    } else {
      createMutation.mutate(form as MediaCreateRequest);
    }
  }

  function handleBatchDelete() {
    const ids = Array.from(selectedIds);
    if (confirm(`确定要删除选中的 ${ids.length} 项吗？此操作不可撤销。`)) {
      batchDeleteMutation.mutate(ids);
    }
  }

  function handleBatchCategoryChange(value: string) {
    const ids = Array.from(selectedIds);
    const categoryId = value === '__remove__' ? null : value;
    batchCategoryMutation.mutate({ ids, categoryId });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3"><Film className="w-6 h-6 text-emby-text-secondary" /><h1 className="text-2xl font-bold text-white">媒体管理</h1></div>
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索..."
            className="px-4 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green w-48"
          />
          <button
            onClick={() => { setShowAdd(!showAdd); setEditId(null); setForm({ title: '', m3u8Url: '' }); }}
            className="px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark text-sm"
          >
            <Plus className="w-4 h-4 inline" /> 添加媒体
          </button>
        </div>
      </div>

      {/* 操作错误提示 */}
      {(createMutation.error || updateMutation.error || deleteMutation.error || batchError) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm">
          {(createMutation.error as any)?.response?.data?.error
            || (updateMutation.error as any)?.response?.data?.error
            || (deleteMutation.error as any)?.response?.data?.error
            || (batchError as any)?.response?.data?.error
            || '操作失败，请重试'}
        </div>
      )}

      {/* Add/Edit form */}
      {showAdd && (
        <div className="bg-emby-bg-card border border-emby-border-subtle rounded-lg p-4 space-y-3">
          <h3 className="text-white font-medium">{editId ? '编辑媒体' : '添加媒体'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.title || ''}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="标题 *"
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
            />
            <input
              value={form.m3u8Url || ''}
              onChange={e => setForm({ ...form, m3u8Url: e.target.value })}
              placeholder="M3U8 URL *"
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
            />
            <input
              value={form.posterUrl || ''}
              onChange={e => setForm({ ...form, posterUrl: e.target.value })}
              placeholder="海报 URL"
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
            />
            <input
              value={form.artist || ''}
              onChange={e => setForm({ ...form, artist: e.target.value })}
              placeholder="作者"
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={form.year || ''}
                onChange={e => setForm({ ...form, year: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="年份"
                className="flex-1 px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
              />
              <input
                type="number"
                step="0.1"
                value={form.rating || ''}
                onChange={e => setForm({ ...form, rating: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="评分"
                className="flex-1 px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
              />
            </div>
          </div>
          <textarea
            value={form.description || ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="描述"
            rows={2}
            className="w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!form.title?.trim() || !form.m3u8Url?.trim()}
              className="px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark disabled:opacity-50 text-sm"
            >
              {editId ? '保存修改' : '添加'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditId(null); }}
              className="px-4 py-2 bg-emby-bg-input text-emby-text-primary rounded-lg hover:bg-emby-bg-elevated text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 批量操作工具栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 flex-wrap bg-emby-bg-card border border-emby-green/30 rounded-lg px-4 py-3">
          <span className="text-sm text-emby-text-secondary">已选 {selectedIds.size} 项</span>
          <button
            onClick={handleBatchDelete}
            disabled={isBatchPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 text-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> 批量删除
          </button>
          <button
            onClick={() => batchStatusMutation.mutate({ ids: Array.from(selectedIds), status: 'ACTIVE' })}
            disabled={isBatchPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 text-xs disabled:opacity-50"
          >
            <ToggleLeft className="w-3.5 h-3.5" /> 设为 ACTIVE
          </button>
          <button
            onClick={() => batchStatusMutation.mutate({ ids: Array.from(selectedIds), status: 'INACTIVE' })}
            disabled={isBatchPending}
            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-md hover:bg-yellow-500/30 text-xs disabled:opacity-50"
          >
            <ToggleLeft className="w-3.5 h-3.5" /> 设为 INACTIVE
          </button>
          <select
            onChange={e => { if (e.target.value) { handleBatchCategoryChange(e.target.value); e.target.value = ''; } }}
            disabled={isBatchPending}
            defaultValue=""
            className="px-3 py-1.5 bg-emby-bg-input border border-emby-border rounded-md text-emby-text-secondary text-xs disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emby-green"
          >
            <option value="" disabled>批量修改分类</option>
            <option value="__remove__">移除分类</option>
            {categories?.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            onClick={clearSelection}
            className="flex items-center gap-1 px-3 py-1.5 bg-emby-bg-input text-emby-text-secondary rounded-md hover:bg-emby-bg-elevated text-xs ml-auto"
          >
            <X className="w-3.5 h-3.5" /> 取消选择
          </button>
        </div>
      )}

      {/* Media table */}
      <div className="bg-emby-bg-card border border-emby-border-subtle rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-emby-border-subtle">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={el => { if (el) el.indeterminate = isPartialSelected; }}
                  onChange={toggleSelectAll}
                  className="rounded border-emby-border text-emby-green focus:ring-emby-green"
                />
              </th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">标题</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">分类</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">年份</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">评分</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">播放量</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">状态</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-emby-border-subtle/50">
                  <td colSpan={8} className="px-4 py-3"><div className="h-5 bg-emby-bg-input rounded animate-pulse" /></td>
                </tr>
              ))
            ) : data?.items?.map((media: Media) => (
              <tr key={media.id} className={`border-b border-emby-border-subtle/50 hover:bg-emby-bg-input/30 ${selectedIds.has(media.id) ? 'bg-emby-green/5' : ''}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(media.id)}
                    onChange={() => toggleSelect(media.id)}
                    className="rounded border-emby-border text-emby-green focus:ring-emby-green"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link to={`/media/${media.id}`} className="text-white hover:text-emby-green-light font-medium">{media.title}</Link>
                </td>
                <td className="px-4 py-3 text-emby-text-secondary">{media.category?.name || '-'}</td>
                <td className="px-4 py-3 text-emby-text-secondary">{media.year || '-'}</td>
                <td className="px-4 py-3 text-emby-text-secondary">{media.rating?.toFixed(1) || '-'}</td>
                <td className="px-4 py-3 text-emby-text-secondary">{media.views}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${media.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {media.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(media)} className="text-emby-green-light hover:text-emby-green-hover text-xs">编辑</button>
                    <button
                      onClick={() => {
                        if (confirm(`确定要删除 "${media.title}" 吗？`)) {
                          deleteMutation.mutate(media.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <span className="text-emby-text-secondary text-sm">共 {data.total} 项</span>
          <div className="flex items-center gap-2">
            {data.totalPages > 1 && (
              <>
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated text-sm">上一页</button>
                <span className="text-emby-text-secondary text-sm">{page} / {data.totalPages}</span>
                <button onClick={() => setPage(Math.min(data.totalPages, page + 1))} disabled={page === data.totalPages} className="px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated text-sm">下一页</button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-emby-text-secondary text-sm">每页显示</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emby-green"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-emby-text-secondary text-sm">条</span>
          </div>
        </div>
      )}
    </div>
  );
}
