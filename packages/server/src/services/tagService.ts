import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Tag, TagCreateRequest } from '@m3u8-preview/shared';

function serializeTag(tag: any): Tag {
  return {
    ...tag,
    createdAt: tag.createdAt instanceof Date ? tag.createdAt.toISOString() : tag.createdAt,
    updatedAt: tag.updatedAt instanceof Date ? tag.updatedAt.toISOString() : tag.updatedAt,
  };
}

export const tagService = {
  async findAll(): Promise<Tag[]> {
    const tags = await prisma.tag.findMany({
      include: {
        _count: { select: { media: true } },
      },
      orderBy: { name: 'asc' },
    });
    return tags.map(serializeTag);
  },

  async findById(id: string): Promise<Tag> {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: { select: { media: true } },
      },
    });
    if (!tag) {
      throw new AppError('Tag not found', 404);
    }
    return serializeTag(tag);
  },

  async create(data: TagCreateRequest): Promise<Tag> {
    const existing = await prisma.tag.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new AppError('Tag with this name already exists', 409);
    }

    const tag = await prisma.tag.create({
      data,
      include: {
        _count: { select: { media: true } },
      },
    });
    return serializeTag(tag);
  },

  async update(id: string, data: Partial<TagCreateRequest>): Promise<Tag> {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Tag not found', 404);
    }

    if (data.name) {
      const conflict = await prisma.tag.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });
      if (conflict) {
        throw new AppError('Tag with this name already exists', 409);
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data,
      include: {
        _count: { select: { media: true } },
      },
    });
    return serializeTag(tag);
  },

  async delete(id: string): Promise<void> {
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Tag not found', 404);
    }
    await prisma.tag.delete({ where: { id } });
  },
};
