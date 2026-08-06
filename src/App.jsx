import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage/OnboardingPage';
import SignupPage from './pages/SignupPage/SignupPage';
import LoginPage from './pages/LoginPage/LoginPage';
import HomePage from './pages/HomePage/HomePage';
import StockListPage from './pages/StockListPage/StockListPage';
import StockDetailPage from './pages/StockDetailPage/StockDetailPage';

import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/signup" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/stocks" element={<StockListPage />} />
          <Route path="/stocks/:stockId" element={<StockDetailPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
