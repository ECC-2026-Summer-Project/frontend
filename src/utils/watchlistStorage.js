const KEY_PREFIX = 'watchlist_';

/**
 * 관심 종목 목록을 조회하는 API가 아직 없어(추가/삭제만 존재),
 * 사용자별로 localStorage에 관심 종목 id 목록을 보관합니다.
 */
export function loadWatchlist(userId) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + (userId || 'guest'));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveWatchlist(userId, set) {
  localStorage.setItem(KEY_PREFIX + (userId || 'guest'), JSON.stringify([...set]));
}
