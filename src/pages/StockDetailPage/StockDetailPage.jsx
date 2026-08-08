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
import styles from './StockDetailPage.module.css';

// 호가/차트/체결/배당/기업정보 상세 API는 아직 준비되지 않은 탭입니다 (mock/handlers.js 참고).
const TABS = ['요약', '호가', '차트', '체결', '투자자', '배당', '기업정보'];

/** 등락률을 부호가 붙은 퍼센트 문자열로 변환합니다. */
function formatRate(rate) {
  return `${rate >= 0 ? '+' : ''}${rate}%`;
}

/** 시가총액(원)을 "OOO.O조원" 형태로 표시합니다. */
function formatMarketCap(cap) {
  return `${(cap / 1e12).toFixed(1)}조원`;
}

/**
 * 종목별 추세 차트 좌표를 만듭니다.
 * 시세 히스토리 API가 아직 없어 stockId를 시드로 한 결정적 더미 데이터입니다.
 */
function chartPoints(stock) {
  let seed = 0;
  for (const ch of stock.stockId) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const next = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed % 1000) / 1000;
  };
  const trend = stock.changeRate >= 0 ? -1 : 1;
  const steps = 8;
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const progress = i / steps;
    const base = 150 + trend * progress * 90;
    const wiggle = (next() - 0.5) * 30;
    const y = Math.min(190, Math.max(10, base + wiggle));
    points.push(`${(progress * 1000).toFixed(0)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

/**
 * 호가창 5단계를 현재가 기준으로 만듭니다.
 * 실시간 호가 API가 아직 없어 tick 간격만큼 떨어진 더미 값입니다.
 */
function orderBookRows(stock) {
  const tick =
    stock.currentPrice >= 100000
      ? 1000
      : stock.currentPrice >= 10000
        ? 100
        : 10;
  let seed = 0;
  for (const ch of stock.stockId) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const nextVolume = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed % 900) + 100;
  };
  return [
    {
      price: stock.currentPrice + tick * 2,
      label: `매도잔량 ${nextVolume()}`,
      tone: 'down',
    },
    {
      price: stock.currentPrice + tick,
      label: `매도잔량 ${nextVolume()}`,
      tone: 'down',
    },
    { price: stock.currentPrice, label: '현재가', tone: 'text' },
    {
      price: stock.currentPrice - tick,
      label: `매수잔량 ${nextVolume()}`,
      tone: 'up',
    },
    {
      price: stock.currentPrice - tick * 2,
      label: `매수잔량 ${nextVolume()}`,
      tone: 'up',
    },
  ];
}

/**
 * 투자자별 매매동향 추정치를 만듭니다.
 * 투자자별 매매동향 API가 아직 없어 거래량 기반의 추정치입니다.
 */
function investorFlows(stock) {
  const base = stock.volume / 10000; // 만주 단위
  return [
    { label: '외국인', value: Number((base * 0.18).toFixed(1)) },
    { label: '기관', value: Number((-base * 0.07).toFixed(1)) },
    { label: '개인', value: Number((base * 0.09).toFixed(1)) },
  ];
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

          {activeTab === '요약' ? (
            <>
              <div className={styles.chartBox}>
                <svg
                  className={styles.chartSvg}
                  viewBox="0 0 1000 200"
                  preserveAspectRatio="none"
                >
                  <polyline
                    points={chartPoints(stock)}
                    fill="none"
                    stroke={isUp ? 'var(--up)' : 'var(--down)'}
                    strokeWidth="3"
                  />
                </svg>
              </div>

              <div className={styles.priceGrid}>
                <div className={styles.priceList}>
                  <p className={styles.gridTitle}>호가</p>
                  {orderBookRows(stock).map((row) => (
                    <div key={row.label} className={styles.gridRow}>
                      <p
                        className={
                          row.tone === 'up'
                            ? styles.up
                            : row.tone === 'down'
                              ? styles.down
                              : styles.gridStrong
                        }
                      >
                        {row.price.toLocaleString('ko-KR')}
                      </p>
                      <p className={styles.gridMuted}>{row.label}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.priceList}>
                  <p className={styles.gridTitle}>투자자별 매매동향</p>
                  {investorFlows(stock).map((row) => (
                    <div key={row.label} className={styles.gridRow}>
                      <p className={styles.gridStrong}>{row.label}</p>
                      <p className={row.value >= 0 ? styles.up : styles.down}>
                        {row.value >= 0 ? '+' : ''}
                        {row.value.toFixed(1)}만주
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.tabPlaceholder}>
              <p>{activeTab} 탭은 준비 중이에요.</p>
            </div>
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
