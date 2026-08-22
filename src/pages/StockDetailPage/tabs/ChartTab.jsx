import { useEffect, useState } from 'react';
import { getChartPrices } from '../../../api/stocks';
import styles from '../StockDetailPage.module.css';
import tabStyles from './tabs.module.css';

const INTERVALS = ['1분', '5분', '1일'];
const RANGES = ['1일', '1주', '1개월'];

// 화면 라벨(한글) -> 백엔드가 요구하는 interval/range 코드값
const INTERVAL_CODES = { '1분': '1m', '5분': '5m', '1일': '1d' };
const RANGE_CODES = { '1일': '1d', '1주': '1w', '1개월': '1m' };

/** 캔들의 종가만 이어서 SVG 라인 차트 좌표를 만듭니다. (캔들스틱 렌더링은 다음 패스) */
function candlesToPoints(candles) {
  const closes = candles.map((c) => c.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  return candles
    .map((candle, i) => {
      const x = (i / (candles.length - 1 || 1)) * 1000;
      const y = 190 - ((candle.close - min) / span) * 180;
      return `${x.toFixed(0)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** 주식창 "차트" 탭: 간격/기간 토글 + 추세 라인 차트 */
function ChartTab({ stockId, token, isUp }) {
  const [chartInterval, setChartInterval] = useState('1일');
  const [range, setRange] = useState('1일');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getChartPrices(token, stockId, {
      interval: INTERVAL_CODES[chartInterval],
      range: RANGE_CODES[range],
    })
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
  }, [token, stockId, chartInterval, range]);

  return (
    <>
      <div className={tabStyles.chartControls}>
        <div className={tabStyles.toggleGroup}>
          {INTERVALS.map((item) => (
            <button
              key={item}
              type="button"
              className={`${tabStyles.toggleBtn} ${chartInterval === item ? tabStyles.toggleBtnActive : ''}`}
              onClick={() => setChartInterval(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className={tabStyles.toggleGroup}>
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              className={`${tabStyles.toggleBtn} ${range === item ? tabStyles.toggleBtnActive : ''}`}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className={styles.stateText}>불러오는 중...</p>}
      {!loading && error && <p className={styles.stateText}>{error}</p>}
      {!loading && !error && (
        <div className={styles.chartBox}>
          <svg
            className={styles.chartSvg}
            viewBox="0 0 1000 200"
            preserveAspectRatio="none"
          >
            <polyline
              points={candlesToPoints(data.candles)}
              fill="none"
              stroke={isUp ? 'var(--up)' : 'var(--down)'}
              strokeWidth="3"
            />
          </svg>
        </div>
      )}
    </>
  );
}

export default ChartTab;
