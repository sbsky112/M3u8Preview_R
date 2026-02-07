import { prisma } from '../lib/prisma.js';
import { importItemSchema } from '@m3u8-preview/shared';
import type { ImportItem, ImportPreviewResponse, ImportResult, ImportError } from '@m3u8-preview/shared';

export const importService = {
  preview(items: ImportItem[]): ImportPreviewResponse {
    const errors: ImportError[] = [];
    let validCount = 0;

    items.forEach((item, index) => {
      const result = importItemSchema.safeParse(item);
      if (result.success) {
        validCount++;
      } else {
        result.error.errors.forEach(err => {
          errors.push({
            row: index + 1,
            field: err.path.join('.'),
            message: err.message,
          });
        });
      }
    });

    return {
      items,
      totalCount: items.length,
      validCount,
      invalidCount: items.length - validCount,
      errors,
    };
  },

  async execute(userId: string, items: ImportItem[], format: string, fileName?: string): Promise<ImportResult> {
    const errors: ImportError[] = [];
    let successCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const validation = importItemSchema.safeParse(item);
      if (!validation.success) {
        validation.error.errors.forEach(err => {
          errors.push({ row: i + 1, field: err.path.join('.'), message: err.message });
        });
        continue;
      }

      try {
        // Find or create category
        let categoryId: string | undefined;
        if (item.categoryName) {
          const slug = item.categoryName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') || 'uncategorized';
          const category = await prisma.category.upsert({
            where: { name: item.categoryName },
            update: {},
            create: { name: item.categoryName, slug },
          });
          categoryId = category.id;
        }

        // Create media
        const media = await prisma.media.create({
          data: {
            title: item.title,
            m3u8Url: item.m3u8Url,
            posterUrl: item.posterUrl || null,
            description: item.description || null,
            year: item.year || null,
            categoryId: categoryId || null,
          },
        });

        // Find or create tags and link
        if (item.tagNames && item.tagNames.length > 0) {
          for (const tagName of item.tagNames) {
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: {},
              create: { name: tagName },
            });
            await prisma.mediaTag.create({
              data: { mediaId: media.id, tagId: tag.id },
            }).catch(() => {}); // Ignore duplicate
          }
        }

        successCount++;
      } catch (err: any) {
        errors.push({ row: i + 1, field: 'general', message: err.message || 'Unknown error' });
      }
    }

    // Log the import
    const status = successCount === items.length ? 'SUCCESS' : successCount > 0 ? 'PARTIAL' : 'FAILED';
    await prisma.importLog.create({
      data: {
        userId,
        format,
        fileName: fileName || null,
        totalCount: items.length,
        successCount,
        failedCount: items.length - successCount,
        status,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });

    return {
      totalCount: items.length,
      successCount,
      failedCount: items.length - successCount,
      errors,
    };
  },

  generateCsvTemplate(): string {
    return 'title,m3u8Url,posterUrl,description,year,category,tags\n"\u793a\u4f8b\u89c6\u9891","https://example.com/video.m3u8","https://example.com/poster.jpg","\u89c6\u9891\u63cf\u8ff0",2024,"\u7535\u5f71","\u52a8\u4f5c,\u79d1\u5e7b"\n';
  },

  generateJsonTemplate(): string {
    return JSON.stringify([
      {
        title: '\u793a\u4f8b\u89c6\u9891',
        m3u8Url: 'https://example.com/video.m3u8',
        posterUrl: 'https://example.com/poster.jpg',
        description: '\u89c6\u9891\u63cf\u8ff0',
        year: 2024,
        categoryName: '\u7535\u5f71',
        tagNames: ['\u52a8\u4f5c', '\u79d1\u5e7b'],
      },
    ], null, 2);
  },
};
