/**
 * M16: 统一序列化工具模块
 * 将分散在 5 个 service 中的重复序列化逻辑集中管理
 */
import type { Media, Favorite, WatchHistory } from '@m3u8-preview/shared';

/** 序列化日期字段：Date -> ISO string */
function toISO(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return value as string;
}

/** 序列化 Category 对象 */
export function serializeCategory(category: any) {
  if (!category) return category;
  return {
    ...category,
    createdAt: toISO(category.createdAt),
    updatedAt: toISO(category.updatedAt),
  };
}

/** 序列化 MediaTag 关联 -> Tag 数组 */
export function serializeTags(tags: any[] | undefined) {
  return tags?.map((mt: any) => ({
    id: mt.tag?.id ?? mt.id,
    name: mt.tag?.name ?? mt.name,
    createdAt: toISO(mt.tag?.createdAt ?? mt.createdAt),
    updatedAt: toISO(mt.tag?.updatedAt ?? mt.updatedAt),
  }));
}

/** 序列化 Media 对象（含 category/tags 关联） */
export function serializeMedia(media: any): Media {
  return {
    ...media,
    createdAt: toISO(media.createdAt),
    updatedAt: toISO(media.updatedAt),
    category: serializeCategory(media.category),
    tags: serializeTags(media.tags),
  };
}

/** 序列化 Favorite 对象 */
export function serializeFavorite(fav: any): Favorite {
  const result: any = {
    id: fav.id,
    userId: fav.userId,
    mediaId: fav.mediaId,
    createdAt: toISO(fav.createdAt),
  };
  if (fav.media) {
    result.media = serializeMedia(fav.media);
  }
  return result;
}

/** 序列化 WatchHistory 对象 */
export function serializeHistory(history: any): WatchHistory {
  const result: any = {
    id: history.id,
    userId: history.userId,
    mediaId: history.mediaId,
    progress: history.progress,
    duration: history.duration,
    percentage: history.percentage,
    completed: history.completed,
    updatedAt: toISO(history.updatedAt),
  };
  if (history.media) {
    result.media = serializeMedia(history.media);
  }
  return result;
}

/** 序列化 Playlist 对象 */
export function serializePlaylist(playlist: any) {
  return {
    ...playlist,
    createdAt: toISO(playlist.createdAt),
    updatedAt: toISO(playlist.updatedAt),
    items: playlist.items?.map(serializePlaylistItem),
  };
}

/** 序列化 PlaylistItem 对象 */
export function serializePlaylistItem(item: any) {
  return {
    ...item,
    createdAt: toISO(item.createdAt),
    media: item.media ? serializeMedia(item.media) : item.media,
  };
}
