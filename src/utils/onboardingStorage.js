const KEY_PREFIX = 'onboarding_seen_';

/**
 * 온보딩을 이미 본 적이 있는지
 * 사용자별로 localStorage에 온보딩 완료 여부를 보관
 */
export function hasSeenOnboarding(userId) {
  return localStorage.getItem(KEY_PREFIX + (userId || 'guest')) === 'true';
}

export function markOnboardingSeen(userId) {
  localStorage.setItem(KEY_PREFIX + (userId || 'guest'), 'true');
}

export function clearOnboardingSeen(userId) {
  localStorage.removeItem(KEY_PREFIX + (userId || 'guest'));
}
