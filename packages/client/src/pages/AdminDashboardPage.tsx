import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Film, Users, FolderOpen, Play, Settings, Download } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-emby-bg-input rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-emby-bg-input rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: '总媒体数', value: stats.totalMedia, icon: Film, color: 'text-blue-400' },
    { label: '总用户数', value: stats.totalUsers, icon: Users, color: 'text-green-400' },
    { label: '分类数', value: stats.totalCategories, icon: FolderOpen, color: 'text-purple-400' },
    { label: '总播放量', value: stats.totalViews, icon: Play, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-emby-text-secondary" />
        <h1 className="text-2xl font-bold text-white">管理面板</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-emby-bg-card border border-emby-border-subtle rounded-md p-5">
            <div className="flex items-center justify-between">
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <p className="text-3xl font-bold text-white mt-3">{card.value.toLocaleString()}</p>
            <p className="text-sm text-emby-text-secondary mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/users" className="bg-emby-bg-card border border-emby-border-subtle rounded-md p-5 hover:border-emby-border-light transition-colors group">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emby-text-secondary group-hover:text-emby-green-light" />
            <h3 className="text-white font-semibold group-hover:text-emby-green-light">用户管理</h3>
          </div>
          <p className="text-emby-text-muted text-sm mt-1">管理用户角色和状态</p>
        </Link>
        <Link to="/admin/media" className="bg-emby-bg-card border border-emby-border-subtle rounded-md p-5 hover:border-emby-border-light transition-colors group">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-emby-text-secondary group-hover:text-emby-green-light" />
            <h3 className="text-white font-semibold group-hover:text-emby-green-light">媒体管理</h3>
          </div>
          <p className="text-emby-text-muted text-sm mt-1">管理所有媒体内容</p>
        </Link>
        <Link to="/import" className="bg-emby-bg-card border border-emby-border-subtle rounded-md p-5 hover:border-emby-border-light transition-colors group">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emby-text-secondary group-hover:text-emby-green-light" />
            <h3 className="text-white font-semibold group-hover:text-emby-green-light">批量导入</h3>
          </div>
          <p className="text-emby-text-muted text-sm mt-1">导入M3U8链接</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Media */}
        <div className="bg-emby-bg-card border border-emby-border-subtle rounded-md p-5">
          <h3 className="text-white font-semibold mb-4">最近添加</h3>
          <div className="space-y-3">
            {stats.recentMedia.map((media: any) => (
              <Link key={media.id} to={`/media/${media.id}`} className="flex items-center gap-3 text-sm group">
                <div className="w-16 aspect-video bg-emby-bg-input rounded flex-shrink-0 overflow-hidden">
                  {media.posterUrl ? (
                    <img src={media.posterUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-4 h-4 text-emby-text-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white truncate group-hover:text-emby-green-light">{media.title}</p>
                  <p className="text-emby-text-muted text-xs">{media.category?.name || '未分类'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Media */}
        <div className="bg-emby-bg-card border border-emby-border-subtle rounded-md p-5">
          <h3 className="text-white font-semibold mb-4">热门内容</h3>
          <div className="space-y-3">
            {stats.topMedia.map((media: any, index: number) => (
              <Link key={media.id} to={`/media/${media.id}`} className="flex items-center gap-3 text-sm group">
                <span className="text-emby-text-muted font-mono w-6 text-center">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white truncate group-hover:text-emby-green-light">{media.title}</p>
                </div>
                <span className="text-emby-text-muted text-xs flex-shrink-0">{media.views} 次</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
