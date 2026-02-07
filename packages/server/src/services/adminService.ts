import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { DashboardStats, PaginatedResponse, UserWithStats, Media } from '@m3u8-preview/shared';

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

export const adminService = {
  /**
   * Get dashboard statistics including totals, recent media, and top media by views.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalMedia, totalUsers, totalCategories, viewsResult, recentMedia, topMedia] = await Promise.all([
      prisma.media.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.media.aggregate({ _sum: { views: true } }),
      prisma.media.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { category: true },
      }),
      prisma.media.findMany({
        orderBy: { views: 'desc' },
        take: 5,
        include: { category: true },
      }),
    ]);

    return {
      totalMedia,
      totalUsers,
      totalCategories,
      totalViews: viewsResult._sum.views || 0,
      recentMedia: recentMedia.map(serializeMedia),
      topMedia: topMedia.map(serializeMedia),
    };
  },

  /**
   * Get paginated list of all users with optional search filtering.
   * Excludes passwordHash from results and includes relationship counts.
   */
  async getAllUsers(page: number = 1, limit: number = 20, search?: string): Promise<PaginatedResponse<UserWithStats>> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              favorites: true,
              playlists: true,
              watchHistory: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: items.map(u => ({
        ...u,
        createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
        updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : u.updatedAt,
      })) as UserWithStats[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Update a user's role and/or active status.
   */
  async updateUser(id: string, data: { role?: string; isActive?: boolean }) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
      updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : updated.updatedAt,
    };
  },

  /**
   * Delete a user by ID. Prevents deletion of admin users.
   */
  async deleteUser(id: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);
    if (user.role === 'ADMIN') throw new AppError('Cannot delete admin user', 400);
    await prisma.user.delete({ where: { id } });
  },

  /**
   * Get all system settings.
   */
  async getSystemSettings() {
    const settings = await prisma.systemSetting.findMany();
    return settings.map(s => ({
      key: s.key,
      value: s.value,
    }));
  },

  /**
   * Update or create a system setting by key.
   */
  async updateSystemSetting(key: string, value: string) {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return {
      key: setting.key,
      value: setting.value,
    };
  },

  /**
   * Get paginated media list for admin with additional filtering by status.
   */
  async getAllMedia(page: number = 1, limit: number = 20, search?: string, status?: string): Promise<PaginatedResponse<Media>> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { m3u8Url: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
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
};
