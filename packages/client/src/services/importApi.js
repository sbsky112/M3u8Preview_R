import api from './api.js';
export const importApi = {
    async previewText(content) {
        const { data } = await api.post('/import/preview', { content, format: 'TEXT' });
        return data.data;
    },
    async previewFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/import/preview', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.data;
    },
    async execute(items, format, fileName) {
        const { data } = await api.post('/import/execute', { items, format, fileName });
        return data.data;
    },
    getTemplateUrl(format) {
        return `/api/v1/import/template/${format}`;
    },
    async getLogs() {
        const { data } = await api.get('/import/logs');
        return data.data;
    },
};
