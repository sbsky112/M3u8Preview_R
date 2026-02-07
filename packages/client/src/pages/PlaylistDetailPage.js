import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowLeft } from 'lucide-react';
import { playlistApi } from '../services/playlistApi.js';
export function PlaylistDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: playlist, isLoading } = useQuery({
        queryKey: ['playlist', id],
        queryFn: () => playlistApi.getById(id),
        enabled: !!id,
    });
    const removeMutation = useMutation({
        mutationFn: (mediaId) => playlistApi.removeItem(id, mediaId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', id] }),
    });
    if (isLoading) {
        return (_jsxs("div", { className: "animate-pulse space-y-4", children: [_jsx("div", { className: "h-8 bg-emby-bg-input rounded w-1/3" }), _jsx("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, i) => (_jsx("div", { className: "h-20 bg-emby-bg-input rounded" }, i))) })] }));
    }
    if (!playlist) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-emby-text-secondary mb-4", children: "\u64AD\u653E\u5217\u8868\u4E0D\u5B58\u5728" }), _jsx("button", { onClick: () => navigate('/playlists'), className: "px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark", children: "\u8FD4\u56DE\u5217\u8868" })] }));
    }
    return (_jsxs("div", { className: "space-y-6 max-w-4xl", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: playlist.name }), playlist.description && _jsx("p", { className: "text-emby-text-secondary mt-1", children: playlist.description }), _jsxs("p", { className: "text-sm text-emby-text-muted mt-1", children: [playlist.items?.length || 0, " \u4E2A\u89C6\u9891 \u00B7 ", playlist.isPublic ? '公开' : '私密'] })] }), _jsxs("button", { onClick: () => navigate('/playlists'), className: "flex items-center gap-1.5 px-3 py-1.5 text-sm text-emby-text-secondary hover:text-white bg-emby-bg-input rounded-md hover:bg-emby-bg-elevated", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), " \u8FD4\u56DE"] })] }), playlist.items && playlist.items.length > 0 ? (_jsx("div", { className: "space-y-2", children: playlist.items.sort((a, b) => a.position - b.position).map((item, index) => (_jsxs("div", { className: "flex items-center gap-4 bg-emby-bg-card border border-emby-border-subtle rounded-lg p-3 hover:border-emby-border transition-colors group", children: [_jsx("span", { className: "text-emby-text-muted text-sm w-6 text-center", children: index + 1 }), _jsxs(Link, { to: `/media/${item.mediaId}`, className: "flex-1 flex items-center gap-4 min-w-0", children: [_jsx("div", { className: "w-32 flex-shrink-0", children: _jsx("div", { className: "aspect-video bg-emby-bg-input rounded overflow-hidden", children: item.media?.posterUrl ? (_jsx("img", { src: item.media.posterUrl, alt: item.media.title, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center text-emby-text-muted text-xs", children: "\u65E0\u5C01\u9762" })) }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-white font-medium truncate group-hover:text-emby-green-light transition-colors", children: item.media?.title || '未知' }), item.media?.category && _jsx("p", { className: "text-emby-text-muted text-xs mt-0.5", children: item.media.category.name })] })] }), _jsx("button", { onClick: () => removeMutation.mutate(item.mediaId), className: "opacity-0 group-hover:opacity-100 text-emby-text-muted hover:text-red-400 transition-all p-1", title: "\u79FB\u9664", children: _jsx(X, { className: "w-4 h-4" }) })] }, item.id))) })) : (_jsx("div", { className: "text-center py-12 text-emby-text-muted", children: "\u64AD\u653E\u5217\u8868\u4E3A\u7A7A" }))] }));
}
