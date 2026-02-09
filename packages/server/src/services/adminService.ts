import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { DashboardStats, PaginatedResponse, UserWithStats, Media, BatchOperationResult } from '@m3u8-preview/shared';
import { serializeMedia } from '../utils/serializers.js';
import { deleteThumbnail } from './thumbnailService.js';

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
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
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
  async updateUser(id: string, data: { role?: string; isActive?: boolean }, currentUserId?: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    // 防止将 ADMIN 降级为 USER 后系统无管理员
    if (user.role === 'ADMIN' && data.role === 'USER') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new AppError('Cannot demote the last admin user', 400);
      }
    }

    // 防止管理员停用自己
    if (currentUserId && id === currentUserId && data.isActive === false) {
      throw new AppError('Cannot deactivate yourself', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
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

  /**
   * 批量删除媒体
   */
  async batchDeleteMedia(ids: string[]): Promise<BatchOperationResult> {
    // 先查询要删除的媒体，用于后续清理缩略图
    const mediaList = await prisma.media.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const result = await prisma.media.deleteMany({
      where: { id: { in: ids } },
    });

    if (result.count === 0) {
      throw new AppError('未找到匹配记录', 404);
    }

    // 异步清理缩略图，静默失败
    for (const media of mediaList) {
      deleteThumbnail(media.id).catch(() => {});
    }

    return { affectedCount: result.count };
  },

  /**
   * 批量修改媒体状态
   */
  async batchUpdateStatus(ids: string[], status: 'ACTIVE' | 'INACTIVE'): Promise<BatchOperationResult> {
    const result = await prisma.media.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    if (result.count === 0) {
      throw new AppError('未找到匹配记录', 404);
    }

    return { affectedCount: result.count };
  },

  /**
   * 批量修改媒体分类
   */
  async batchUpdateCategory(ids: string[], categoryId: string | null): Promise<BatchOperationResult> {
    if (categoryId !== null) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        throw new AppError('分类不存在', 404);
      }
    }

    const result = await prisma.media.updateMany({
      where: { id: { in: ids } },
      data: { categoryId },
    });

    if (result.count === 0) {
      throw new AppError('未找到匹配记录', 404);
    }

    return { affectedCount: result.count };
  },
};
