import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { playlistApi } from '../services/playlistApi.js';
export function PlaylistsPage() {
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const queryClient = useQueryClient();
    const { data: playlists, isLoading } = useQuery({
        queryKey: ['playlists'],
        queryFn: () => playlistApi.getAll(),
    });
    const createMutation = useMutation({
        mutationFn: () => playlistApi.create(newName, newDesc || undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            setShowCreate(false);
            setNewName('');
            setNewDesc('');
        },
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => playlistApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "\u64AD\u653E\u5217\u8868" }), _jsx("button", { onClick: () => setShowCreate(!showCreate), className: "px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark text-sm", children: "+ \u65B0\u5EFA\u5217\u8868" })] }), showCreate && (_jsxs("div", { className: "bg-emby-bg-card border border-emby-border-subtle rounded-lg p-4 space-y-3", children: [_jsx("input", { type: "text", value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "\u64AD\u653E\u5217\u8868\u540D\u79F0", className: "w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green", autoFocus: true }), _jsx("input", { type: "text", value: newDesc, onChange: (e) => setNewDesc(e.target.value), placeholder: "\u63CF\u8FF0\uFF08\u53EF\u9009\uFF09", className: "w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => createMutation.mutate(), disabled: !newName.trim() || createMutation.isPending, className: "px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark disabled:opacity-50 text-sm", children: "\u521B\u5EFA" }), _jsx("button", { onClick: () => setShowCreate(false), className: "px-4 py-2 bg-emby-bg-input text-emby-text-primary rounded-lg hover:bg-emby-bg-elevated text-sm", children: "\u53D6\u6D88" })] })] })), isLoading ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: Array.from({ length: 4 }).map((_, i) => (_jsx("div", { className: "animate-pulse bg-emby-bg-input rounded-lg h-32" }, i))) })) : playlists && playlists.length > 0 ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: playlists.map((playlist) => (_jsxs("div", { className: "bg-emby-bg-card border border-emby-border-subtle rounded-lg p-4 hover:border-emby-border-light transition-colors group", children: [_jsxs(Link, { to: `/playlists/${playlist.id}`, className: "block", children: [_jsx("h3", { className: "text-white font-medium group-hover:text-emby-green-light transition-colors", children: playlist.name }), playlist.description && (_jsx("p", { className: "text-emby-text-muted text-sm mt-1 line-clamp-2", children: playlist.description })), _jsxs("p", { className: "text-emby-text-secondary text-xs mt-2", children: [playlist._count?.items || 0, " \u4E2A\u89C6\u9891"] })] }), _jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsx("span", { className: "text-xs text-emby-text-muted", children: playlist.isPublic ? '公开' : '私密' }), _jsx("button", { onClick: (e) => {
                                        e.preventDefault();
                                        if (confirm('确定要删除这个播放列表吗？')) {
                                            deleteMutation.mutate(playlist.id);
                                        }
                                    }, className: "text-emby-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, playlist.id))) })) : (_jsxs("div", { className: "text-center py-12 text-emby-text-muted", children: [_jsx("p", { children: "\u8FD8\u6CA1\u6709\u64AD\u653E\u5217\u8868" }), _jsx("p", { className: "text-sm mt-1", children: "\u70B9\u51FB\u4E0A\u65B9\u6309\u94AE\u521B\u5EFA\u4E00\u4E2A" })] }))] }));
}
