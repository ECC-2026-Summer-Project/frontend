import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { loadAuth, saveAuth, clearAuth, subscribeAuth } from '../utils/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);

  // client.js가 401 응답을 받아 Access Token을 자동으로 재발급했을 때도
  // 이 Provider의 상태가 같이 갱신되도록 구독합니다.
  useEffect(() => subscribeAuth(setAuth), []);

  const login = async (userId, password) => {
    const data = await authApi.login(userId, password);
    const nextAuth = {
      userId: data.userId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
    saveAuth(nextAuth);
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
      clearAuth();
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
