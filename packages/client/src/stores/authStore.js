import { create } from 'zustand';
import { authApi } from '../services/authApi.js';
export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async (username, password) => {
        const result = await authApi.login(username, password);
        localStorage.setItem('accessToken', result.accessToken);
        set({ user: result.user, isAuthenticated: true });
    },
    register: async (username, email, password) => {
        const result = await authApi.register(username, email, password);
        localStorage.setItem('accessToken', result.accessToken);
        set({ user: result.user, isAuthenticated: true });
    },
    logout: async () => {
        try {
            await authApi.logout();
        }
        catch {
            // Ignore errors on logout
        }
        localStorage.removeItem('accessToken');
        set({ user: null, isAuthenticated: false });
    },
    checkAuth: async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                set({ isLoading: false });
                return;
            }
            const user = await authApi.getMe();
            set({ user, isAuthenticated: true, isLoading: false });
        }
        catch {
            localStorage.removeItem('accessToken');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
    setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
