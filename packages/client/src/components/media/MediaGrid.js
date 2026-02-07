import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MediaCard } from './MediaCard.js';
export function MediaGrid({ items, title, emptyMessage = '暂无内容' }) {
    return (_jsxs("div", { children: [title && (_jsx("h2", { className: "text-xl font-semibold text-white mb-4", children: title })), items.length === 0 ? (_jsx("div", { className: "text-center py-12 text-emby-text-muted", children: emptyMessage })) : (_jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6", children: items.map((item) => (_jsx(MediaCard, { media: item }, item.id))) }))] }));
}
