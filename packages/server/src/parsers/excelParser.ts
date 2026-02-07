import * as XLSX from 'xlsx';
import type { ImportItem } from '@m3u8-preview/shared';

export function parseExcel(buffer: Buffer): ImportItem[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row: any) => {
    // Support both English and Chinese column names
    return {
      title: row.title || row['\u6807\u9898'] || row.Title || '',
      m3u8Url: row.m3u8Url || row.m3u8_url || row.url || row.URL || row['\u94fe\u63a5'] || '',
      posterUrl: row.posterUrl || row.poster_url || row.poster || row['\u6d77\u62a5'] || undefined,
      description: row.description || row['\u63cf\u8ff0'] || row.Description || undefined,
      year: row.year || row['\u5e74\u4efd'] || row.Year ? parseInt(String(row.year || row['\u5e74\u4efd'] || row.Year)) : undefined,
      categoryName: row.category || row['\u5206\u7c7b'] || row.Category || undefined,
      tagNames: (row.tags || row['\u6807\u7b7e'] || row.Tags) ? String(row.tags || row['\u6807\u7b7e'] || row.Tags).split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
    };
  });
}
