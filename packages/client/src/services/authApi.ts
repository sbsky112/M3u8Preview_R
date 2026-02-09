import axios from 'axios';
import api from './api.js';
import type { ApiResponse, AuthResponse, User } from '@m3u8-preview/shared';

export const authApi = {
  async register(username: string, password: string) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      username,
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

  /**
   * Refresh access token via httpOnly cookie.
   * IMPORTANT: Uses raw axios (not the `api` instance) to bypass the
   * 401 response interceptor, which would otherwise re-trigger refresh
   * and cause request amplification / rate-limit exhaustion.
   */
  async refresh() {
    const { data } = await axios.post<ApiResponse<{ accessToken: string; user: User }>>(
      '/api/v1/auth/refresh',
      {},
      { withCredentials: true, timeout: 10000 },
    );
    if (!data.success || !data.data) {
      throw new Error('Refresh failed');
    }
    return data.data;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async getMe() {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data!;
  },
};
