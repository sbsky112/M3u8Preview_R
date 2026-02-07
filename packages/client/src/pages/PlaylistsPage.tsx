import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { playlistApi } from '../services/playlistApi.js';
import type { Playlist } from '@m3u8-preview/shared';

export function PlaylistsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const queryClient = useQueryClient();

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: () => playlistApi.create(newName, newDesc || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => playlistApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">播放列表</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark text-sm"
        >
          + 新建列表
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-emby-bg-card border border-emby-border-subtle rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="播放列表名称"
            className="w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
            autoFocus
          />
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="描述（可选）"
            className="w-full px-3 py-2 bg-emby-bg-input border border-emby-border rounded-md text-white placeholder-emby-text-muted focus:outline-none focus:ring-2 focus:ring-emby-green"
          />
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
              className="px-4 py-2 bg-emby-green text-white rounded-lg hover:bg-emby-green-dark disabled:opacity-50 text-sm"
            >
              创建
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-emby-bg-input text-emby-text-primary rounded-lg hover:bg-emby-bg-elevated text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Playlists grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-emby-bg-input rounded-lg h-32" />
          ))}
        </div>
      ) : playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {playlists.map((playlist: Playlist) => (
            <div key={playlist.id} className="bg-emby-bg-card border border-emby-border-subtle rounded-lg p-4 hover:border-emby-border-light transition-colors group">
              <Link to={`/playlists/${playlist.id}`} className="block">
                <h3 className="text-white font-medium group-hover:text-emby-green-light transition-colors">{playlist.name}</h3>
                {playlist.description && (
                  <p className="text-emby-text-muted text-sm mt-1 line-clamp-2">{playlist.description}</p>
                )}
                <p className="text-emby-text-secondary text-xs mt-2">{playlist._count?.items || 0} 个视频</p>
              </Link>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-emby-text-muted">{playlist.isPublic ? '公开' : '私密'}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm('确定要删除这个播放列表吗？')) {
                      deleteMutation.mutate(playlist.id);
                    }
                  }}
                  className="text-emby-text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-emby-text-muted">
          <p>还没有播放列表</p>
          <p className="text-sm mt-1">点击上方按钮创建一个</p>
        </div>
      )}
    </div>
  );
}
