import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowLeft, Film, Play, Plus, Star } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
import { FavoriteButton } from '../components/media/FavoriteButton.js';
import { MediaCard } from '../components/media/MediaCard.js';
import { AddToPlaylistModal } from '../components/playlist/AddToPlaylistModal.js';
import { ScrollRow } from '../components/ui/ScrollRow.js';
import { useVideoThumbnail } from '../hooks/useVideoThumbnail.js';
import { useProgressMap } from '../hooks/useProgressMap.js';
import { formatDate } from '../lib/utils.js';
export function MediaDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
    const { data: media, isLoading, error } = useQuery({
        queryKey: ['media', id],
        queryFn: () => mediaApi.getById(id),
        enabled: !!id,
    });
    // 同类推荐
    const { data: categoryMedia } = useQuery({
        queryKey: ['media', 'category', media?.categoryId],
        queryFn: () => mediaApi.getAll({ categoryId: media.categoryId, limit: 12 }),
        enabled: !!media?.categoryId,
    });
    // 随机推荐
    const { data: randomMedia } = useQuery({
        queryKey: ['media', 'random-detail', id],
        queryFn: () => mediaApi.getRandom(12),
        enabled: !!media,
    });
    // 使用缩略图 hook 获取封面
    const thumbnail = useVideoThumbnail(media?.id ?? '', media?.m3u8Url ?? '', media?.posterUrl);
    const { data: progressMap } = useProgressMap();
    // Increment views
    useEffect(() => {
        if (id) {
            mediaApi.incrementViews(id).catch(() => { });
        }
    }, [id]);
    function handlePlay() {
        navigate(`/play/${media.id}`);
    }
    if (isLoading) {
        return (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "relative -mx-6 -mt-4 lg:-mx-8 h-[400px] bg-emby-bg-input" }), _jsxs("div", { className: "max-w-5xl mx-auto mt-6 space-y-4", children: [_jsx("div", { className: "h-8 bg-emby-bg-input rounded w-1/3" }), _jsx("div", { className: "h-4 bg-emby-bg-input rounded w-2/3" })] })] }));
    }
    if (error || !media) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-emby-text-secondary mb-4", children: "\u5A92\u4F53\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664" }), _jsx("button", { onClick: () => navigate('/'), className: "px-4 py-2 bg-emby-green text-white rounded-md hover:bg-emby-green-dark", children: "\u8FD4\u56DE\u9996\u9875" })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "relative -mx-6 -mt-4 lg:-mx-8 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0", children: [thumbnail ? (_jsx("img", { src: thumbnail, alt: "", className: "w-full h-full object-cover blur-2xl scale-110 opacity-30" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-b from-emby-bg-elevated to-emby-bg-base" })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-emby-bg-base via-emby-bg-base/60 to-transparent" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-emby-bg-base/80 to-transparent" })] }), _jsxs("div", { className: "relative px-6 lg:px-8 py-10 flex gap-8 items-end min-h-[360px]", children: [_jsx("button", { onClick: () => navigate(-1), className: "absolute top-4 left-4 lg:left-6 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors z-10", "aria-label": "\u8FD4\u56DE", children: _jsx(ArrowLeft, { className: "w-5 h-5" }) }), _jsx("div", { className: "hidden md:block w-52 flex-shrink-0", children: _jsx("div", { className: "aspect-[2/3] rounded-md overflow-hidden shadow-2xl", children: thumbnail ? (_jsx("img", { src: thumbnail, alt: media.title, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full bg-emby-bg-card flex items-center justify-center", children: _jsx(Film, { className: "w-16 h-16 text-emby-text-muted" }) })) }) }), _jsxs("div", { className: "flex-1 min-w-0 space-y-4", children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: media.title }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-emby-text-secondary flex-wrap", children: [media.year && _jsx("span", { children: media.year }), media.rating && (_jsxs("span", { className: "flex items-center gap-1 text-yellow-400", children: [_jsx(Star, { className: "w-4 h-4 fill-yellow-400" }), media.rating.toFixed(1)] })), media.category && (_jsx("span", { className: "px-2 py-0.5 bg-white/10 rounded text-emby-text-primary text-xs", children: media.category.name })), _jsxs("span", { children: [media.views, " \u6B21\u64AD\u653E"] }), _jsxs("span", { children: ["\u6DFB\u52A0\u4E8E ", formatDate(media.createdAt)] })] }), media.tags && media.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: media.tags.map((tag) => (_jsx("span", { className: "px-2.5 py-1 bg-white/10 text-emby-text-primary text-xs rounded-full", children: tag.name }, tag.id))) })), media.description && (_jsx("p", { className: "text-emby-text-primary leading-relaxed line-clamp-3", children: media.description })), _jsxs("div", { className: "flex items-center gap-3 pt-2", children: [_jsxs("button", { onClick: handlePlay, className: "flex items-center gap-2 px-6 py-2.5 bg-emby-green text-white rounded-md hover:bg-emby-green-hover font-medium transition-colors", children: [_jsx(Play, { className: "w-5 h-5 fill-white" }), "\u64AD\u653E"] }), _jsx(FavoriteButton, { mediaId: media.id }), _jsxs("button", { onClick: () => setShowAddToPlaylist(true), className: "flex items-center gap-1.5 px-3 py-1.5 text-sm text-emby-text-secondary hover:text-white bg-emby-bg-input rounded-md hover:bg-emby-bg-elevated transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), "\u6DFB\u52A0\u5230\u5217\u8868"] })] })] })] })] }), _jsxs("div", { className: "max-w-5xl mx-auto mt-8 space-y-8 pb-8", children: [categoryMedia?.items && categoryMedia.items.filter(m => m.id !== media.id).length > 0 && (_jsx(ScrollRow, { title: "\u540C\u7C7B\u63A8\u8350", children: categoryMedia.items
                            .filter(m => m.id !== media.id)
                            .map(m => {
                            const prog = progressMap?.[m.id];
                            return (_jsx("div", { className: "w-[140px] sm:w-[160px] lg:w-[170px] flex-shrink-0 snap-start", children: _jsx(MediaCard, { media: m, variant: "portrait", showProgress: !!prog, progress: prog?.percentage, completed: prog?.completed }) }, m.id));
                        }) })), randomMedia && randomMedia.filter(m => m.id !== media.id).length > 0 && (_jsx(ScrollRow, { title: "\u4F60\u53EF\u80FD\u559C\u6B22", children: randomMedia
                            .filter(m => m.id !== media.id)
                            .map(m => {
                            const prog = progressMap?.[m.id];
                            return (_jsx("div", { className: "w-[140px] sm:w-[160px] lg:w-[170px] flex-shrink-0 snap-start", children: _jsx(MediaCard, { media: m, variant: "portrait", showProgress: !!prog, progress: prog?.percentage, completed: prog?.completed }) }, m.id));
                        }) }))] }), _jsx(AddToPlaylistModal, { mediaId: media.id, isOpen: showAddToPlaylist, onClose: () => setShowAddToPlaylist(false) })] }));
}
