import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Playlist, PlaylistItem } from '@m3u8-preview/shared';

function serializePlaylist(playlist: any): Playlist {
  return {
    ...playlist,
    createdAt: playlist.createdAt instanceof Date ? playlist.createdAt.toISOString() : playlist.createdAt,
    updatedAt: playlist.updatedAt instanceof Date ? playlist.updatedAt.toISOString() : playlist.updatedAt,
    items: playlist.items?.map(serializePlaylistItem),
  };
}

function serializePlaylistItem(item: any): PlaylistItem {
  return {
    ...item,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    media: item.media ? {
      ...item.media,
      createdAt: item.media.createdAt instanceof Date ? item.media.createdAt.toISOString() : item.media.createdAt,
      updatedAt: item.media.updatedAt instanceof Date ? item.media.updatedAt.toISOString() : item.media.updatedAt,
      category: item.media.category ? {
        ...item.media.category,
        createdAt: item.media.category.createdAt instanceof Date ? item.media.category.createdAt.toISOString() : item.media.category.createdAt,
        updatedAt: item.media.category.updatedAt instanceof Date ? item.media.category.updatedAt.toISOString() : item.media.category.updatedAt,
      } : item.media.category,
      tags: item.media.tags?.map((mt: any) => ({
        id: mt.tag?.id ?? mt.id,
        name: mt.tag?.name ?? mt.name,
        createdAt: (mt.tag?.createdAt ?? mt.createdAt) instanceof Date ? (mt.tag?.createdAt ?? mt.createdAt).toISOString() : (mt.tag?.createdAt ?? mt.createdAt),
        updatedAt: (mt.tag?.updatedAt ?? mt.updatedAt) instanceof Date ? (mt.tag?.updatedAt ?? mt.updatedAt).toISOString() : (mt.tag?.updatedAt ?? mt.updatedAt),
      })),
    } : item.media,
  };
}

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

    // Get max position
    const maxPosition = await prisma.playlistItem.aggregate({
      where: { playlistId },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const item = await prisma.playlistItem.create({
      data: {
        playlistId,
        mediaId,
        position: nextPosition,
      },
      include: playlistItemInclude,
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

    // Update position for each item based on its index in the itemIds array
    for (let i = 0; i < itemIds.length; i++) {
      await prisma.playlistItem.update({
        where: { id: itemIds[i] },
        data: { position: i },
      });
    }
  },

  async getPublicPlaylists(page: number = 1, limit: number = 20): Promise<{ items: Playlist[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where: { isPublic: true },
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.playlist.count({ where: { isPublic: true } }),
    ]);

    return {
      items: playlists.map(serializePlaylist),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
