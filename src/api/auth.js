/** POST /api/users/login -> { accessToken, refreshToken, expiresIn, user_id } */
export async function login(userId, password) {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, password }),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '로그인에 실패했습니다.');
  }
  return body.data;
}

/** POST /api/users/signup -> { user_id } */
export async function signup(userId, password) {
  const response = await fetch('/api/users/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, password }),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '회원가입에 실패했습니다.');
  }
  return body.data;
}

/** GET /api/users/check-id?userId=xxx -> { available: boolean } */
export async function checkUserId(userId) {
  const response = await fetch(
    `/api/users/check-id?userId=${encodeURIComponent(userId)}`,
  );
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '아이디 확인에 실패했습니다.');
  }
  return body.data;
}
