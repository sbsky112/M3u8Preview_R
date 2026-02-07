import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore.js';
export function QualitySelector({ dropDirection = 'up' }) {
    const { qualities, quality, setQuality } = usePlayerStore();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);
    if (qualities.length <= 1)
        return null;
    return (_jsxs("div", { className: "relative", ref: ref, children: [_jsxs("button", { onClick: () => setOpen(!open), className: "px-3 py-1.5 bg-emby-bg-input text-emby-text-primary rounded-md hover:bg-emby-bg-elevated text-sm flex items-center gap-1", children: [_jsx(Settings, { className: "w-4 h-4" }), quality === -1 ? '自动' : `${qualities.find(q => q.index === quality)?.height}p`] }), open && (_jsxs("div", { className: `absolute ${dropDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2'} right-0 bg-emby-bg-dialog border border-emby-border rounded-md shadow-xl py-1 min-w-[120px]`, children: [_jsx("button", { onClick: () => { setQuality(-1); setOpen(false); }, className: `w-full text-left px-4 py-2 text-sm hover:bg-emby-bg-elevated ${quality === -1 ? 'text-emby-green-light' : 'text-emby-text-primary'}`, children: "\u81EA\u52A8" }), [...qualities].sort((a, b) => b.height - a.height).map((q) => (_jsxs("button", { onClick: () => { setQuality(q.index); setOpen(false); }, className: `w-full text-left px-4 py-2 text-sm hover:bg-emby-bg-elevated ${quality === q.index ? 'text-emby-green-light' : 'text-emby-text-primary'}`, children: [q.height, "p"] }, q.index)))] }))] }));
}
