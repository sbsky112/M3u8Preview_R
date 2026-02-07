import api from './api.js';
import type { ApiResponse, AuthResponse, User } from '@m3u8-preview/shared';

export const authApi = {
  async register(username: string, email: string, password: string) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      username,
      email,
      password,
    });
    return data.data!;
  },

  async login(username: string, password: string) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      username,
      password,
    });
    return data.data!;
  },

  async refresh() {
    const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return data.data!;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async getMe() {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data!;
  },
};
