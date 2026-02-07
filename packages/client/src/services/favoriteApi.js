import api from './api.js';
export const favoriteApi = {
    async toggle(mediaId) {
        const { data } = await api.post(`/favorites/${mediaId}`);
        return data.data;
    },
    async check(mediaId) {
        const { data } = await api.get(`/favorites/${mediaId}/check`);
        return data.data;
    },
    async getAll(page = 1, limit = 20) {
        const { data } = await api.get('/favorites', { params: { page, limit } });
        return data.data;
    },
};
