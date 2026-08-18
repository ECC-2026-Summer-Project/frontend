import { authHeader, apiFetch } from './client';

/** POST /api/users/login -> { userId, accessToken, refreshToken } */
export async function login(userId, password) {
  return apiFetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }),
  });
}

/** POST /api/users/signup -> { userId } */
export async function signup(userId, password) {
  return apiFetch(
    '/api/users/signup',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    },
    '회원가입에 실패했습니다.',
  );
}

/** PATCH /api/users/password?userId=xxx -> { passwordChangedAt } */
export async function changePassword(token, userId, currentPassword, newPassword) {
  return apiFetch(
    `/api/users/password?userId=${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(token),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    },
    '비밀번호 변경에 실패했습니다.',
  );
}

/** POST /api/users/logout?userId=xxx -> { loggedOut: true } */
export async function logout(token, userId) {
  return apiFetch(
    `/api/users/logout?userId=${encodeURIComponent(userId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(token),
      },
    },
    '로그아웃에 실패했습니다.',
  );
}

/** GET /api/users/check-id?userId=xxx -> { available: boolean } */
export async function checkUserId(userId) {
  return apiFetch(
    `/api/users/check-id?userId=${encodeURIComponent(userId)}`,
    {},
    '아이디 확인에 실패했습니다.',
  );
}

/** DELETE /api/users/me?userId=xxx -> { deleted: true } */
export async function deleteAccount(token, userId, password) {
  return apiFetch(
    `/api/users/me?userId=${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(token),
      },
      body: JSON.stringify({ password }),
    },
    '회원 탈퇴에 실패했습니다.',
  );
}
