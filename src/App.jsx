import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignupPage from './pages/SignupPage/SignupPage';
import LoginPage from './pages/LoginPage/LoginPage';
import HomePage from './pages/HomePage/HomePage';
import SettingPage from './pages/SettingPage/SettingPage';
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/settings" element={<SettingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
