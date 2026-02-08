import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { WatchHistory, PaginatedResponse } from '@m3u8-preview/shared';
import { serializeHistory } from '../utils/serializers.js';

const mediaInclude = {
  category: true,
  tags: { include: { tag: true } },
};

export const watchHistoryService = {
  async updateProgress(
    userId: string,
    mediaId: string,
    progress: number,
    duration: number,
  ): Promise<WatchHistory> {
    const percentage = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0;
    const completed = percentage >= 90;

    // 防回退：新值小于旧值且小于 30 秒 → 判定为初始化回退，跳过更新
    const existing = await prisma.watchHistory.findUnique({
      where: { userId_mediaId: { userId, mediaId } },
      include: { media: { include: mediaInclude } },
    });
    if (existing && progress < existing.progress && progress < 30) {
      return serializeHistory(existing);
    }

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

  async getProgressMap(userId: string): Promise<Record<string, { percentage: number; completed: boolean }>> {
    const histories = await prisma.watchHistory.findMany({
      where: { userId, progress: { gt: 0 } },
      select: { mediaId: true, percentage: true, completed: true },
      take: 500,
    });
    const map: Record<string, { percentage: number; completed: boolean }> = {};
    for (const h of histories) {
      map[h.mediaId] = { percentage: h.percentage, completed: h.completed };
    }
    return map;
  },
};
