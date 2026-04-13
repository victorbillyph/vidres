import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import LoadingScreen from './components/LoadingScreen';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';
import { useAuth } from './context/AuthContext';
import AdminPage from './pages/AdminPage';
import ChannelPage from './pages/ChannelPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import CreatorPage from './pages/CreatorPage';
import RegisterPage from './pages/RegisterPage';
import SetupPage from './pages/SetupPage';
import ShortsPage from './pages/ShortsPage';
import UploadPage from './pages/UploadPage';
import WatchPage from './pages/WatchPage';

function RoutedApp() {
  const { loading, setupRequired } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (setupRequired && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  if (!setupRequired && location.pathname === '/setup') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="channel/:channelId" element={<ChannelPage />} />
        <Route path="watch/:videoId" element={<WatchPage />} />
        <Route path="shorts" element={<ShortsPage />} />
        <Route
          path="viewer"
          element={
            <ProtectedRoute>
              <Navigate to="/channel" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="channel"
          element={
            <ProtectedRoute>
              <CreatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Navigate to="/channel" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <RoutedApp />
    </BrowserRouter>
  );
}
