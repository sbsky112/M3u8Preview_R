import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Category, CategoryCreateRequest } from '@m3u8-preview/shared';

function serializeCategory(category: any): Category {
  return {
    ...category,
    createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : category.createdAt,
    updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : category.updatedAt,
  };
}

export const categoryService = {
  async findAll(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { media: true } },
      },
      orderBy: { name: 'asc' },
    });
    return categories.map(serializeCategory);
  },

  async findById(id: string): Promise<Category> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { media: true } },
      },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    return serializeCategory(category);
  },

  async create(data: CategoryCreateRequest): Promise<Category> {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: data.name }, { slug: data.slug }],
      },
    });
    if (existing) {
      throw new AppError('Category with this name or slug already exists', 409);
    }

    const category = await prisma.category.create({
      data,
      include: {
        _count: { select: { media: true } },
      },
    });
    return serializeCategory(category);
  },

  async update(id: string, data: Partial<CategoryCreateRequest>): Promise<Category> {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    // Check uniqueness if name or slug is being changed
    if (data.name || data.slug) {
      const conflict = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.name ? [{ name: data.name }] : []),
                ...(data.slug ? [{ slug: data.slug }] : []),
              ],
            },
          ],
        },
      });
      if (conflict) {
        throw new AppError('Category with this name or slug already exists', 409);
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        _count: { select: { media: true } },
      },
    });
    return serializeCategory(category);
  },

  async delete(id: string): Promise<void> {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404);
    }
    await prisma.category.delete({ where: { id } });
  },
};
