import { useEffect, useState } from 'react';
import { getDividends } from '../../../api/stocks';
import styles from '../StockDetailPage.module.css';
import tabStyles from './tabs.module.css';

/** 날짜 문자열(YYYY-MM-DD)을 "YYYY.MM.DD"로 표시합니다. */
function formatDate(dateStr) {
  return dateStr.replaceAll('-', '.');
}

/** 주식창 "배당" 탭: 배당수익률/주당배당금/배당성향 통계 + 최근 배당 내역 */
function DividendTab({ stockId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getDividends(token, stockId)
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

  const { dividendYield, dividendPerShare, payoutRatio, history } = data;

  return (
    <>
      <div className={tabStyles.statGrid}>
        <div className={tabStyles.statCard}>
          <p className={tabStyles.statLabel}>배당수익률</p>
          <p className={tabStyles.statValue}>{dividendYield}%</p>
        </div>
        <div className={tabStyles.statCard}>
          <p className={tabStyles.statLabel}>주당배당금</p>
          <p className={tabStyles.statValue}>
            {dividendPerShare.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className={tabStyles.statCard}>
          <p className={tabStyles.statLabel}>배당성향</p>
          <p className={tabStyles.statValue}>{payoutRatio}%</p>
        </div>
      </div>

      <div className={tabStyles.card}>
        <p className={tabStyles.cardTitle}>최근 배당 내역</p>
        <div className={tabStyles.table}>
          <div className={tabStyles.tableHead}>
            <span className={tabStyles.colTime}>지급일</span>
            <span className={tabStyles.colPrice}>주당배당금</span>
            <span className={tabStyles.colQty}>배당수익률</span>
          </div>
          {history.map((row) => (
            <div key={row.paidAt} className={tabStyles.tableRow}>
              <span className={tabStyles.colTime}>{formatDate(row.paidAt)}</span>
              <span className={tabStyles.colPrice}>
                {row.dividendPerShare.toLocaleString('ko-KR')}원
              </span>
              <span className={tabStyles.colQty}>{row.yield}%</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default DividendTab;
