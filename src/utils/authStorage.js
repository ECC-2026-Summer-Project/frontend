const STORAGE_KEY = 'auth';
const listeners = new Set();

/**
 * 로그인 정보(userId/accessToken/refreshToken)를 localStorage에서 읽고 씁니다.
 * useAuth(React 상태)와 client.js(401 자동 재발급)가 이 파일을 함께 참조해
 * 토큰이 어디서 갱신되든 같은 값을 보게 됩니다.
 */
export function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  listeners.forEach((listener) => listener(auth));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener(null));
}

/** accessToken만 갈아 끼웁니다. (401 응답 시 자동 재발급용) */
export function updateAccessToken(accessToken) {
  const current = loadAuth();
  if (!current) return;
  saveAuth({ ...current, accessToken });
}

/** auth 정보가 바뀔 때(로그인/로그아웃/자동 재발급) 알림을 받습니다. */
export function subscribeAuth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SESSION_EXPIRED_KEY = 'sessionExpired';

/** Refresh Token까지 만료/무효라 강제 로그아웃됐음을 표시합니다. (로그인 페이지의 안내 문구용) */
export function markSessionExpired() {
  sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
}

/** 세션 만료 표시를 읽고 지웁니다. 한 번 보여주면 다시 뜨지 않도록 소비합니다. */
export function consumeSessionExpired() {
  const expired = sessionStorage.getItem(SESSION_EXPIRED_KEY) === '1';
  sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  return expired;
}
