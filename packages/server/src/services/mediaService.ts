import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { MediaCreateRequest, MediaUpdateRequest, MediaQueryParams, PaginatedResponse, Media } from '@m3u8-preview/shared';

function serializeMedia(media: any): Media {
  return {
    ...media,
    createdAt: media.createdAt instanceof Date ? media.createdAt.toISOString() : media.createdAt,
    updatedAt: media.updatedAt instanceof Date ? media.updatedAt.toISOString() : media.updatedAt,
    category: media.category ? {
      ...media.category,
      createdAt: media.category.createdAt instanceof Date ? media.category.createdAt.toISOString() : media.category.createdAt,
      updatedAt: media.category.updatedAt instanceof Date ? media.category.updatedAt.toISOString() : media.category.updatedAt,
    } : media.category,
    tags: media.tags?.map((mt: any) => ({
      id: mt.tag?.id ?? mt.id,
      name: mt.tag?.name ?? mt.name,
      createdAt: (mt.tag?.createdAt ?? mt.createdAt) instanceof Date ? (mt.tag?.createdAt ?? mt.createdAt).toISOString() : (mt.tag?.createdAt ?? mt.createdAt),
      updatedAt: (mt.tag?.updatedAt ?? mt.updatedAt) instanceof Date ? (mt.tag?.updatedAt ?? mt.updatedAt).toISOString() : (mt.tag?.updatedAt ?? mt.updatedAt),
    })),
  };
}

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

    // If tagIds provided, replace all tags
    if (tagIds !== undefined) {
      await prisma.mediaTag.deleteMany({ where: { mediaId: id } });
      if (tagIds.length > 0) {
        await prisma.mediaTag.createMany({
          data: tagIds.map(tagId => ({ mediaId: id, tagId })),
        });
      }
    }

    const media = await prisma.media.update({
      where: { id },
      data: mediaData,
      include: mediaInclude,
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
    // SQLite doesn't have RANDOM() in Prisma, so we fetch all IDs and pick randomly
    const allIds = await prisma.media.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    const shuffled = allIds.sort(() => 0.5 - Math.random()).slice(0, count);
    const items = await prisma.media.findMany({
      where: { id: { in: shuffled.map(i => i.id) } },
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
