import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { MediaCreateRequest, MediaUpdateRequest, MediaQueryParams, PaginatedResponse, Media } from '@m3u8-preview/shared';
import { serializeMedia } from '../utils/serializers.js';

const mediaInclude = {
  category: true,
  tags: { include: { tag: true } },
};

export const mediaService = {
  async findAll(query: MediaQueryParams): Promise<PaginatedResponse<Media>> {
    const { page = 1, limit = 20, search, categoryId, tagId, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (tagId) {
      where.tags = { some: { tagId } };
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: mediaInclude,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.media.count({ where }),
    ]);

    return {
      items: items.map(serializeMedia),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: string): Promise<Media> {
    const media = await prisma.media.findUnique({
      where: { id },
      include: mediaInclude,
    });
    if (!media) {
      throw new AppError('Media not found', 404);
    }
    return serializeMedia(media);
  },

  async create(data: MediaCreateRequest): Promise<Media> {
    const { tagIds, ...mediaData } = data;
    const media = await prisma.media.create({
      data: {
        ...mediaData,
        tags: tagIds?.length ? {
          create: tagIds.map(tagId => ({ tagId })),
        } : undefined,
      },
      include: mediaInclude,
    });
    return serializeMedia(media);
  },

  async update(id: string, data: MediaUpdateRequest): Promise<Media> {
    const existing = await prisma.media.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Media not found', 404);
    }

    const { tagIds, ...mediaData } = data;

    // M11: 使用事务确保 tag 替换的原子性
    const media = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.mediaTag.deleteMany({ where: { mediaId: id } });
        if (tagIds.length > 0) {
          await tx.mediaTag.createMany({
            data: tagIds.map(tagId => ({ mediaId: id, tagId })),
          });
        }
      }
      return tx.media.update({
        where: { id },
        data: mediaData,
        include: mediaInclude,
      });
    });

    return serializeMedia(media);
  },

  async delete(id: string): Promise<void> {
    const existing = await prisma.media.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Media not found', 404);
    }
    await prisma.media.delete({ where: { id } });
  },

  async incrementViews(id: string): Promise<void> {
    await prisma.media.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  },

  async getRandom(count: number = 10): Promise<Media[]> {
    // H6: 使用 Prisma raw query 利用 SQLite RANDOM()，避免加载全部 ID 到内存
    const randomIds = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM Media WHERE status = 'ACTIVE' ORDER BY RANDOM() LIMIT ?`,
      count,
    );

    if (randomIds.length === 0) return [];

    const items = await prisma.media.findMany({
      where: { id: { in: randomIds.map(i => i.id) } },
      include: mediaInclude,
    });
    return items.map(serializeMedia);
  },

  async getRecent(count: number = 10): Promise<Media[]> {
    const items = await prisma.media.findMany({
      where: { status: 'ACTIVE' },
      include: mediaInclude,
      orderBy: { createdAt: 'desc' },
      take: count,
    });
    return items.map(serializeMedia);
  },
};
