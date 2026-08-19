import { authHeader, apiFetch } from './client';

/** GET /api/accounts/me/summary -> { cashBalance, stockEvaluationAmount, totalAssetAmount, totalProfitLoss, totalReturnRate } */
export async function getAccountSummary(token) {
  return apiFetch(
    '/api/accounts/me/summary',
    { headers: authHeader(token) },
    '자산 요약 정보를 불러오지 못했습니다.',
  );
}

/** GET /api/portfolio/holdings -> { totalPurchaseAmount, totalEvaluationAmount, totalProfitLoss, totalReturnRate, holdings: Holding[] }
 * Holding: { stockId, stockName, quantity, averagePurchasePrice, currentPrice, priceChange, changeRate, purchaseAmount, evaluationAmount, profitLoss, returnRate }
 */
export async function getPortfolioHoldings(token) {
  return apiFetch(
    '/api/portfolio/holdings',
    { headers: authHeader(token) },
    '보유 종목 정보를 불러오지 못했습니다.',
  );
}
