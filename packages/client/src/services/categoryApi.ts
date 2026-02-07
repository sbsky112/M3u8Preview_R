import api from './api.js';
import type { ApiResponse, Category } from '@m3u8-preview/shared';

export const categoryApi = {
  async getAll() {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories');
    return data.data!;
  },

  async getById(id: string) {
    const { data } = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return data.data!;
  },
};
