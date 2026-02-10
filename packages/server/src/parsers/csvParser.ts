import Papa from 'papaparse';
import type { ImportItem } from '@m3u8-preview/shared';

export function parseCsv(content: string): ImportItem[] {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase(),
  });

  return result.data.map((row: any) => ({
    title: row.title || row['\u6807\u9898'] || '',
    m3u8Url: row.m3u8url || row.m3u8_url || row.url || row['\u94fe\u63a5'] || '',
    posterUrl: row.posterurl || row.poster_url || row.poster || row['\u6d77\u62a5'] || undefined,
    description: row.description || row['\u63cf\u8ff0'] || undefined,
    year: row.year || row['\u5e74\u4efd'] ? parseInt(row.year || row['\u5e74\u4efd']) : undefined,
    artist: row.artist || row['\u4f5c\u8005'] || row['\u6f14\u5458'] || undefined,
    categoryName: row.category || row['\u5206\u7c7b'] || undefined,
    tagNames: (row.tags || row['\u6807\u7b7e']) ? String(row.tags || row['\u6807\u7b7e']).split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
  }));
}
