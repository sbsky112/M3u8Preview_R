import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { Film, Play, Plus, Star } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
import { historyApi } from '../services/historyApi.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { FavoriteButton } from '../components/media/FavoriteButton.js';
import { QualitySelector } from '../components/media/QualitySelector.js';
import { AddToPlaylistModal } from '../components/playlist/AddToPlaylistModal.js';
import { useWatchProgress } from '../hooks/useWatchProgress.js';
import { useVideoThumbnail } from '../hooks/useVideoThumbnail.js';
import { formatDate } from '../lib/utils.js';
export function MediaDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
    const [showPlayer, setShowPlayer] = useState(false);
    const playerRef = useRef(null);
    const { data: media, isLoading, error } = useQuery({
        queryKey: ['media', id],
        queryFn: () => mediaApi.getById(id),
        enabled: !!id,
    });
    const { data: progress } = useQuery({
        queryKey: ['watchProgress', id],
        queryFn: () => historyApi.getProgress(id),
        enabled: !!id,
    });
    const { handleTimeUpdate } = useWatchProgress({ mediaId: id });
    // 使用缩略图 hook 获取封面
    const thumbnail = useVideoThumbnail(media?.id ?? '', media?.m3u8Url ?? '', media?.posterUrl);
    // Increment views
    useEffect(() => {
        if (id) {
            mediaApi.incrementViews(id).catch(() => { });
        }
    }, [id]);
    // 播放器可见后自动滚动
    useEffect(() => {
        if (showPlayer && playerRef.current) {
            playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [showPlayer]);
    function handlePlay() {
        setShowPlayer(true);
    }
    if (isLoading) {
        return (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "relative -mx-6 -mt-4 lg:-mx-8 h-[400px] bg-emby-bg-input" }), _jsxs("div", { className: "max-w-5xl mx-auto mt-6 space-y-4", children: [_jsx("div", { className: "h-8 bg-emby-bg-input rounded w-1/3" }), _jsx("div", { className: "h-4 bg-emby-bg-input rounded w-2/3" })] })] }));
    }
    if (error || !media) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-emby-text-secondary mb-4", children: "\u5A92\u4F53\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664" }), _jsx("button", { onClick: () => navigate('/'), className: "px-4 py-2 bg-emby-green text-white rounded-md hover:bg-emby-green-dark", children: "\u8FD4\u56DE\u9996\u9875" })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "relative -mx-6 -mt-4 lg:-mx-8 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0", children: [thumbnail ? (_jsx("img", { src: thumbnail, alt: "", className: "w-full h-full object-cover blur-2xl scale-110 opacity-30" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-b from-emby-bg-elevated to-emby-bg-base" })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-emby-bg-base via-emby-bg-base/60 to-transparent" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-emby-bg-base/80 to-transparent" })] }), _jsxs("div", { className: "relative px-6 lg:px-8 py-10 flex gap-8 items-end min-h-[360px]", children: [_jsx("div", { className: "hidden md:block w-52 flex-shrink-0", children: _jsx("div", { className: "aspect-[2/3] rounded-md overflow-hidden shadow-2xl", children: thumbnail ? (_jsx("img", { src: thumbnail, alt: media.title, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full bg-emby-bg-card flex items-center justify-center", children: _jsx(Film, { className: "w-16 h-16 text-emby-text-muted" }) })) }) }), _jsxs("div", { className: "flex-1 min-w-0 space-y-4", children: [_jsx("h1", { className: "text-3xl font-bold text-white", children: media.title }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-emby-text-secondary flex-wrap", children: [media.year && _jsx("span", { children: media.year }), media.rating && (_jsxs("span", { className: "flex items-center gap-1 text-yellow-400", children: [_jsx(Star, { className: "w-4 h-4 fill-yellow-400" }), media.rating.toFixed(1)] })), media.category && (_jsx("span", { className: "px-2 py-0.5 bg-white/10 rounded text-emby-text-primary text-xs", children: media.category.name })), _jsxs("span", { children: [media.views, " \u6B21\u64AD\u653E"] }), _jsxs("span", { children: ["\u6DFB\u52A0\u4E8E ", formatDate(media.createdAt)] })] }), media.tags && media.tags.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: media.tags.map((tag) => (_jsx("span", { className: "px-2.5 py-1 bg-white/10 text-emby-text-primary text-xs rounded-full", children: tag.name }, tag.id))) })), media.description && (_jsx("p", { className: "text-emby-text-primary leading-relaxed line-clamp-3", children: media.description })), _jsxs("div", { className: "flex items-center gap-3 pt-2", children: [_jsxs("button", { onClick: handlePlay, className: "flex items-center gap-2 px-6 py-2.5 bg-emby-green text-white rounded-md hover:bg-emby-green-hover font-medium transition-colors", children: [_jsx(Play, { className: "w-5 h-5 fill-white" }), "\u64AD\u653E"] }), _jsx(FavoriteButton, { mediaId: media.id }), _jsxs("button", { onClick: () => setShowAddToPlaylist(true), className: "flex items-center gap-1.5 px-3 py-1.5 text-sm text-emby-text-secondary hover:text-white bg-emby-bg-input rounded-md hover:bg-emby-bg-elevated transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), "\u6DFB\u52A0\u5230\u5217\u8868"] }), _jsx(QualitySelector, {})] })] })] })] }), _jsx("div", { ref: playerRef, className: "max-w-5xl mx-auto mt-6", children: showPlayer ? (_jsx(VideoPlayer, { media: media, startTime: progress?.progress || 0, onTimeUpdate: handleTimeUpdate, autoPlay: true })) : (_jsxs("div", { onClick: handlePlay, className: "aspect-video bg-emby-bg-card rounded-lg flex items-center justify-center cursor-pointer group hover:bg-emby-bg-elevated transition-colors relative overflow-hidden", children: [thumbnail && (_jsx("img", { src: thumbnail, alt: "", className: "absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity" })), _jsx("div", { className: "relative w-20 h-20 bg-emby-green/80 group-hover:bg-emby-green rounded-full flex items-center justify-center transition-colors", children: _jsx(Play, { className: "w-10 h-10 text-white fill-white ml-1" }) })] })) }), _jsx(AddToPlaylistModal, { mediaId: media.id, isOpen: showAddToPlaylist, onClose: () => setShowAddToPlaylist(false) })] }));
}
