import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { mediaApi } from '../services/mediaApi.js';
import { categoryApi } from '../services/categoryApi.js';
import { MediaGrid } from '../components/media/MediaGrid.js';
import { useProgressMap } from '../hooks/useProgressMap.js';
export function LibraryPage() {
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const search = searchParams.get('search') || '';
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryApi.getAll(),
    });
    const { data, isLoading } = useQuery({
        queryKey: ['media', 'list', { page, search, categoryId: selectedCategory, sortBy, sortOrder }],
        queryFn: () => mediaApi.getAll({
            page,
            limit: 24,
            search: search || undefined,
            categoryId: selectedCategory || undefined,
            sortBy: sortBy,
            sortOrder,
        }),
    });
    const { data: progressMap } = useProgressMap();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [_jsx("h1", { className: "text-2xl font-bold text-white", children: search ? `搜索: "${search}"` : '媒体库' }), data && _jsxs("span", { className: "text-sm text-emby-text-secondary", children: ["\u5171 ", data.total, " \u9879"] })] }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsxs("select", { value: selectedCategory, onChange: (e) => { setSelectedCategory(e.target.value); setPage(1); }, className: "px-3 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emby-green", children: [_jsx("option", { value: "", children: "\u5168\u90E8\u5206\u7C7B" }), categories?.map((cat) => (_jsxs("option", { value: cat.id, children: [cat.name, " (", cat._count?.media || 0, ")"] }, cat.id)))] }), _jsxs("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "px-3 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emby-green", children: [_jsx("option", { value: "createdAt", children: "\u6DFB\u52A0\u65F6\u95F4" }), _jsx("option", { value: "title", children: "\u6807\u9898" }), _jsx("option", { value: "year", children: "\u5E74\u4EFD" }), _jsx("option", { value: "rating", children: "\u8BC4\u5206" }), _jsx("option", { value: "views", children: "\u64AD\u653E\u91CF" })] }), _jsx("button", { onClick: () => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'), className: "px-3 py-2 bg-emby-bg-input border border-emby-border rounded-lg text-white text-sm hover:bg-emby-bg-elevated", children: sortOrder === 'desc' ? '降序' : '升序' })] }), isLoading ? (_jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6", children: Array.from({ length: 12 }).map((_, i) => (_jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "aspect-[2/3] bg-emby-bg-input rounded-lg" }), _jsx("div", { className: "h-4 bg-emby-bg-input rounded mt-2 w-3/4" })] }, i))) })) : data ? (_jsxs(_Fragment, { children: [_jsx(MediaGrid, { items: data.items, emptyMessage: "\u6CA1\u6709\u627E\u5230\u5339\u914D\u7684\u5A92\u4F53", progressMap: progressMap }), data.totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-center gap-2 pt-4", children: [_jsx("button", { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: "px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated transition-colors text-sm", children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { className: "text-emby-text-secondary text-sm", children: [page, " / ", data.totalPages] }), _jsx("button", { onClick: () => setPage(Math.min(data.totalPages, page + 1)), disabled: page === data.totalPages, className: "px-4 py-2 bg-emby-bg-input text-white rounded-lg disabled:opacity-50 hover:bg-emby-bg-elevated transition-colors text-sm", children: "\u4E0B\u4E00\u9875" })] }))] })) : null] }));
}
