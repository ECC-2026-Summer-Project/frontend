import { authHeader, apiFetch } from './client';

/** GET /api/stocks -> { data: Stock[], total, page, pageSize }
 * params: { keyword, sector, sort: 'price'|'changeRate'|'volume', order: 'asc'|'desc', page, size }
 */
export async function getStocks(token, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  return apiFetch(
    `/api/stocks${query ? `?${query}` : ''}`,
    { headers: authHeader(token) },
    '종목 목록을 불러오지 못했습니다.',
  );
}

/** GET /api/stocks/surging -> { eventId, stockId, stockName, currentPrice, priceChange, changeRate }[] */
export async function getSurgingStocks(token) {
  return apiFetch(
    '/api/stocks/surging',
    { headers: authHeader(token) },
    '급등 종목 목록을 불러오지 못했습니다.',
  );
}

/** POST /api/orders -> Order
 * order: { stockId, side: 'BUY'|'SELL', orderType: 'MARKET'|'LIMIT', quantity, price }
 */
export async function createOrder(token, order) {
  return apiFetch(
    '/api/orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(order),
    },
    '주문에 실패했습니다.',
  );
}

/** GET /api/watchlist -> { stockId, name, addedAt }[] */
export async function getWatchlist(token) {
  return apiFetch(
    '/api/watchlist',
    { headers: authHeader(token) },
    '관심 종목 목록을 불러오지 못했습니다.',
  );
}

/** POST /api/watchlist/:stockId -> { stockId, name, addedAt } */
export async function addWatchlist(token, stockId) {
  return apiFetch(
    `/api/watchlist/${stockId}`,
    { method: 'POST', headers: authHeader(token) },
    '관심 종목 추가에 실패했습니다.',
  );
}

/** DELETE /api/watchlist/:stockId -> { stockId } */
export async function removeWatchlist(token, stockId) {
  return apiFetch(
    `/api/watchlist/${stockId}`,
    { method: 'DELETE', headers: authHeader(token) },
    '관심 종목 삭제에 실패했습니다.',
  );
}

/** GET /api/stocks/:stockId/summary -> { stockId, name, market, currentPrice, changeRate, changeAmount, openPrice, highPrice, lowPrice, volume, isAiRecommended } */
export async function getStockSummary(token, stockId) {
  return apiFetch(
    `/api/stocks/${stockId}/summary`,
    { headers: authHeader(token) },
    '종목 요약 정보를 불러오지 못했습니다.',
  );
}

/** GET /api/stocks/:stockId/orderbook -> { currentPrice, asks, bids } */
export async function getOrderBook(token, stockId) {
  return apiFetch(
    `/api/stocks/${stockId}/orderbook`,
    { headers: authHeader(token) },
    '호가 정보를 불러오지 못했습니다.',
  );
}

/** GET /api/stocks/:stockId/chart -> { time, open, high, low, close, volume }[]
 * (interval/range로 감싸지 않고 캔들 배열을 data로 바로 내려줍니다)
 * params: { interval: '1m'|'5m'|'1d', range: '1d'|'1w'|'1m' } (백엔드가 요구하는 코드값, 화면 라벨이 아님)
 */
export async function getChartPrices(token, stockId, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  return apiFetch(
    `/api/stocks/${stockId}/chart${query ? `?${query}` : ''}`,
    { headers: authHeader(token) },
    '차트 정보를 불러오지 못했습니다.',
  );
}

/** GET /api/stocks/:stockId/trades -> { time, price, quantity, side }[]
 * (trades로 감싸지 않고 체결 내역 배열을 data로 바로 내려줍니다)
 */
export async function getTrades(token, stockId) {
  return apiFetch(
    `/api/stocks/${stockId}/trades`,
    { headers: authHeader(token) },
    '체결 내역을 불러오지 못했습니다.',
  );
}

/** GET /api/stocks/:stockId/dividends -> { year, amountPerShare, yieldRate }[]
 * (요약 객체가 아니라 연도별 배당 내역 배열을 data로 바로 내려줍니다)
 */
export async function getDividends(token, stockId) {
  return apiFetch(
    `/api/stocks/${stockId}/dividends`,
    { headers: authHeader(token) },
    '배당 정보를 불러오지 못했습니다.',
  );
}

/** GET /api/stocks/:stockId/info -> { stockId, name, description, industry, marketCap, per, dividendYield, listedDate, ceo, employees } */
export async function getCompanyInfo(token, stockId) {
  return apiFetch(
    `/api/stocks/${stockId}/info`,
    { headers: authHeader(token) },
    '기업 정보를 불러오지 못했습니다.',
  );
}
