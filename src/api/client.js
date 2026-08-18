import {
  loadAuth,
  updateAccessToken,
  clearAuth,
  markSessionExpired,
} from '../utils/authStorage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const REFRESH_PATH = '/api/users/refresh';

// 여러 요청이 동시에 401을 받아도 재발급은 한 번만 수행하고 결과를 나눠 씁니다.
let refreshPromise = null;

/** Refresh Token으로 새 Access Token을 발급받아 저장소에 반영합니다. */
function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const auth = loadAuth();
      if (!auth?.refreshToken) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });

      let body;
      try {
        body = await response.json();
      } catch {
        throw new Error('Access Token 갱신에 실패했습니다.');
      }

      if (!body.success) {
        markSessionExpired(); // 로그인 페이지에서 안내 문구를 보여주기 위한 표시
        clearAuth(); // Refresh Token도 만료/무효 -> 다시 로그인해야 함
        throw new Error(
          (typeof body.error === 'string' ? body.error : body.error?.message) ||
            'Access Token 갱신에 실패했습니다.',
        );
      }

      updateAccessToken(body.data.accessToken);
      return body.data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiFetch(
  path,
  options = {},
  fallbackMessage = '요청에 실패했습니다.',
  _retried = false,
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include', // cross-origin 요청에도 세션 쿠키(JSESSIONID) 포함
    ...options,
  }); //주소 합치기

  // Access Token 만료(401) -> Refresh Token으로 재발급 후 원래 요청 한 번만 재시도
  const hasAuthHeader = Boolean(options.headers?.Authorization);
  if (
    response.status === 401 &&
    hasAuthHeader &&
    !_retried &&
    path !== REFRESH_PATH
  ) {
    const newAccessToken = await refreshAccessToken();
    return apiFetch(
      path,
      {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newAccessToken}` },
      },
      fallbackMessage,
      true,
    );
  }

  let body;
  try {
    body = await response.json(); //json으로 파싱하기
  } catch {
    // 서버가 JSON이 아닌 응답(예: 401 시 text/plain "Invalid Token")을 줄 때
    // 파싱 에러가 그대로 노출되지 않도록 안전하게 처리
    throw new Error(fallbackMessage);
  }

  if (!body.success) {
    //성공 여부 확인하기
    const error = new Error(
      (typeof body.error === 'string' ? body.error : body.error?.message) ||
        fallbackMessage,
    );
    error.code = body.error?.code;
    throw error;
  }

  return body.data; //데이터 뽑아서 반환하기
}
