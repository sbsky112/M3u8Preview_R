import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Favorite, PaginatedResponse } from '@m3u8-preview/shared';

const mediaInclude = {
  category: true,
  tags: { include: { tag: true } },
};

function serializeFavorite(fav: any): Favorite {
  const result: any = {
    id: fav.id,
    userId: fav.userId,
    mediaId: fav.mediaId,
    createdAt: fav.createdAt instanceof Date ? fav.createdAt.toISOString() : fav.createdAt,
  };

  if (fav.media) {
    result.media = {
      ...fav.media,
      createdAt: fav.media.createdAt instanceof Date ? fav.media.createdAt.toISOString() : fav.media.createdAt,
      updatedAt: fav.media.updatedAt instanceof Date ? fav.media.updatedAt.toISOString() : fav.media.updatedAt,
      category: fav.media.category ? {
        ...fav.media.category,
        createdAt: fav.media.category.createdAt instanceof Date ? fav.media.category.createdAt.toISOString() : fav.media.category.createdAt,
        updatedAt: fav.media.category.updatedAt instanceof Date ? fav.media.category.updatedAt.toISOString() : fav.media.category.updatedAt,
      } : fav.media.category,
      tags: fav.media.tags?.map((mt: any) => ({
        id: mt.tag?.id ?? mt.id,
        name: mt.tag?.name ?? mt.name,
        createdAt: (mt.tag?.createdAt ?? mt.createdAt) instanceof Date ? (mt.tag?.createdAt ?? mt.createdAt).toISOString() : (mt.tag?.createdAt ?? mt.createdAt),
        updatedAt: (mt.tag?.updatedAt ?? mt.updatedAt) instanceof Date ? (mt.tag?.updatedAt ?? mt.updatedAt).toISOString() : (mt.tag?.updatedAt ?? mt.updatedAt),
      })),
    };
  }

  return result;
}

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

    await prisma.favorite.create({
      data: { userId, mediaId },
    });
    return { isFavorited: true };
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
