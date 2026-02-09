import api from './api.js';
import type { ApiResponse, DashboardStats, PaginatedResponse, RestoreResult } from '@m3u8-preview/shared';

export const adminApi = {
  async getDashboard() {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    return data.data!;
  },

  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<any>>>('/admin/users', {
      params: { page, limit, search },
    });
    return data.data!;
  },

  async updateUser(id: string, payload: { role?: string; isActive?: boolean }) {
    const { data } = await api.put<ApiResponse<any>>(`/admin/users/${id}`, payload);
    return data.data!;
  },

  async deleteUser(id: string) {
    await api.delete(`/admin/users/${id}`);
  },

  async getSettings() {
    const { data } = await api.get<ApiResponse<Array<{ key: string; value: string }>>>('/admin/settings');
    return data.data!;
  },

  async updateSetting(key: string, value: string) {
    await api.put('/admin/settings', { key, value });
  },

  async exportBackup() {
    const response = await api.get('/admin/backup/export', {
      responseType: 'blob',
      timeout: 300000,
    });
    const blob = response.data as Blob;

    // 从 Content-Disposition 提取文件名
    const disposition = response.headers['content-disposition'];
    const match = disposition?.match(/filename="?([^";\n]+)"?/);
    const filename = match?.[1] || `backup-${new Date().toISOString().slice(0, 19)}.zip`;

    // 创建临时 <a> 标签触发下载
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async importBackup(file: File): Promise<RestoreResult> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<ApiResponse<RestoreResult>>('/admin/backup/import', formData, {
      timeout: 300000,
    });
    return data.data!;
  },
};
