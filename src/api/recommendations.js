import { authHeader, apiFetch } from './client';

/** GET /api/recommendations/ai -> { eventId, stockId, stockName, currentPrice, priceChange, changeRate }[]
 * 현재 급등 중인 종목 중 3개를 랜덤으로 선정해 추천합니다.
 */
export async function getAiRecommendations(token) {
  return apiFetch(
    '/api/recommendations/ai',
    { headers: authHeader(token) },
    'AI 추천 종목을 불러오지 못했습니다.',
  );
}
