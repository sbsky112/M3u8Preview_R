import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { WatchHistory, PaginatedResponse } from '@m3u8-preview/shared';

const mediaInclude = {
  category: true,
  tags: { include: { tag: true } },
};

function serializeHistory(history: any): WatchHistory {
  const result: any = {
    id: history.id,
    userId: history.userId,
    mediaId: history.mediaId,
    progress: history.progress,
    duration: history.duration,
    percentage: history.percentage,
    completed: history.completed,
    updatedAt: history.updatedAt instanceof Date ? history.updatedAt.toISOString() : history.updatedAt,
  };

  if (history.media) {
    result.media = {
      ...history.media,
      createdAt: history.media.createdAt instanceof Date ? history.media.createdAt.toISOString() : history.media.createdAt,
      updatedAt: history.media.updatedAt instanceof Date ? history.media.updatedAt.toISOString() : history.media.updatedAt,
      category: history.media.category ? {
        ...history.media.category,
        createdAt: history.media.category.createdAt instanceof Date ? history.media.category.createdAt.toISOString() : history.media.category.createdAt,
        updatedAt: history.media.category.updatedAt instanceof Date ? history.media.category.updatedAt.toISOString() : history.media.category.updatedAt,
      } : history.media.category,
      tags: history.media.tags?.map((mt: any) => ({
        id: mt.tag?.id ?? mt.id,
        name: mt.tag?.name ?? mt.name,
        createdAt: (mt.tag?.createdAt ?? mt.createdAt) instanceof Date ? (mt.tag?.createdAt ?? mt.createdAt).toISOString() : (mt.tag?.createdAt ?? mt.createdAt),
        updatedAt: (mt.tag?.updatedAt ?? mt.updatedAt) instanceof Date ? (mt.tag?.updatedAt ?? mt.updatedAt).toISOString() : (mt.tag?.updatedAt ?? mt.updatedAt),
      })),
    };
  }

  return result;
}

export const watchHistoryService = {
  async updateProgress(
    userId: string,
    mediaId: string,
    progress: number,
    duration: number,
  ): Promise<WatchHistory> {
    // Verify media exists
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new AppError('Media not found', 404);
    }

    const percentage = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;
    const completed = percentage >= 90;

    const history = await prisma.watchHistory.upsert({
      where: {
        userId_mediaId: { userId, mediaId },
      },
      create: {
        userId,
        mediaId,
        progress,
        duration,
        percentage,
        completed,
      },
      update: {
        progress,
        duration,
        percentage,
        completed,
      },
      include: {
        media: { include: mediaInclude },
      },
    });

    return serializeHistory(history);
  },

  async getHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<WatchHistory>> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.watchHistory.findMany({
        where: { userId },
        include: {
          media: { include: mediaInclude },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.watchHistory.count({ where: { userId } }),
    ]);

    return {
      items: items.map(serializeHistory),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getContinueWatching(
    userId: string,
    limit: number = 10,
  ): Promise<WatchHistory[]> {
    const items = await prisma.watchHistory.findMany({
      where: {
        userId,
        completed: false,
        progress: { gt: 0 },
      },
      include: {
        media: { include: mediaInclude },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return items.map(serializeHistory);
  },

  async getProgress(userId: string, mediaId: string): Promise<WatchHistory | null> {
    const history = await prisma.watchHistory.findUnique({
      where: {
        userId_mediaId: { userId, mediaId },
      },
      include: {
        media: { include: mediaInclude },
      },
    });

    return history ? serializeHistory(history) : null;
  },

  async deleteHistory(userId: string, id: string): Promise<void> {
    const history = await prisma.watchHistory.findUnique({ where: { id } });
    if (!history) {
      throw new AppError('Watch history not found', 404);
    }
    if (history.userId !== userId) {
      throw new AppError('Not authorized to delete this history', 403);
    }
    await prisma.watchHistory.delete({ where: { id } });
  },

  async clearHistory(userId: string): Promise<void> {
    await prisma.watchHistory.deleteMany({ where: { userId } });
  },
};
