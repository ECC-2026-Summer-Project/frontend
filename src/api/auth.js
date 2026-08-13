import { authHeader, apiFetch } from './client';

/** POST /api/users/login -> { userId, accessToken, refreshToken } */
export async function login(userId, password) {
  return apiFetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }),
  });
}

// TODO: signup 자체 스펙은 아직 미확인. login 스펙 기준으로는 camelCase(userId)가
// 확인됐고 checkUserId()도 이미 camelCase를 쓰고 있어 컨벤션이 섞여 있으니,
// signup 스펙 확인되는 대로 { user_id } -> { userId }로 맞출 것.
/** POST /api/users/signup -> { user_id } */
export async function signup(userId, password) {
  return apiFetch(
    '/api/users/signup',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, password }),
    },
    '회원가입에 실패했습니다.',
  );
}

/** PATCH /api/users/me/password -> { passwordChangedAt } */
export async function changePassword(token, currentPassword, newPassword) {
  return apiFetch(
    '/api/users/me/password',
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

/** GET /api/users/check-id?userId=xxx -> { available: boolean } */
export async function checkUserId(userId) {
  return apiFetch(
    `/api/users/check-id?userId=${encodeURIComponent(userId)}`,
    {},
    '아이디 확인에 실패했습니다.',
  );
}

/** DELETE /api/users/me -> { deleted: true } */
export async function deleteAccount(token, password) {
  return apiFetch(
    '/api/users/me',
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
