import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { mediaApi } from '../services/mediaApi.js';
import { historyApi } from '../services/historyApi.js';
import { VideoPlayer } from '../components/player/VideoPlayer.js';
import { QualitySelector } from '../components/media/QualitySelector.js';
import { useWatchProgress } from '../hooks/useWatchProgress.js';
const OVERLAY_TIMEOUT = 3000;
export function PlaybackPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [overlayVisible, setOverlayVisible] = useState(true);
    const hideTimerRef = useRef();
    const { data: media, isLoading, error } = useQuery({
        queryKey: ['media', id],
        queryFn: () => mediaApi.getById(id),
        enabled: !!id,
    });
    const { data: progress, isFetched: progressFetched } = useQuery({
        queryKey: ['watchProgress', id],
        queryFn: () => historyApi.getProgress(id),
        enabled: !!id,
    });
    const { handleTimeUpdate } = useWatchProgress({ mediaId: id });
    // 显示覆盖栏并重置隐藏定时器
    const showOverlay = useCallback(() => {
        setOverlayVisible(true);
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }
        hideTimerRef.current = setTimeout(() => {
            setOverlayVisible(false);
        }, OVERLAY_TIMEOUT);
    }, []);
    // 初始化：启动自动隐藏定时器
    useEffect(() => {
        hideTimerRef.current = setTimeout(() => {
            setOverlayVisible(false);
        }, OVERLAY_TIMEOUT);
        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, []);
    // 键盘快捷键：Escape 返回详情页
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                navigate(`/media/${id}`, { replace: true });
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [navigate, id]);
    function handleBack() {
        navigate(`/media/${id}`, { replace: true });
    }
    if (isLoading) {
        return (_jsx("div", { className: "fixed inset-0 bg-black z-50 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emby-green" }) }));
    }
    if (error || !media) {
        return (_jsx("div", { className: "fixed inset-0 bg-black z-50 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-emby-text-secondary mb-4", children: "\u5A92\u4F53\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664" }), _jsx("button", { onClick: () => navigate('/'), className: "px-4 py-2 bg-emby-green text-white rounded-md hover:bg-emby-green-dark", children: "\u8FD4\u56DE\u9996\u9875" })] }) }));
    }
    return (_jsxs("div", { className: "fixed inset-0 bg-black z-50", style: { cursor: overlayVisible ? 'default' : 'none' }, onMouseMove: showOverlay, onTouchStart: showOverlay, children: [progressFetched ? (_jsx(VideoPlayer, { media: media, startTime: progress?.progress || 0, onTimeUpdate: handleTimeUpdate, autoPlay: true, fillContainer: true })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emby-green" }) })), _jsxs("div", { className: `absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 flex items-center gap-4 transition-opacity duration-300 ${overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`, children: [_jsx("button", { onClick: handleBack, className: "p-2 rounded-full hover:bg-white/10 transition-colors text-white", "aria-label": "\u8FD4\u56DE", children: _jsx(ArrowLeft, { className: "w-6 h-6" }) }), _jsx("h1", { className: "text-white font-medium text-lg truncate flex-1", children: media.title }), _jsx(QualitySelector, { dropDirection: "down" })] })] }));
}
