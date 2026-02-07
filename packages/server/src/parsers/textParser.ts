import type { ImportItem } from '@m3u8-preview/shared';

export function parseText(content: string): ImportItem[] {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

  return lines.map(line => {
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim());
      return {
        title: parts[0] || '',
        m3u8Url: parts[1] || '',
        categoryName: parts[2] || undefined,
        tagNames: parts[3] ? parts[3].split(',').map(t => t.trim()).filter(Boolean) : undefined,
      };
    }

    // URL only - extract title from URL
    const url = line;
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1]?.replace(/\.m3u8.*$/, '') || 'Untitled';
    // L12: decodeURIComponent 可能抛 URIError，安全降级
    let title: string;
    try {
      title = decodeURIComponent(filename);
    } catch {
      title = filename;
    }
    return {
      title,
      m3u8Url: url,
    };
  });
}
