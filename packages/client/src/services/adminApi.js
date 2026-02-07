import api from './api.js';
export const adminApi = {
    async getDashboard() {
        const { data } = await api.get('/admin/dashboard');
        return data.data;
    },
    async getUsers(page = 1, limit = 20, search) {
        const { data } = await api.get('/admin/users', {
            params: { page, limit, search },
        });
        return data.data;
    },
    async updateUser(id, payload) {
        const { data } = await api.put(`/admin/users/${id}`, payload);
        return data.data;
    },
    async deleteUser(id) {
        await api.delete(`/admin/users/${id}`);
    },
    async getSettings() {
        const { data } = await api.get('/admin/settings');
        return data.data;
    },
    async updateSetting(key, value) {
        await api.put('/admin/settings', { key, value });
    },
};
