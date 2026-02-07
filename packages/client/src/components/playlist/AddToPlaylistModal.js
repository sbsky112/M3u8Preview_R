import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { playlistApi } from '../../services/playlistApi.js';
export function AddToPlaylistModal({ mediaId, isOpen, onClose }) {
    const [newName, setNewName] = useState('');
    const queryClient = useQueryClient();
    const { data: playlists } = useQuery({
        queryKey: ['playlists'],
        queryFn: () => playlistApi.getAll(),
        enabled: isOpen,
    });
    const addMutation = useMutation({
        mutationFn: (playlistId) => playlistApi.addItem(playlistId, mediaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
        },
    });
    const createAndAdd = useMutation({
        mutationFn: async () => {
            const playlist = await playlistApi.create(newName);
            await playlistApi.addItem(playlist.id, mediaId);
            return playlist;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            setNewName('');
        },
    });
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity", onClick: onClose, children: _jsxs("div", { className: "bg-emby-bg-dialog border border-emby-border rounded-md w-full max-w-md animate-modal", onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-emby-border-subtle", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "\u6DFB\u52A0\u5230\u64AD\u653E\u5217\u8868" }), _jsx("button", { onClick: onClose, className: "text-emby-text-secondary hover:text-white", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-4 space-y-3 max-h-64 overflow-y-auto", children: [playlists?.map((pl) => (_jsxs("button", { onClick: () => addMutation.mutate(pl.id), disabled: addMutation.isPending, className: "w-full text-left px-4 py-3 bg-emby-bg-input hover:bg-emby-bg-elevated rounded-md transition-colors", children: [_jsx("p", { className: "text-white text-sm font-medium", children: pl.name }), _jsxs("p", { className: "text-emby-text-muted text-xs", children: [pl._count?.items || 0, " \u4E2A\u89C6\u9891"] })] }, pl.id))), (!playlists || playlists.length === 0) && (_jsx("p", { className: "text-emby-text-muted text-sm text-center py-2", children: "\u6682\u65E0\u64AD\u653E\u5217\u8868" }))] }), _jsxs("div", { className: "p-4 border-t border-emby-border-subtle", children: [_jsx("p", { className: "text-sm text-emby-text-secondary mb-2", children: "\u6216\u521B\u5EFA\u65B0\u5217\u8868" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: newName, onChange: e => setNewName(e.target.value), placeholder: "\u5217\u8868\u540D\u79F0", className: "flex-1 px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white text-sm placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green" }), _jsx("button", { onClick: () => createAndAdd.mutate(), disabled: !newName.trim() || createAndAdd.isPending, className: "px-4 py-2 bg-emby-green text-white rounded-md text-sm hover:bg-emby-green-dark disabled:opacity-50", children: "\u521B\u5EFA\u5E76\u6DFB\u52A0" })] })] })] }) }));
}
