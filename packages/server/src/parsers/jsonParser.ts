import type { ImportItem } from '@m3u8-preview/shared';

export function parseJson(content: string): ImportItem[] {
  const data = JSON.parse(content);
  const items: any[] = Array.isArray(data) ? data : (data.items || data.media || []);

  return items.map((item: any) => ({
    title: item.title || '',
    m3u8Url: item.m3u8Url || item.m3u8_url || item.url || '',
    posterUrl: item.posterUrl || item.poster_url || item.poster || undefined,
    description: item.description || undefined,
    year: item.year ? parseInt(item.year) : undefined,
    artist: item.artist || item.artistName || item['作者'] || undefined,
    categoryName: item.category || item.categoryName || undefined,
    tagNames: item.tags || item.tagNames || undefined,
  }));
}
