import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderTree, Plus, Pencil, Trash2 } from 'lucide-react';
import { categoryApi } from '../services/categoryApi.js';
import type { Category, CategoryCreateRequest } from '@m3u8-preview/shared';

/** 将中文/英文名称转换为 URL 友好的 slug */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const emptyForm: CategoryCreateRequest = { name: '', slug: '', posterUrl: '' };

export function AdminCategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryCreateRequest>({ ...emptyForm });
  const [autoSlug, setAutoSlug] = useState(true);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CategoryCreateRequest) => categoryApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CategoryCreateRequest> }) =>
      categoryApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setForm({ ...emptyForm });
    setAutoSlug(true);
  }

  function startEdit(cat: Category) {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, posterUrl: cat.posterUrl || '' });
    setAutoSlug(false);
    setShowForm(true);
  }

  function handleNameChange(name: string) {
    const updated = { ...form, name };
    if (autoSlug) {
      updated.slug = generateSlug(name);
    }
    setForm(updated);
  }

  function handleSlugChange(slug: string) {
    setAutoSlug(false);
    setForm({ ...form, slug });
  }

  function handleSubmit() {
    const payload: CategoryCreateRequest = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      posterUrl: form.posterUrl?.trim() || undefined,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const mutationError = createMutation.error || updateMutation.error || deleteMutation.error;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <FolderTree className="w-6 h-6 text-emby-text-secondary" />
          <h1 className="text-2xl font-bold text-white">分类管理</h1>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ ...emptyForm }); setAutoSlug(true); }}
          className="px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark text-sm"
        >
          <Plus className="w-4 h-4 inline" /> 新建分类
        </button>
      </div>

      {/* 错误提示 */}
      {mutationError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm">
          {(mutationError as any)?.response?.data?.error || '操作失败，请重试'}
        </div>
      )}

      {/* 创建/编辑表单 */}
      {showForm && (
        <div className="bg-emby-bg-card border border-emby-border-subtle rounded-lg p-4 space-y-3">
          <h3 className="text-white font-medium">{editId ? '编辑分类' : '新建分类'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="分类名称 *"
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
            />
            <div className="relative">
              <input
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="Slug *（URL 标识）"
                className="w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
              />
              {autoSlug && form.name && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emby-text-muted">自动</span>
              )}
            </div>
            <input
              value={form.posterUrl || ''}
              onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
              placeholder="海报 URL（可选）"
              className="px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.slug.trim() || isPending}
              className="px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark disabled:opacity-50 text-sm"
            >
              {isPending ? '提交中...' : editId ? '保存修改' : '创建'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-emby-bg-input text-emby-text-primary rounded-lg hover:bg-emby-bg-elevated text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 分类表格 */}
      <div className="bg-emby-bg-card border border-emby-border-subtle rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-emby-border-subtle">
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">名称</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">关联媒体数</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">创建时间</th>
              <th className="px-4 py-3 text-left text-emby-text-secondary font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-emby-border-subtle/50">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-5 bg-emby-bg-input rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : categories?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-emby-text-muted">
                  暂无分类，点击"新建分类"添加
                </td>
              </tr>
            ) : categories?.map((cat: Category) => (
              <tr key={cat.id} className="border-b border-emby-border-subtle/50 hover:bg-emby-bg-input/30">
                <td className="px-4 py-3 text-white font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-emby-text-secondary font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-emby-text-secondary">{cat._count?.media ?? 0}</td>
                <td className="px-4 py-3 text-emby-text-muted text-xs">
                  {new Date(cat.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => startEdit(cat)}
                      className="flex items-center gap-1 text-emby-green-light hover:text-emby-green-hover text-xs"
                    >
                      <Pencil className="w-3.5 h-3.5" /> 编辑
                    </button>
                    <button
                      onClick={() => {
                        const mediaCount = cat._count?.media ?? 0;
                        const msg = mediaCount > 0
                          ? `分类"${cat.name}"下有 ${mediaCount} 个媒体，删除后这些媒体将变为"未分类"。确定删除吗？`
                          : `确定要删除分类"${cat.name}"吗？`;
                        if (confirm(msg)) {
                          deleteMutation.mutate(cat.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      {categories && (
        <div className="text-emby-text-secondary text-sm">
          共 {categories.length} 个分类
        </div>
      )}
    </div>
  );
}
