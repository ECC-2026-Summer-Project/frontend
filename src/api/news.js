import { authHeader, apiFetch } from './client';

/** GET /api/news?excludeNewsIds=1,2,3 -> { newsId, title }[]
 * 90초마다 재호출하여 최신 뉴스를 갱신합니다. excludeNewsIds는 직전에 노출된 뉴스 ID 목록입니다.
 */
export async function getNews(token, excludeNewsIds = []) {
  const query = excludeNewsIds.length
    ? `?excludeNewsIds=${excludeNewsIds.join(',')}`
    : '';
  return apiFetch(
    `/api/news${query}`,
    { headers: authHeader(token) },
    '뉴스 목록을 불러오지 못했습니다.',
  );
}

/** GET /api/news/:newsId -> { newsId, title, content, publishedAt } */
export async function getNewsDetail(token, newsId) {
  return apiFetch(
    `/api/news/${newsId}`,
    { headers: authHeader(token) },
    '뉴스를 불러오지 못했습니다.',
  );
}

/** POST /api/news/:newsId/views -> null
 * 사용자가 뉴스 상세 화면에 머문 시간을 기록합니다. (매수·매도 반응 점수 산정에 활용)
 * 404 시 error.code === 'NEWS_NOT_FOUND', 400 시 error.code === 'NEWS_VIEW_NOT_STARTED'
 */
export async function recordNewsView(token, newsId, durationSeconds) {
  return apiFetch(
    `/api/news/${newsId}/views`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ durationSeconds }),
    },
    '뉴스 열람 기록에 실패했습니다.',
  );
}
