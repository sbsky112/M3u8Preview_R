import api from './api.js';
import type { ApiResponse, DashboardStats, PaginatedResponse } from '@m3u8-preview/shared';

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
};
