import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { HomePage } from './pages/HomePage.js';
import { LibraryPage } from './pages/LibraryPage.js';
import { MediaDetailPage } from './pages/MediaDetailPage.js';
import { FavoritesPage } from './pages/FavoritesPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { PlaylistsPage } from './pages/PlaylistsPage.js';
import { PlaylistDetailPage } from './pages/PlaylistDetailPage.js';
import { ImportPage } from './pages/ImportPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { AdminUsersPage } from './pages/AdminUsersPage.js';
import { AdminMediaPage } from './pages/AdminMediaPage.js';
import './index.css';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
function AppRoutes() {
    const { isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen bg-emby-bg-base flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emby-green" }) }));
    }
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsxs(Route, { element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, {}) }), children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/library", element: _jsx(LibraryPage, {}) }), _jsx(Route, { path: "/media/:id", element: _jsx(MediaDetailPage, {}) }), _jsx(Route, { path: "/favorites", element: _jsx(FavoritesPage, {}) }), _jsx(Route, { path: "/playlists", element: _jsx(PlaylistsPage, {}) }), _jsx(Route, { path: "/playlists/:id", element: _jsx(PlaylistDetailPage, {}) }), _jsx(Route, { path: "/history", element: _jsx(HistoryPage, {}) }), _jsx(Route, { path: "/admin", element: _jsx(AdminDashboardPage, {}) }), _jsx(Route, { path: "/admin/users", element: _jsx(AdminUsersPage, {}) }), _jsx(Route, { path: "/admin/media", element: _jsx(AdminMediaPage, {}) }), _jsx(Route, { path: "/import", element: _jsx(ImportPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsx(AppRoutes, {}) }) }));
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
