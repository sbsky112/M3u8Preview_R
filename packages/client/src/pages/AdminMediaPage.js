import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Film, Plus } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
export function AdminMediaPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ title: '', m3u8Url: '' });
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'media', page, search],
        queryFn: () => mediaApi.getAll({ page, limit: 20, search: search || undefined }),
    });
    const createMutation = useMutation({
        mutationFn: (payload) => mediaApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setShowAdd(false);
            setForm({ title: '', m3u8Url: '' });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => mediaApi.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
            queryClient.invalidateQueries({ queryKey: ['media'] });
            setEditId(null);
            setForm({ title: '', m3u8Url: '' });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => mediaApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
            queryClient.invalidateQueries({ queryKey: ['media'] });
        },
    });
    function startEdit(media) {
        setEditId(media.id);
        setForm({
            title: media.title,
            m3u8Url: media.m3u8Url,
            posterUrl: media.posterUrl || '',
            description: media.description || '',
            year: media.year || undefined,
            rating: media.rating || undefined,
        });
        setShowAdd(true);
    }
    function handleSubmit() {
        if (editId) {
            updateMutation.mutate({ id: editId, payload: form });
        }
        else {
            createMutation.mutate(form);
        }
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Film, { className: "w-6 h-6 text-emby-text-secondary" }), _jsx("h1", { className: "text-2xl font-bold text-white", children: "\u5A92\u4F53\u7BA1\u7406" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("input", { type: "text", value: search, onChange: e => setSearch(e.target.value), placeholder: "\u641C\u7D22...", className: "px-4 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green w-48" }), _jsxs("button", { onClick: () => { setShowAdd(!showAdd); setEditId(null); setForm({ title: '', m3u8Url: '' }); }, className: "px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark text-sm", children: [_jsx(Plus, { className: "w-4 h-4 inline" }), " \u6DFB\u52A0\u5A92\u4F53"] })] })] }), showAdd && (_jsxs("div", { className: "bg-emby-bg-card border border-emby-border-subtle rounded-lg p-4 space-y-3", children: [_jsx("h3", { className: "text-white font-medium", children: editId ? '编辑媒体' : '添加媒体' }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx("input", { value: form.title || '', onChange: e => setForm({ ...form, title: e.target.value }), placeholder: "\u6807\u9898 *", className: "px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green" }), _jsx("input", { value: form.m3u8Url || '', onChange: e => setForm({ ...form, m3u8Url: e.target.value }), placeholder: "M3U8 URL *", className: "px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green" }), _jsx("input", { value: form.posterUrl || '', onChange: e => setForm({ ...form, posterUrl: e.target.value }), placeholder: "\u6D77\u62A5 URL", className: "px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", value: form.year || '', onChange: e => setForm({ ...form, year: e.target.value ? parseInt(e.target.value) : undefined }), placeholder: "\u5E74\u4EFD", className: "flex-1 px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green" }), _jsx("input", { type: "number", step: "0.1", value: form.rating || '', onChange: e => setForm({ ...form, rating: e.target.value ? parseFloat(e.target.value) : undefined }), placeholder: "\u8BC4\u5206", className: "flex-1 px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green" })] })] }), _jsx("textarea", { value: form.description || '', onChange: e => setForm({ ...form, description: e.target.value }), placeholder: "\u63CF\u8FF0", rows: 2, className: "w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleSubmit, disabled: !form.title?.trim() || !form.m3u8Url?.trim(), className: "px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark disabled:opacity-50 text-sm", children: editId ? '保存修改' : '添加' }), _jsx("button", { onClick: () => { setShowAdd(false); setEditId(null); }, className: "px-4 py-2 bg-emby-bg-input text-emby-text-primary rounded-lg hover:bg-emby-bg-elevated text-sm", children: "\u53D6\u6D88" })] })] })), _jsx("div", { className: "bg-emby-bg-card border border-emby-border-subtle rounded-lg overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-emby-border-subtle", children: [_jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u6807\u9898" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u5206\u7C7B" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u5E74\u4EFD" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u8BC4\u5206" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u64AD\u653E\u91CF" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u72B6\u6001" }), _jsx("th", { className: "px-4 py-3 text-left text-emby-text-secondary font-medium", children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: isLoading ? (Array.from({ length: 5 }).map((_, i) => (_jsx("tr", { className: "border-b border-emby-border-subtle/50", children: _jsx("td", { colSpan: 7, className: "px-4 py-3", children: _jsx("div", { className: "h-5 bg-emby-bg-input rounded animate-pulse" }) }) }, i)))) : data?.items?.map((media) => (_jsxs("tr", { className: "border-b border-emby-border-subtle/50 hover:bg-emby-bg-input/30", children: [_jsx("td", { className: "px-4 py-3", children: _jsx(Link, { to: `/media/${media.id}`, className: "text-white hover:text-emby-green-light font-medium", children: media.title }) }), _jsx("td", { className: "px-4 py-3 text-emby-text-secondary", children: media.category?.name || '-' }), _jsx("td", { className: "px-4 py-3 text-emby-text-secondary", children: media.year || '-' }), _jsx("td", { className: "px-4 py-3 text-emby-text-secondary", children: media.rating?.toFixed(1) || '-' }), _jsx("td", { className: "px-4 py-3 text-emby-text-secondary", children: media.views }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `px-2 py-0.5 rounded text-xs ${media.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`, children: media.status }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => startEdit(media), className: "text-emby-green-light hover:text-emby-green-hover text-xs", children: "\u7F16\u8F91" }), _jsx("button", { onClick: () => {
                                                        if (confirm(`确定要删除 "${media.title}" 吗？`)) {
                                                            deleteMutation.mutate(media.id);
                                                        }
                                                    }, className: "text-red-400 hover:text-red-300 text-xs", children: "\u5220\u9664" })] }) })] }, media.id))) })] }) }), data && data.totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: "px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated text-sm", children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { className: "text-emby-text-secondary text-sm", children: [page, " / ", data.totalPages] }), _jsx("button", { onClick: () => setPage(Math.min(data.totalPages, page + 1)), disabled: page === data.totalPages, className: "px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated text-sm", children: "\u4E0B\u4E00\u9875" })] }))] }));
}
