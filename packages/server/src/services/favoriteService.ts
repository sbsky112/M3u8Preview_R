import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Favorite, PaginatedResponse } from '@m3u8-preview/shared';
import { serializeFavorite } from '../utils/serializers.js';

const mediaInclude = {
  category: true,
  tags: { include: { tag: true } },
};

export const favoriteService = {
  async toggle(userId: string, mediaId: string): Promise<{ isFavorited: boolean }> {
    // Verify media exists
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new AppError('Media not found', 404);
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_mediaId: { userId, mediaId },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { isFavorited: false };
    }

    try {
      await prisma.favorite.create({
        data: { userId, mediaId },
      });
      return { isFavorited: true };
    } catch (err: any) {
      if (err.code === 'P2002') {
        // 并发创建冲突，说明已存在，改为删除
        await prisma.favorite.delete({ where: { userId_mediaId: { userId, mediaId } } });
        return { isFavorited: false };
      }
      throw err;
    }
  },

  async isFavorited(userId: string, mediaId: string): Promise<boolean> {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_mediaId: { userId, mediaId },
      },
    });
    return !!favorite;
  },

  async getFavorites(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<Favorite>> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: {
          media: { include: mediaInclude },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      items: items.map(serializeFavorite),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
