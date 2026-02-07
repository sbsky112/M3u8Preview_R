import api from './api.js';
export const historyApi = {
    async updateProgress(data) {
        await api.post('/history/progress', data);
    },
    async getAll(page = 1, limit = 20) {
        const { data } = await api.get('/history', { params: { page, limit } });
        return data.data;
    },
    async getContinueWatching(limit = 10) {
        const { data } = await api.get('/history/continue', { params: { limit } });
        return data.data;
    },
    async getProgress(mediaId) {
        const { data } = await api.get(`/history/${mediaId}`);
        return data.data ?? null;
    },
    async deleteOne(id) {
        await api.delete(`/history/${id}`);
    },
    async clearAll() {
        await api.delete('/history/clear');
    },
    // keepalive fetch for unload events (sendBeacon doesn't support auth headers)
    sendBeacon(data) {
        const token = localStorage.getItem('accessToken');
        fetch('/api/v1/history/progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
            keepalive: true,
        }).catch(() => { });
    },
    async getProgressMap() {
        const { data } = await api.get('/history/progress-map');
        return data.data;
    },
};
