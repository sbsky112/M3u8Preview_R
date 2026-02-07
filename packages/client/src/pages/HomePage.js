import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { mediaApi } from '../services/mediaApi.js';
import { historyApi } from '../services/historyApi.js';
import { ScrollRow } from '../components/ui/ScrollRow.js';
import { MediaCard } from '../components/media/MediaCard.js';
import { formatDuration } from '../lib/utils.js';
export function HomePage() {
    const { data: recentMedia, isLoading: recentLoading } = useQuery({
        queryKey: ['media', 'recent'],
        queryFn: () => mediaApi.getRecent(20),
    });
    const { data: randomMedia } = useQuery({
        queryKey: ['media', 'random'],
        queryFn: () => mediaApi.getRandom(15),
    });
    const { data: continueWatching } = useQuery({
        queryKey: ['history', 'continue'],
        queryFn: () => historyApi.getContinueWatching(15),
    });
    if (recentLoading) {
        return (_jsxs("div", { className: "space-y-8 animate-pulse", children: [_jsx("div", { className: "h-6 w-32 bg-emby-bg-input rounded" }), _jsx("div", { className: "flex gap-4 overflow-hidden", children: Array.from({ length: 8 }).map((_, i) => (_jsxs("div", { className: "w-[160px] flex-shrink-0", children: [_jsx("div", { className: "aspect-[2/3] bg-emby-bg-input rounded-md" }), _jsx("div", { className: "h-4 bg-emby-bg-input rounded mt-2 w-3/4" })] }, i))) })] }));
    }
    return (_jsxs("div", { className: "space-y-8", children: [continueWatching && continueWatching.length > 0 && (_jsx(ScrollRow, { title: "\u7EE7\u7EED\u89C2\u770B", children: continueWatching.map((item) => (item.media && (_jsx("div", { className: "w-[280px] sm:w-[320px] flex-shrink-0 snap-start", children: _jsx(MediaCard, { media: item.media, variant: "landscape", showProgress: true, progress: item.percentage, progressText: `${formatDuration(item.progress)} / ${formatDuration(item.duration)}` }) }, item.id)))) })), randomMedia && randomMedia.length > 0 && (_jsx(ScrollRow, { title: "\u968F\u673A\u63A8\u8350", moreLink: "/library", children: randomMedia.map((media) => (_jsx("div", { className: "w-[140px] sm:w-[160px] lg:w-[170px] flex-shrink-0 snap-start", children: _jsx(MediaCard, { media: media, variant: "portrait" }) }, media.id))) })), recentMedia && recentMedia.length > 0 && (_jsx(ScrollRow, { title: "\u6700\u8FD1\u6DFB\u52A0", moreLink: "/library", children: recentMedia.map((media) => (_jsx("div", { className: "w-[140px] sm:w-[160px] lg:w-[170px] flex-shrink-0 snap-start", children: _jsx(MediaCard, { media: media, variant: "portrait" }) }, media.id))) }))] }));
}
