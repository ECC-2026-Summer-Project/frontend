import { useEffect, useState } from 'react';
import { getTrades } from '../../../api/stocks';
import styles from '../StockDetailPage.module.css';
import tabStyles from './tabs.module.css';

/** 주식창 "체결" 탭: 최근 체결 내역(시간/체결가/체결량/구분) 테이블 */
function TradesTab({ stockId, token }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getTrades(token, stockId)
      // 백엔드는 { trades: [...] }가 아니라 체결 내역 배열을 data로 그대로 내려줍니다.
      .then((d) => {
        if (!cancelled) setTrades(d);
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
  if (!trades || trades.length === 0) {
    return <p className={styles.stateText}>체결 내역이 없어요.</p>;
  }

  return (
    <div className={tabStyles.card}>
      <p className={tabStyles.cardTitle}>체결 내역</p>
      <div className={tabStyles.table}>
        <div className={tabStyles.tableHead}>
          <span className={tabStyles.colTime}>시간</span>
          <span className={tabStyles.colPrice}>체결가</span>
          <span className={tabStyles.colQty}>체결량</span>
          <span className={tabStyles.colSide}>구분</span>
        </div>
        {trades.map((trade) => (
          <div
            key={`${trade.time}-${trade.price}-${trade.quantity}`}
            className={tabStyles.tableRow}
          >
            <span className={tabStyles.colTime}>{trade.time}</span>
            <span className={tabStyles.colPrice}>
              {trade.price.toLocaleString('ko-KR')}
            </span>
            <span className={tabStyles.colQty}>{trade.quantity}</span>
            <span className={tabStyles.colSide}>
              <span
                className={`${tabStyles.sideTag} ${trade.side === 'BUY' ? tabStyles.sideTagBuy : tabStyles.sideTagSell}`}
              >
                {trade.side === 'BUY' ? '매수' : '매도'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TradesTab;
