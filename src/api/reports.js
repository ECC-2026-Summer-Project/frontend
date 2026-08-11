const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/** GET /api/reports/:reportId -> Report
 * 레포트가 아직 생성되지 않은 경우 error.code === 'REPORT_NOT_GENERATED' (404)
 */
export async function getReport(token, reportId) {
  const response = await fetch(`/api/reports/${reportId}`, {
    headers: authHeader(token),
  });
  const body = await response.json();
  if (!body.success) {
    const error = new Error(body.error?.message || '레포트를 불러오지 못했습니다.');
    error.code = body.error?.code;
    throw error;
  }
  return body.data;
}
