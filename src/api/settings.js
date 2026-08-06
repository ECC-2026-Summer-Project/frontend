const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/** PATCH /api/users/me/password -> { passwordChangedAt } */
export async function changePassword(token, currentPassword, newPassword) {
  const response = await fetch('/api/users/me/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '비밀번호 변경에 실패했습니다.');
  }
  return body.data;
}

/** DELETE /api/users/me -> { deleted: boolean } */
export async function deleteAccount(token, password) {
  const response = await fetch('/api/users/me', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ password }),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '회원 탈퇴에 실패했습니다.');
  }
  return body.data;
}
