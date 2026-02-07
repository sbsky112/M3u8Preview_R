import api from './api.js';
export const mediaApi = {
    async getAll(params) {
        const { data } = await api.get('/media', { params });
        return data.data;
    },
    async getById(id) {
        const { data } = await api.get(`/media/${id}`);
        return data.data;
    },
    async create(payload) {
        const { data } = await api.post('/media', payload);
        return data.data;
    },
    async update(id, payload) {
        const { data } = await api.put(`/media/${id}`, payload);
        return data.data;
    },
    async delete(id) {
        await api.delete(`/media/${id}`);
    },
    async getRecent(count = 10) {
        const { data } = await api.get('/media/recent', { params: { count } });
        return data.data;
    },
    async getRandom(count = 10) {
        const { data } = await api.get('/media/random', { params: { count } });
        return data.data;
    },
    async incrementViews(id) {
        await api.post(`/media/${id}/views`);
    },
};
