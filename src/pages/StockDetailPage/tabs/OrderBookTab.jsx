import { useEffect, useState } from 'react';
import { getOrderBook } from '../../../api/stocks';
import styles from '../StockDetailPage.module.css';
import tabStyles from './tabs.module.css';

/** 주식창 "호가" 탭: 매도/매수 각 5단계 호가 잔량을 막대 그래프로 보여줍니다. */
function OrderBookTab({ stockId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getOrderBook(token, stockId)
      .then((d) => {
        if (!cancelled) setData(d);
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

  if (loading) return <p className={styles.stateText}>불러오는 중...</p>;
  if (error) return <p className={styles.stateText}>{error}</p>;

  const { currentPrice, asks, bids } = data;
  const maxQuantity = Math.max(
    ...asks.map((row) => row.quantity),
    ...bids.map((row) => row.quantity),
  );

  return (
    <div className={tabStyles.card}>
      <p className={tabStyles.cardTitle}>호가 잔량</p>

      {[...asks].reverse().map((row) => (
        <div key={`ask-${row.price}`} className={tabStyles.obRow}>
          <div className={tabStyles.obBarTrack}>
            <div
              className={`${tabStyles.obBarFill} ${tabStyles.obAsk}`}
              style={{ width: `${(row.quantity / maxQuantity) * 100}%` }}
            />
            <p className={`${tabStyles.obPrice} ${styles.down}`}>
              {row.price.toLocaleString('ko-KR')}
            </p>
            <p className={tabStyles.obQty}>매도 {row.quantity}</p>
          </div>
        </div>
      ))}

      <div className={tabStyles.obCurrentRow}>
        {currentPrice.toLocaleString('ko-KR')}원
      </div>

      {bids.map((row) => (
        <div key={`bid-${row.price}`} className={tabStyles.obRow}>
          <div className={tabStyles.obBarTrack}>
            <div
              className={`${tabStyles.obBarFill} ${tabStyles.obBid}`}
              style={{ width: `${(row.quantity / maxQuantity) * 100}%` }}
            />
            <p className={`${tabStyles.obPrice} ${styles.up}`}>
              {row.price.toLocaleString('ko-KR')}
            </p>
            <p className={tabStyles.obQty}>매수 {row.quantity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderBookTab;
