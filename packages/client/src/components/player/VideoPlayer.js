import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import { usePlayerStore } from '../../stores/playerStore.js';
export function VideoPlayer({ media, startTime = 0, onTimeUpdate, autoPlay = false }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const containerRef = useRef(null);
    const { setPlaying, setCurrentTime, setDuration, setQualities, setQuality, quality } = usePlayerStore();
    const initHls = useCallback(() => {
        const video = videoRef.current;
        if (!video)
            return;
        // Destroy previous instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
        if (Hls.isSupported()) {
            const hls = new Hls({
                startPosition: startTime,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
            });
            hls.loadSource(media.m3u8Url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                const levels = data.levels.map((level, index) => ({
                    index,
                    height: level.height,
                    bitrate: level.bitrate,
                }));
                setQualities(levels);
                if (autoPlay) {
                    video.play().catch(() => {
                        // Autoplay blocked, user needs to interact
                    });
                }
            });
            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn('HLS network error, attempting recovery...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn('HLS media error, attempting recovery...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.error('Fatal HLS error:', data);
                            hls.destroy();
                            break;
                    }
                }
            });
            hlsRef.current = hls;
        }
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = media.m3u8Url;
            video.currentTime = startTime;
            if (autoPlay) {
                video.play().catch(() => { });
            }
        }
    }, [media.m3u8Url, startTime, setQualities, autoPlay]);
    // Handle quality change
    useEffect(() => {
        if (hlsRef.current && quality !== undefined) {
            hlsRef.current.currentLevel = quality;
        }
    }, [quality]);
    // Initialize HLS
    useEffect(() => {
        initHls();
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [initHls]);
    // Video event handlers
    useEffect(() => {
        const video = videoRef.current;
        if (!video)
            return;
        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            onTimeUpdate?.(video.currentTime, video.duration || 0);
        };
        const handleDurationChange = () => {
            setDuration(video.duration || 0);
        };
        const handlePlay = () => setPlaying(true);
        const handlePause = () => setPlaying(false);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [setCurrentTime, setDuration, setPlaying, onTimeUpdate]);
    // Keyboard shortcuts
    useEffect(() => {
        const video = videoRef.current;
        if (!video)
            return;
        function handleKeyDown(e) {
            if (!video)
                return;
            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    video.paused ? video.play() : video.pause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    video.volume = Math.min(1, video.volume + 0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    video.volume = Math.max(0, video.volume - 0.1);
                    break;
                case 'f':
                    e.preventDefault();
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    else {
                        containerRef.current?.requestFullscreen();
                    }
                    break;
                case 'm':
                    e.preventDefault();
                    video.muted = !video.muted;
                    break;
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
    return (_jsx("div", { ref: containerRef, className: "relative bg-black rounded-lg overflow-hidden", children: _jsx("video", { ref: videoRef, className: "w-full aspect-video", controls: true, playsInline: true }) }));
}
