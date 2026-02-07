import api from './api.js';
export const categoryApi = {
    async getAll() {
        const { data } = await api.get('/categories');
        return data.data;
    },
    async getById(id) {
        const { data } = await api.get(`/categories/${id}`);
        return data.data;
    },
};
