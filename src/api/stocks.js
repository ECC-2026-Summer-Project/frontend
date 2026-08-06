const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/** GET /api/stocks -> { data: Stock[], total, page, pageSize }
 * params: { keyword, sector, sort: 'price'|'changeRate'|'volume', order: 'asc'|'desc', page, size }
 */
export async function getStocks(token, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
  ).toString();
  const response = await fetch(`/api/stocks${query ? `?${query}` : ''}`, {
    headers: authHeader(token),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '종목 목록을 불러오지 못했습니다.');
  }
  return body;
}

/** POST /api/orders -> Order
 * order: { stockId, side: 'BUY'|'SELL', orderType: 'MARKET'|'LIMIT', quantity, price }
 */
export async function createOrder(token, order) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(order),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '주문에 실패했습니다.');
  }
  return body.data;
}

/** POST /api/watchlist/:stockId -> { stockId, name, addedAt } */
export async function addWatchlist(token, stockId) {
  const response = await fetch(`/api/watchlist/${stockId}`, {
    method: 'POST',
    headers: authHeader(token),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '관심 종목 추가에 실패했습니다.');
  }
  return body.data;
}

/** DELETE /api/watchlist/:stockId -> { stockId } */
export async function removeWatchlist(token, stockId) {
  const response = await fetch(`/api/watchlist/${stockId}`, {
    method: 'DELETE',
    headers: authHeader(token),
  });
  const body = await response.json();
  if (!body.success) {
    throw new Error(body.error?.message || '관심 종목 삭제에 실패했습니다.');
  }
  return body.data;
}
