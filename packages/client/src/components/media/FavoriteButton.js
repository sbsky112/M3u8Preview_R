import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { favoriteApi } from '../../services/favoriteApi.js';
export function FavoriteButton({ mediaId, className = '' }) {
    const queryClient = useQueryClient();
    const { data: favoriteData } = useQuery({
        queryKey: ['favorite', mediaId],
        queryFn: () => favoriteApi.check(mediaId),
    });
    const { mutate: toggleFavorite, isPending } = useMutation({
        mutationFn: () => favoriteApi.toggle(mediaId),
        onSuccess: (result) => {
            queryClient.setQueryData(['favorite', mediaId], result);
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
    const isFavorited = favoriteData?.isFavorited ?? false;
    return (_jsxs("button", { onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite();
        }, disabled: isPending, className: `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${isFavorited
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-emby-bg-input text-emby-text-secondary hover:bg-emby-bg-elevated hover:text-white'} ${className}`, title: isFavorited ? '取消收藏' : '收藏', children: [_jsx(Heart, { className: `w-4 h-4 ${isFavorited ? 'fill-current' : ''}` }), _jsx("span", { className: "text-sm", children: isFavorited ? '已收藏' : '收藏' })] }));
}
