import api from './api.js';
export const playlistApi = {
    async getAll() {
        const { data } = await api.get('/playlists');
        return data.data;
    },
    async getById(id) {
        const { data } = await api.get(`/playlists/${id}`);
        return data.data;
    },
    async create(name, description, isPublic) {
        const { data } = await api.post('/playlists', { name, description, isPublic });
        return data.data;
    },
    async update(id, payload) {
        const { data } = await api.put(`/playlists/${id}`, payload);
        return data.data;
    },
    async delete(id) {
        await api.delete(`/playlists/${id}`);
    },
    async addItem(playlistId, mediaId) {
        await api.post(`/playlists/${playlistId}/items`, { mediaId });
    },
    async removeItem(playlistId, mediaId) {
        await api.delete(`/playlists/${playlistId}/items/${mediaId}`);
    },
    async reorder(playlistId, itemIds) {
        await api.put(`/playlists/${playlistId}/reorder`, { itemIds });
    },
};
