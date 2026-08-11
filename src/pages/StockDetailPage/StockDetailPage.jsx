import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import { useAuth } from '../../hooks/useAuth';
import {
  getStocks,
  createOrder,
  addWatchlist,
  removeWatchlist,
} from '../../api/stocks';
import { loadWatchlist, saveWatchlist } from '../../utils/watchlistStorage';
import SummaryTab from './tabs/SummaryTab';
import OrderBookTab from './tabs/OrderBookTab';
import ChartTab from './tabs/ChartTab';
import TradesTab from './tabs/TradesTab';
import DividendTab from './tabs/DividendTab';
import CompanyInfoTab from './tabs/CompanyInfoTab';
import styles from './StockDetailPage.module.css';

const TABS = ['요약', '호가', '차트', '체결', '배당', '기업정보'];

/** 등락률을 부호가 붙은 퍼센트 문자열로 변환합니다. */
function formatRate(rate) {
  return `${rate >= 0 ? '+' : ''}${rate}%`;
}

/** 시가총액(원)을 "OOO.O조원" 형태로 표시합니다. */
function formatMarketCap(cap) {
  return `${(cap / 1e12).toFixed(1)}조원`;
}

function StockDetailPage() {
  const { stockId } = useParams();
  const { user } = useAuth();
  const token = user?.accessToken;

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('요약');
  const [watchlist, setWatchlist] = useState(() => loadWatchlist(user?.userId));

  const [orderSide, setOrderSide] = useState(null); // null | 'BUY' | 'SELL'
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    // 단일 종목 조회 API가 없어 목록에서 stockId로 찾습니다.
    getStocks(token, {})
      .then((body) => {
        if (cancelled) return;
        const found = body.data.find((s) => s.stockId === stockId);
        setError(found ? '' : '존재하지 않는 종목이에요.');
        setStock(found || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, stockId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const isWatched = stock ? watchlist.has(stock.stockId) : false;

  const toggleWatch = async () => {
    if (!token || !stock) return;
    try {
      if (isWatched) await removeWatchlist(token, stock.stockId);
      else await addWatchlist(token, stock.stockId);
      const next = new Set(watchlist);
      isWatched ? next.delete(stock.stockId) : next.add(stock.stockId);
      setWatchlist(next);
      saveWatchlist(user?.userId, next);
    } catch (err) {
      setOrderError(err.message);
    }
  };

  const openOrder = (side) => {
    setOrderSide(side);
    setQuantity(1);
    setOrderError('');
  };

  const closeOrder = () => {
    setOrderSide(null);
    setOrderError('');
  };

  const submitOrder = async () => {
    if (!stock || !token || !orderSide) return;
    setSubmitting(true);
    setOrderError('');
    try {
      const order = await createOrder(token, {
        stockId: stock.stockId,
        side: orderSide,
        orderType: 'MARKET',
        quantity: Number(quantity),
      });
      setToast({
        side: orderSide,
        quantity: order.quantity,
        total: order.totalAmount,
        stockName: stock.name,
      });
      setOrderSide(null);
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.stateText}>불러오는 중...</p>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.stateText}>{error || '종목을 찾을 수 없어요.'}</p>
      </div>
    );
  }

  const isUp = stock.changeRate >= 0;
  const total = Number(quantity || 0) * stock.currentPrice;

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.stockBody}>
        <section className={styles.stockMain}>
          <div className={styles.titleRow}>
            <div className={styles.titleInfo}>
              <p className={styles.stockMeta}>
                {stock.name} · {stock.stockId}
              </p>
              <p className={styles.stockPrice}>
                {stock.currentPrice.toLocaleString('ko-KR')}원
              </p>
              <p
                className={`${styles.stockChange} ${isUp ? styles.up : styles.down}`}
              >
                {isUp ? '▲' : '▼'} {isUp ? '+' : ''}
                {stock.changeAmount.toLocaleString('ko-KR')}원 (
                {formatRate(stock.changeRate)})
              </p>
            </div>
            <button
              type="button"
              className={styles.starBtn}
              onClick={toggleWatch}
              aria-label={isWatched ? '관심 종목에서 제거' : '관심 종목에 추가'}
            >
              {isWatched ? '★' : '☆'}
            </button>
          </div>

          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === '요약' && <SummaryTab stock={stock} />}
          {activeTab === '호가' && (
            <OrderBookTab stockId={stock.stockId} token={token} />
          )}
          {activeTab === '차트' && (
            <ChartTab stockId={stock.stockId} token={token} isUp={isUp} />
          )}
          {activeTab === '체결' && (
            <TradesTab stockId={stock.stockId} token={token} />
          )}
          {activeTab === '배당' && (
            <DividendTab stockId={stock.stockId} token={token} />
          )}
          {activeTab === '기업정보' && (
            <CompanyInfoTab stockId={stock.stockId} token={token} />
          )}
        </section>

        <aside className={styles.stockSide}>
          <div className={styles.aiBadge}>
            <span>🤖 AI 추천 종목</span>
            <span className={styles.aiStars}>★★☆☆☆</span>
          </div>

          <div className={styles.buysell}>
            <button
              type="button"
              className={styles.buyBtn}
              onClick={() => openOrder('BUY')}
            >
              매수
            </button>
            <button
              type="button"
              className={styles.sellBtn}
              onClick={() => openOrder('SELL')}
            >
              매도
            </button>
          </div>

          <p className={styles.sideTitle}>기업 정보</p>
          <div className={styles.infoList}>
            <div className={styles.gridRow}>
              <p className={styles.gridMuted}>시가총액</p>
              <p className={styles.gridStrong}>
                {formatMarketCap(stock.marketCap)}
              </p>
            </div>
            <div className={styles.gridRow}>
              <p className={styles.gridMuted}>PER</p>
              <p className={styles.gridStrong}>-</p>
            </div>
            <div className={styles.gridRow}>
              <p className={styles.gridMuted}>배당수익률</p>
              <p className={styles.gridStrong}>-</p>
            </div>
          </div>
        </aside>
      </div>

      {orderSide && (
        <div className={styles.modalOverlay} onClick={closeOrder}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <p>{orderSide === 'BUY' ? '매수 주문' : '매도 주문'}</p>
              <button type="button" onClick={closeOrder} aria-label="닫기">
                ✕
              </button>
            </div>

            <div className={styles.sideToggle}>
              <button
                type="button"
                className={orderSide === 'BUY' ? styles.sideActive : ''}
                onClick={() => setOrderSide('BUY')}
              >
                매수
              </button>
              <button
                type="button"
                className={orderSide === 'SELL' ? styles.sideActive : ''}
                onClick={() => setOrderSide('SELL')}
              >
                매도
              </button>
            </div>

            <div className={styles.modalRows}>
              <div className={styles.modalRow}>
                <span>종목명</span>
                <span>
                  {stock.name} ({stock.stockId})
                </span>
              </div>
              <div className={styles.modalRow}>
                <span>현재가</span>
                <span>{stock.currentPrice.toLocaleString('ko-KR')}원</span>
              </div>
              <div className={styles.modalRow}>
                <span>주문 수량</span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={styles.qtyInput}
                />
              </div>
              <div className={styles.modalRow}>
                <span>주문 방식</span>
                <span>시장가</span>
              </div>
            </div>

            <div className={styles.modalTotal}>
              <span>총 주문 금액</span>
              <strong>{total.toLocaleString('ko-KR')}원</strong>
            </div>

            <p className={styles.modalWarn}>
              {orderSide === 'BUY'
                ? '🔥 뉴스나 분위기만 보고 매수하는 건 아닌지 한 번 더 확인해보세요.'
                : '📉 일시적인 조정일 수도 있으니, 매도 전에 조금 더 지켜봐도 괜찮아요.'}
            </p>

            {orderError && <p className={styles.modalError}>{orderError}</p>}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={closeOrder}
              >
                취소
              </button>
              <button
                type="button"
                className={
                  orderSide === 'BUY' ? styles.confirmBuy : styles.confirmSell
                }
                onClick={submitOrder}
                disabled={submitting || !quantity || Number(quantity) <= 0}
              >
                {submitting
                  ? '처리 중...'
                  : `${orderSide === 'BUY' ? '매수' : '매도'} 확정`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={styles.toast}>
          <span className={styles.toastDot} />
          <div>
            <p className={styles.toastTitle}>
              {toast.side === 'BUY' ? '매수가' : '매도가'} 완료되었습니다
            </p>
            <p className={styles.toastSubtitle}>
              {toast.stockName} · {toast.quantity}주 ·{' '}
              {toast.total.toLocaleString('ko-KR')}원
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockDetailPage;
