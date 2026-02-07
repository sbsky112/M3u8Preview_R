import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { favoriteApi } from '../services/favoriteApi.js';
import { MediaGrid } from '../components/media/MediaGrid.js';
export function FavoritesPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading } = useQuery({
        queryKey: ['favorites', page],
        queryFn: () => favoriteApi.getAll(page, 24),
    });
    const mediaItems = data?.items?.map((f) => f.media).filter(Boolean) || [];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: "\u6211\u7684\u6536\u85CF" }), data && _jsxs("span", { className: "text-sm text-emby-text-secondary", children: ["\u5171 ", data.total, " \u9879"] })] }), isLoading ? (_jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6", children: Array.from({ length: 6 }).map((_, i) => (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "aspect-[2/3] bg-emby-bg-input rounded-lg" }), _jsx("div", { className: "h-4 bg-emby-bg-input rounded mt-2 w-3/4" })] }, i))) })) : (_jsxs(_Fragment, { children: [_jsx(MediaGrid, { items: mediaItems, emptyMessage: "\u8FD8\u6CA1\u6709\u6536\u85CF\u4EFB\u4F55\u5185\u5BB9" }), data && data.totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-center gap-2 pt-4", children: [_jsx("button", { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: "px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated text-sm", children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { className: "text-emby-text-secondary text-sm", children: [page, " / ", data.totalPages] }), _jsx("button", { onClick: () => setPage(Math.min(data.totalPages, page + 1)), disabled: page === data.totalPages, className: "px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated text-sm", children: "\u4E0B\u4E00\u9875" })] }))] }))] }));
}
