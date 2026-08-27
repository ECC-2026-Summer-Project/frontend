const STORAGE_KEY = 'latestReportId';

/**
 * userId -> 가장 최근에 생성된 reportId 맵을 localStorage에 보관합니다.
 * 레포트는 호출할 때마다 새로 생성되는 API라 화면에서 보여줄 최신 reportId를
 * 어딘가에는 기억해둬야 하는데, 아직 "내 최신 레포트 목록" 조회 API가 없어
 * 프론트에서 생성 직후 받은 reportId를 직접 저장해두는 임시 방식입니다.
 */
export function saveLatestReportId(userId, reportId) {
  if (!userId || !reportId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[userId] = reportId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage 접근 실패는 무시 (다음에 생성될 때 다시 시도됨)
  }
}

/** userId의 최신 reportId를 읽습니다. 생성 이력이 없으면 null. */
export function loadLatestReportId(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map[userId] ?? null;
  } catch {
    return null;
  }
}
