import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage/OnboardingPage';
import SignupPage from './pages/SignupPage/SignupPage';
import LoginPage from './pages/LoginPage/LoginPage';
import HomePage from './pages/HomePage/HomePage';
import NewsDetailPage from './pages/NewsDetailPage/NewsDetailPage';
import ReportPage from './pages/ReportPage/ReportPage';
import StockListPage from './pages/StockListPage/StockListPage';
import StockDetailPage from './pages/StockDetailPage/StockDetailPage';
import NewsDetailPage from './pages/NewsDetailPage/NewsDetailPage';
import SettingPage from './pages/SettingPage/SettingPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

import { AuthProvider, useAuth } from './hooks/useAuth';

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/home' : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/news/:newsId" element={<NewsDetailPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/stocks" element={<StockListPage />} />
            <Route path="/stocks/:stockId" element={<StockDetailPage />} />
            <Route path="/news/:newsId" element={<NewsDetailPage />} />
            <Route path="/settings" element={<SettingPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
