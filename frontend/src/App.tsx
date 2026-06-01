import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TaskModalProvider } from './contexts/TaskModalContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import DailyPage from './pages/DailyPage';
import WeeklyPage from './pages/WeeklyPage';
import MonthlyPage from './pages/MonthlyPage';
import ProfilePage from './pages/ProfilePage';
import FinancePage from './pages/FinancePage';
import SettingsPage from './pages/SettingsPage';
import SupportPage from './pages/SupportPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!user.is_admin) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedGlow = localStorage.getItem('settings-glow');
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-glow', savedGlow === 'false' ? 'off' : 'on');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <TaskModalProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="daily" element={<DailyPage />} />
                <Route path="weekly" element={<WeeklyPage />} />
                <Route path="monthly" element={<MonthlyPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="finance" element={<FinancePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
              </Route>
            </Routes>
          </TaskModalProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
