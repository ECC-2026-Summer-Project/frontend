import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import { useAuth } from '../../hooks/useAuth';
import {
  getStocks,
  getSurgingStocks,
  getWatchlist,
  addWatchlist,
  removeWatchlist,
} from '../../api/stocks';
import styles from './StockListPage.module.css';

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'hot', label: '🔥 급등순' },
  { key: 'ai', label: '🤖 AI추천' },
  { key: 'watch', label: '⭐ 관심종목' },
];

/** 종목명 앞 2글자로 뱃지 텍스트를 만듭니다. (예: 삼성전자 -> 삼성) */
function tickerBadge(name) {
  return name.slice(0, 2);
}

/** 등락률이 +10% 이상이면 급등 태그를 붙입니다. (급등 판정 전용 API가 없어 클라이언트에서 계산) */
function getTag(stock) {
  return stock.changeRate >= 10 ? '급등' : null;
}

/**
 * 급등 종목 API(SurgingStockResponse) 응답을 종목 목록 행 형태로 맞춥니다.
 * 이 API에는 거래량 필드가 없어 volume은 비워둡니다.
 */
function normalizeSurgingStock(item) {
  return {
    stockId: item.stockId,
    name: item.stockName,
    currentPrice: item.currentPrice,
    changeRate: item.changeRate,
    changeAmount: item.priceChange,
    volume: undefined,
  };
}

/**
 * 종목별 추이 스파크라인 좌표를 만듭니다.
 * 시세 히스토리 API가 아직 없어 stockId를 시드로 한 결정적 더미 데이터입니다.
 */
function sparkPoints(stockId) {
  let seed = 0;
  for (const ch of stockId) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const next = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return (seed % 1000) / 1000;
  };
  return Array.from(
    { length: 5 },
    (_, i) => `${i * 17.5},${(6 + next() * 14).toFixed(1)}`,
  ).join(' ');
}

/** 등락률을 부호가 붙은 퍼센트 문자열로 변환합니다. */
function formatRate(rate) {
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;
}

function StockListPage() {
  const { user } = useAuth();
  const token = user?.accessToken;
  const navigate = useNavigate();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('all');
  const [watchlist, setWatchlist] = useState(new Set());

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getWatchlist(token)
      .then((items) => {
        if (!cancelled) setWatchlist(new Set(items.map((item) => item.stockId)));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');

      // 급등순 필터는 키워드 파라미터가 없는 전용 API라 결과를 클라이언트에서 검색어로 한 번 더 거릅니다.
      const request =
        filter === 'hot'
          ? getSurgingStocks(token).then((items) =>
              items
                .map(normalizeSurgingStock)
                .filter(
                  (s) =>
                    !keyword ||
                    s.name.includes(keyword) ||
                    s.stockId.includes(keyword),
                ),
            )
          : getStocks(token, { keyword: keyword || undefined });

      request
        .then((stocks) => {
          if (!cancelled) setStocks(stocks);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, keyword, filter]);

  const visibleStocks = useMemo(() => {
    if (filter === 'watch')
      return stocks.filter((s) => watchlist.has(s.stockId));
    if (filter === 'ai') return [];
    return stocks;
  }, [stocks, filter, watchlist]);

  const emptyMessage =
    filter === 'ai'
      ? 'AI 추천 데이터는 준비 중이에요.'
      : filter === 'watch'
        ? '관심 종목으로 등록한 종목이 없어요.'
        : '조건에 맞는 종목이 없어요.';

  const toggleWatch = async (stockId) => {
    if (!token) return;
    const isWatched = watchlist.has(stockId);
    try {
      if (isWatched) {
        await removeWatchlist(token, stockId);
      } else {
        await addWatchlist(token, stockId);
      }
      const next = new Set(watchlist);
      isWatched ? next.delete(stockId) : next.add(stockId);
      setWatchlist(next);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <span>🔍</span>
          <input
            placeholder="종목명 또는 종목코드 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className={styles.filterChips}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.chip} ${filter === f.key ? styles.chipActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.listBody}>
        <div className={styles.tableHead}>
          <span className={styles.colStar} />
          <span className={styles.colName}>종목명</span>
          <span className={styles.colSpark}>추이</span>
          <span className={styles.colPrice}>현재가</span>
          <span className={styles.colRate}>등락률</span>
          <span className={styles.colVolume}>거래량</span>
          <span className={styles.colTag} />
        </div>

        {error && <p className={styles.stateText}>{error}</p>}
        {!error && loading && (
          <p className={styles.stateText}>불러오는 중...</p>
        )}
        {!error && !loading && visibleStocks.length === 0 && (
          <p className={styles.stateText}>{emptyMessage}</p>
        )}

        {!error &&
          !loading &&
          visibleStocks.map((stock) => {
            const isWatched = watchlist.has(stock.stockId);
            const tag = getTag(stock);
            const isUp = stock.changeRate >= 0;
            return (
              <div
                key={stock.stockId}
                className={styles.tableRow}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/stocks/${stock.stockId}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/stocks/${stock.stockId}`);
                }}
              >
                <button
                  type="button"
                  className={styles.colStar}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatch(stock.stockId);
                  }}
                  aria-label={
                    isWatched ? '관심 종목에서 제거' : '관심 종목에 추가'
                  }
                >
                  {isWatched ? '★' : '☆'}
                </button>

                <div className={styles.cellCo}>
                  <div className={styles.coBadge}>
                    {tickerBadge(stock.name)}
                  </div>
                  <div>
                    <p className={styles.coName}>{stock.name}</p>
                    <p className={styles.coCode}>{stock.stockId}</p>
                  </div>
                </div>

                <svg className={styles.colSpark} viewBox="0 0 70 26">
                  <polyline
                    points={sparkPoints(stock.stockId)}
                    fill="none"
                    stroke={isUp ? 'var(--up)' : 'var(--down)'}
                    strokeWidth="2"
                  />
                </svg>

                <p className={styles.colPrice}>
                  {stock.currentPrice.toLocaleString('ko-KR')}
                </p>
                <p
                  className={`${styles.colRate} ${isUp ? styles.up : styles.down}`}
                >
                  {formatRate(stock.changeRate)}
                </p>
                <p className={styles.colVolume}>
                  {stock.volume != null
                    ? stock.volume.toLocaleString('ko-KR')
                    : '-'}
                </p>

                <div className={styles.colTag}>
                  {tag && <span className={styles.tag}>{tag}</span>}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default StockListPage;
