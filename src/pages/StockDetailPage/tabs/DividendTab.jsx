import { useEffect, useState } from 'react';
import { getDividends } from '../../../api/stocks';
import styles from '../StockDetailPage.module.css';
import tabStyles from './tabs.module.css';

/** 주식창 "배당" 탭: 최신 연도 배당수익률/주당배당금 통계 + 연도별 배당 내역 */
function DividendTab({ stockId, token }) {
  // 백엔드가 { dividendYield, ... } 요약 객체가 아니라
  // 연도별 배당 내역 배열({ year, amountPerShare, yieldRate }[])을 그대로 내려줍니다.
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getDividends(token, stockId)
      .then((d) => {
        if (!cancelled) setHistory(d);
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
  if (!history || history.length === 0) {
    return <p className={styles.stateText}>배당 내역이 없어요.</p>;
  }

  const sorted = [...history].sort((a, b) => b.year - a.year);
  const latest = sorted[0];

  return (
    <>
      <div className={tabStyles.statGrid}>
        <div className={tabStyles.statCard}>
          <p className={tabStyles.statLabel}>배당수익률</p>
          <p className={tabStyles.statValue}>{latest.yieldRate}%</p>
        </div>
        <div className={tabStyles.statCard}>
          <p className={tabStyles.statLabel}>주당배당금</p>
          <p className={tabStyles.statValue}>
            {latest.amountPerShare.toLocaleString('ko-KR')}원
          </p>
        </div>
      </div>

      <div className={tabStyles.card}>
        <p className={tabStyles.cardTitle}>연도별 배당 내역</p>
        <div className={tabStyles.table}>
          <div className={tabStyles.tableHead}>
            <span className={tabStyles.colTime}>연도</span>
            <span className={tabStyles.colPrice}>주당배당금</span>
            <span className={tabStyles.colQty}>배당수익률</span>
          </div>
          {sorted.map((row) => (
            <div key={row.year} className={tabStyles.tableRow}>
              <span className={tabStyles.colTime}>{row.year}년</span>
              <span className={tabStyles.colPrice}>
                {row.amountPerShare.toLocaleString('ko-KR')}원
              </span>
              <span className={tabStyles.colQty}>{row.yieldRate}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default DividendTab;
