import { authHeader, apiFetch } from './client';

/** POST /api/reports -> { reportId, createdAt }
 * UserActionLog와 TradeHistory를 집계해 투자 심리 리포트를 생성합니다. (필수 이벤트가 모두 완료된 뒤 호출)
 * 호출할 때마다 새 레포트가 생성/저장되는 API라 조회 목적으로 반복 호출하면 안 됩니다.
 */
export async function createReport(token) {
  return apiFetch(
    '/api/reports',
    { method: 'POST', headers: authHeader(token) },
    '레포트 생성에 실패했습니다.',
  );
}

/** GET /api/reports/:reportId -> Report
 * 404 시 error.code === 'REPORT_NOT_GENERATED'
 */
export async function getReport(token, reportId) {
  return apiFetch(
    `/api/reports/${reportId}`,
    { headers: authHeader(token) },
    '레포트를 불러오지 못했습니다.',
  );
}
