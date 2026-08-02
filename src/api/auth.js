/** POST /api/users/login -> { accessToken, refreshToken, expiresIn, user_id } */
export function login(userId, password) {
  return fetch('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, password }),
  });
}

/** POST /api/users/signup -> { user_id } */
export function signup(userId, password) {
  return fetch('/api/users/signup', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, password }),
  });
}

/** GET /api/users/check-id?userId=xxx -> { available: boolean } */
export function checkUserId(userId) {
  return fetch(`/api/users/check-id?userId=${encodeURIComponent(userId)}`);
}
