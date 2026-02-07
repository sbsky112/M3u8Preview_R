import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export function ScrollRow({ title, moreLink, children, className = '' }) {
    const containerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const checkScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el)
            return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);
    useEffect(() => {
        checkScroll();
        const el = containerRef.current;
        if (!el)
            return;
        el.addEventListener('scroll', checkScroll, { passive: true });
        const observer = new ResizeObserver(checkScroll);
        observer.observe(el);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            observer.disconnect();
        };
    }, [checkScroll]);
    function scroll(direction) {
        const el = containerRef.current;
        if (!el)
            return;
        const distance = el.clientWidth * 0.8;
        el.scrollBy({ left: direction === 'left' ? -distance : distance, behavior: 'smooth' });
    }
    return (_jsxs("div", { className: `group/row relative ${className}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h2", { className: "text-lg font-semibold text-white", children: title }), moreLink && (_jsx(Link, { to: moreLink, className: "text-sm text-emby-text-secondary hover:text-emby-green-light transition-colors", children: "\u66F4\u591A >" }))] }), _jsxs("div", { className: "relative", children: [canScrollLeft && (_jsx("button", { onClick: () => scroll('left'), className: "absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex", children: _jsx(ChevronLeft, { className: "w-5 h-5" }) })), canScrollRight && (_jsx("button", { onClick: () => scroll('right'), className: "absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:flex", children: _jsx(ChevronRight, { className: "w-5 h-5" }) })), _jsx("div", { ref: containerRef, className: "flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x", children: children })] })] }));
}
