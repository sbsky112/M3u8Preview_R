import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
export function ProtectedRoute({ children, requireAdmin = false }) {
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const location = useLocation();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-emby-bg-base flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emby-green" }) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    if (requireAdmin && user?.role !== 'ADMIN') {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
