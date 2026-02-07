import api from './api.js';
export const authApi = {
    async register(username, email, password) {
        const { data } = await api.post('/auth/register', {
            username,
            email,
            password,
        });
        return data.data;
    },
    async login(username, password) {
        const { data } = await api.post('/auth/login', {
            username,
            password,
        });
        return data.data;
    },
    async refresh() {
        const { data } = await api.post('/auth/refresh');
        return data.data;
    },
    async logout() {
        await api.post('/auth/logout');
    },
    async getMe() {
        const { data } = await api.get('/auth/me');
        return data.data;
    },
};
