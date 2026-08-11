import styles from '../StockDetailPage.module.css';

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

/** 주식창 "요약" 탭: 미니 추세 차트 + 미니 호가 + 투자자별 매매동향 */
function SummaryTab({ stock }) {
  const isUp = stock.changeRate >= 0;

  return (
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
  );
}

export default SummaryTab;
