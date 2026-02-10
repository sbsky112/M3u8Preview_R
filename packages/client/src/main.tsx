import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary.js';
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
import { PlaybackPage } from './pages/PlaybackPage.js';
import { ChangePasswordPage } from './pages/ChangePasswordPage.js';
import { ArtistDetailPage } from './pages/ArtistDetailPage.js';
import { ArtistsPage } from './pages/ArtistsPage.js';
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
    return (
      <div className="min-h-screen bg-emby-bg-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emby-green"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/play/:id" element={<ProtectedRoute><PlaybackPage /></ProtectedRoute>} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/media/:id" element={<MediaDetailPage />} />
        {/* Placeholder routes for future pages */}
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/artists" element={<ArtistsPage />} />
        <Route path="/artist/:name" element={<ArtistDetailPage />} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/media" element={<ProtectedRoute requireAdmin><AdminMediaPage /></ProtectedRoute>} />
        <Route path="/import" element={<ProtectedRoute requireAdmin><ImportPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
