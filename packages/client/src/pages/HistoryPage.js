import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Film, Trash2 } from 'lucide-react';
import { historyApi } from '../services/historyApi.js';
import { formatDuration } from '../lib/utils.js';
export function HistoryPage() {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ['history', page],
        queryFn: () => historyApi.getAll(page, 20),
    });
    const clearMutation = useMutation({
        mutationFn: () => historyApi.clearAll(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => historyApi.deleteOne(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "\u89C2\u770B\u5386\u53F2" }), _jsxs("div", { className: "flex items-center gap-3", children: [data && _jsxs("span", { className: "text-sm text-emby-text-secondary", children: ["\u5171 ", data.total, " \u6761"] }), data && data.total > 0 && (_jsx("button", { onClick: () => {
                                    if (confirm('确定要清空所有观看历史吗？')) {
                                        clearMutation.mutate();
                                    }
                                }, className: "px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors", children: "\u6E05\u7A7A\u5386\u53F2" }))] })] }), isLoading ? (_jsx("div", { className: "space-y-4", children: Array.from({ length: 6 }).map((_, i) => (_jsxs("div", { className: "animate-pulse flex gap-4", children: [_jsx("div", { className: "w-48 aspect-video bg-emby-bg-input rounded-md flex-shrink-0" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx("div", { className: "h-5 bg-emby-bg-input rounded w-1/3" }), _jsx("div", { className: "h-4 bg-emby-bg-input rounded w-1/4" })] })] }, i))) })) : data && data.items.length > 0 ? (_jsxs("div", { className: "space-y-0", children: [data.items.map((item) => (_jsxs("div", { className: "flex gap-4 p-3 border-b border-emby-border-subtle/50 hover:bg-white/5 transition-colors group", children: [_jsx(Link, { to: `/media/${item.mediaId}`, className: "w-48 flex-shrink-0", children: _jsxs("div", { className: "aspect-video bg-emby-bg-input rounded-md overflow-hidden relative", children: [item.media?.posterUrl ? (_jsx("img", { src: item.media.posterUrl, alt: item.media?.title, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(Film, { className: "w-8 h-8 text-emby-text-muted" }) })), _jsx("div", { className: "absolute bottom-0 left-0 right-0 h-1 bg-emby-border", children: _jsx("div", { className: "h-full bg-emby-green", style: { width: `${Math.min(100, item.percentage)}%` } }) })] }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(Link, { to: `/media/${item.mediaId}`, className: "text-white font-medium hover:text-emby-green-light transition-colors line-clamp-1", children: item.media?.title || '未知媒体' }), _jsx("p", { className: "text-sm text-emby-text-secondary mt-1", children: item.completed ? '已看完' : `观看至 ${formatDuration(item.progress)} / ${formatDuration(item.duration)}` }), _jsxs("p", { className: "text-xs text-emby-text-muted mt-1", children: ["\u8FDB\u5EA6: ", Math.round(item.percentage), "%"] })] }), _jsx("button", { onClick: () => deleteMutation.mutate(item.id), className: "opacity-0 group-hover:opacity-100 text-emby-text-muted hover:text-red-400 transition-all p-1 self-start", title: "\u5220\u9664", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }, item.id))), data.totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-center gap-2 pt-4", children: [_jsx("button", { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: "px-4 py-2 bg-emby-bg-input text-white rounded-md disabled:opacity-50 hover:bg-emby-bg-elevated text-sm", children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { className: "text-emby-text-secondary text-sm", children: [page, " / ", data.totalPages] }), _jsx("button", { onClick: () => setPage(Math.min(data.totalPages, page + 1)), disabled: page === data.totalPages, className: "px-4 py-2 bg-emby-bg-input text-white rounded-md disabled:opacity-50 hover:bg-emby-bg-elevated text-sm", children: "\u4E0B\u4E00\u9875" })] }))] })) : (_jsx("div", { className: "text-center py-12 text-emby-text-muted", children: "\u6682\u65E0\u89C2\u770B\u8BB0\u5F55" }))] }));
}
