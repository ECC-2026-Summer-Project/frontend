import { useEffect, useState } from 'react';
import { getCompanyInfo } from '../../../api/stocks';
import styles from '../StockDetailPage.module.css';
import tabStyles from './tabs.module.css';

/** 날짜 문자열(YYYY-MM-DD)을 "YYYY.MM.DD"로 표시합니다. ('-'는 그대로 둠) */
function formatDate(dateStr) {
  return dateStr === '-' ? dateStr : dateStr.replaceAll('-', '.');
}

/** 주식창 "기업정보" 탭: 기업 개요 + 대표자/상장일/업종/시장구분 등 기본 정보 */
function CompanyInfoTab({ stockId, token }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getCompanyInfo(token, stockId)
      .then((d) => {
        if (!cancelled) setInfo(d);
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

  const fields = [
    ['대표자', info.ceo],
    ['상장일', formatDate(info.listedAt)],
    ['업종', info.sector],
    ['시장구분', info.market],
    ['종목코드', info.stockId],
    ['결산월', info.fiscalMonthEnd],
  ];

  return (
    <>
      <div className={tabStyles.card}>
        <p className={tabStyles.cardTitle}>기업 개요</p>
        <p className={tabStyles.companyDesc}>{info.description}</p>
      </div>

      <div className={tabStyles.card}>
        <p className={tabStyles.cardTitle}>기본 정보</p>
        <div className={tabStyles.infoGrid}>
          {fields.map(([label, value]) => (
            <div key={label} className={styles.gridRow}>
              <p className={styles.gridMuted}>{label}</p>
              <p className={styles.gridStrong}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CompanyInfoTab;
