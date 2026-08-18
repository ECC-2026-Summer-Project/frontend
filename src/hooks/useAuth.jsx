import { createContext, useContext, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

const STORAGE_KEY = 'auth';

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth);

  const login = async (userId, password) => {
    const data = await authApi.login(userId, password);
    const nextAuth = {
      userId: data.userId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    setAuth(nextAuth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    return nextAuth;
  };

  const logout = async () => {
    try {
      if (auth?.accessToken) {
        await authApi.logout(auth.accessToken, auth.userId);
      }
    } catch {
      // 서버 측 토큰 무효화가 실패해도 클라이언트 로그아웃은 계속 진행
    } finally {
      setAuth(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = {
    user: auth,
    isAuthenticated: !!auth,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth는 <AuthProvider> 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
