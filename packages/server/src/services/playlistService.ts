import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Playlist, PlaylistItem } from '@m3u8-preview/shared';
import { serializePlaylist, serializePlaylistItem } from '../utils/serializers.js';

const playlistItemInclude = {
  media: {
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
  },
};

export const playlistService = {
  async findAll(userId: string): Promise<Playlist[]> {
    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return playlists.map(serializePlaylist);
  },

  async findById(id: string, userId: string): Promise<Playlist> {
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          include: playlistItemInclude,
          orderBy: { position: 'asc' },
        },
        _count: { select: { items: true } },
      },
    });

    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }

    // Only owner or public playlists can be accessed
    if (playlist.userId !== userId && !playlist.isPublic) {
      throw new AppError('Access denied', 403);
    }

    return serializePlaylist(playlist);
  },

  async create(userId: string, data: { name: string; description?: string; isPublic?: boolean }): Promise<Playlist> {
    const playlist = await prisma.playlist.create({
      data: {
        name: data.name,
        description: data.description || null,
        isPublic: data.isPublic ?? false,
        userId,
      },
      include: {
        _count: { select: { items: true } },
      },
    });
    return serializePlaylist(playlist);
  },

  async update(id: string, userId: string, data: { name?: string; description?: string; isPublic?: boolean }): Promise<Playlist> {
    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Playlist not found', 404);
    }
    if (existing.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    const playlist = await prisma.playlist.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
      include: {
        _count: { select: { items: true } },
      },
    });
    return serializePlaylist(playlist);
  },

  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Playlist not found', 404);
    }
    if (existing.userId !== userId) {
      throw new AppError('Access denied', 403);
    }
    await prisma.playlist.delete({ where: { id } });
  },

  async addItem(playlistId: string, userId: string, mediaId: string): Promise<PlaylistItem> {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }
    if (playlist.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    // Check media exists
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new AppError('Media not found', 404);
    }

    // Check if already in playlist
    const existingItem = await prisma.playlistItem.findUnique({
      where: { playlistId_mediaId: { playlistId, mediaId } },
    });
    if (existingItem) {
      throw new AppError('Media already in playlist', 409);
    }

    // Get max position and create item in a transaction to prevent race conditions
    const item = await prisma.$transaction(async (tx) => {
      const maxPosition = await tx.playlistItem.aggregate({
        where: { playlistId },
        _max: { position: true },
      });
      const nextPosition = (maxPosition._max.position ?? -1) + 1;

      return tx.playlistItem.create({
        data: {
          playlistId,
          mediaId,
          position: nextPosition,
        },
        include: playlistItemInclude,
      });
    });

    return serializePlaylistItem(item);
  },

  async removeItem(playlistId: string, userId: string, mediaId: string): Promise<void> {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }
    if (playlist.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    const item = await prisma.playlistItem.findUnique({
      where: { playlistId_mediaId: { playlistId, mediaId } },
    });
    if (!item) {
      throw new AppError('Item not found in playlist', 404);
    }

    await prisma.playlistItem.delete({
      where: { id: item.id },
    });
  },

  async reorderItems(playlistId: string, userId: string, itemIds: string[]): Promise<void> {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new AppError('Playlist not found', 404);
    }
    if (playlist.userId !== userId) {
      throw new AppError('Access denied', 403);
    }

    // M10: 校验 itemIds 都属于该 playlist，并使用事务批量更新（消除 N+1）
    const existingItems = await prisma.playlistItem.findMany({
      where: { playlistId },
      select: { id: true },
    });
    const existingSet = new Set(existingItems.map(i => i.id));
    const invalidIds = itemIds.filter(id => !existingSet.has(id));
    if (invalidIds.length > 0) {
      throw new AppError('Some item IDs do not belong to this playlist', 400);
    }

    await prisma.$transaction(
      itemIds.map((itemId, i) =>
        prisma.playlistItem.update({
          where: { id: itemId },
          data: { position: i },
        }),
      ),
    );
  },

  async getPublicPlaylists(page: number = 1, limit: number = 20): Promise<{ items: Playlist[]; total: number; page: number; limit: number; totalPages: number }> {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * safeLimit;

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where: { isPublic: true },
        include: {
          user: { select: { username: true } },
          _count: { select: { items: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      prisma.playlist.count({ where: { isPublic: true } }),
    ]);

    return {
      items: playlists.map((p) => {
        const serialized = serializePlaylist(p);
        // Exclude userId from public API, expose only username
        const { userId: _uid, ...rest } = serialized;
        return rest;
      }),
      total,
      page,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  },
};
