import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore.js';
export function useAuth() {
    const store = useAuthStore();
    useEffect(() => {
        store.checkAuth();
    }, []);
    return store;
}
