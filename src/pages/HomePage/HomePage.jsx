import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import { useAuth } from '../../hooks/useAuth';
import { getAccountSummary, getPortfolioHoldings } from '../../api/home';
import { getSurgingStocks } from '../../api/stocks';
import { getAiRecommendations } from '../../api/recommendations';
import { getNews } from '../../api/news';
import { getReport } from '../../api/reports';
import pulseIcon from '../../assets/pulse.svg';
import styles from './HomePage.module.css';

// TODO: 실제로는 홈 화면 등에서 사용자의 최신 reportId를 전달받아야 함 (ReportPage.jsx와 동일한 임시값)
const REPORT_ID = 1;

// TODO: 매수 트리거 토스트도 실제로는 서버에서 받아와야 함
const triggerToast = {
  title: '현재 91%의 투자자가 매수했어요',
  subtitle: '에코프로 · 지금 가장 뜨거운 종목',
};

const NEWS_REFRESH_MS = 90000;

/** 등락률이 상승(빨강)인지 하락(파랑)인지에 맞는 클래스명을 반환합니다. */
function changeClass(rate) {
  return rate >= 0 ? styles.up : styles.down;
}

/** 등락률을 부호가 붙은 퍼센트 문자열로 변환합니다. (예: 3.4 -> "+3.4%") */
function formatRate(rate) {
  return `${rate >= 0 ? '+' : ''}${rate}%`;
}

/** 종목명 앞 2글자로 뱃지 텍스트를 만듭니다. (예: 삼성전자 -> 삼성) */
function tickerBadge(name) {
  return name.slice(0, 2);
}

function HomePage() {
  const { user } = useAuth();
  const token = user?.accessToken;
  const navigate = useNavigate();

  const [accountSummary, setAccountSummary] = useState(null);
  const [accountError, setAccountError] = useState('');

  const [holdings, setHoldings] = useState([]);
  const [holdingsError, setHoldingsError] = useState('');

  const [trendingStocks, setTrendingStocks] = useState([]);
  const [trendingError, setTrendingError] = useState('');

  const [news, setNews] = useState([]);
  const [newsError, setNewsError] = useState('');

  const [aiPicks, setAiPicks] = useState([]);
  const [aiError, setAiError] = useState('');

  // 레포트가 이미 생성돼 있으면 "레포트 출력" 버튼을, 없으면(404 REPORT_NOT_GENERATED) 매수 트리거 토스트를 보여줍니다.
  const [reportReady, setReportReady] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getReport(token, REPORT_ID)
      .then(() => {
        if (!cancelled) setReportReady(true);
      })
      .catch(() => {
        if (!cancelled) setReportReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getAccountSummary(token)
      .then((data) => {
        if (!cancelled) setAccountSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setAccountError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getPortfolioHoldings(token)
      .then((data) => {
        if (!cancelled) setHoldings(data.holdings || []);
      })
      .catch((err) => {
        if (!cancelled) setHoldingsError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getSurgingStocks(token)
      .then((items) => {
        if (!cancelled) setTrendingStocks(items);
      })
      .catch((err) => {
        if (!cancelled) setTrendingError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getAiRecommendations(token)
      .then((items) => {
        if (!cancelled) setAiPicks(items);
      })
      .catch((err) => {
        if (!cancelled) setAiError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // 90초마다 재호출해 최신 뉴스로 갱신합니다. (직전에 노출된 뉴스는 excludeNewsIds로 제외)
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    let shownIds = [];

    const fetchNews = () => {
      getNews(token, shownIds)
        .then((items) => {
          if (cancelled) return;
          setNews(items);
          shownIds = items.map((item) => item.newsId);
          setNewsError('');
        })
        .catch((err) => {
          if (!cancelled) setNewsError(err.message);
        });
    };

    fetchNews();
    const interval = setInterval(fetchNews, NEWS_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <div className={styles.home}>
      <Header />

      <div className={styles.homeBody}>
        <section className={styles.colLeft}>
          <div className={styles.accountCard}>
            <p className={styles.cardLabel}>총 평가자산</p>
            {accountError ? (
              <p className={styles.cardValue}>{accountError}</p>
            ) : !accountSummary ? (
              <p className={styles.cardValue}>불러오는 중...</p>
            ) : (
              <>
                <p className={styles.cardValue}>
                  {accountSummary.totalAssetAmount.toLocaleString('ko-KR')}원
                </p>
                <p className={changeClass(accountSummary.totalReturnRate)}>
                  {accountSummary.totalProfitLoss >= 0 ? '▲' : '▼'}{' '}
                  {accountSummary.totalProfitLoss >= 0 ? '+' : ''}
                  {accountSummary.totalProfitLoss.toLocaleString('ko-KR')}원 (
                  {formatRate(accountSummary.totalReturnRate)})
                </p>
              </>
            )}
          </div>

          <div className={styles.sectionHead}>
            <p className={styles.sectionTitle}>보유 종목</p>
            <Link to="/stocks" className={styles.sectionLink}>
              전체보기
            </Link>
          </div>

          <ul className={styles.holdingsList}>
            {holdingsError && (
              <li className={styles.holdingRow}>{holdingsError}</li>
            )}
            {!holdingsError && holdings.length === 0 && (
              <li className={styles.holdingRow}>보유한 종목이 없어요.</li>
            )}
            {holdings.map((holding) => (
              <li key={holding.stockId} className={styles.holdingRow}>
                <div className={styles.holdingLeft}>
                  <div className={styles.tickerBadge}>
                    {tickerBadge(holding.stockName)}
                  </div>
                  <div className={styles.hInfo}>
                    <p className={styles.holdingName}>{holding.stockName}</p>
                    <p className={styles.holdingShares}>
                      {holding.quantity}주 보유
                    </p>
                  </div>
                </div>
                <div className={styles.holdingRight}>
                  <p className={styles.holdingPrice}>
                    {holding.currentPrice.toLocaleString('ko-KR')}
                  </p>
                  <p className={changeClass(holding.changeRate)}>
                    {formatRate(holding.changeRate)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.colCenter}>
          <div className={styles.trendingSection}>
            <div className={styles.sectionHead}>
              <p className={styles.sectionTitle}>🔥 지금 뜨는 종목</p>
              <Link to="/stocks" className={styles.sectionLink}>
                더보기
              </Link>
            </div>

            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span className={styles.tableHeadStock}>종목</span>
                <span>현재가</span>
                <span>등락률</span>
              </div>
              {trendingError && (
                <p className={styles.stockName}>{trendingError}</p>
              )}
              {!trendingError && trendingStocks.length === 0 && (
                <p className={styles.stockName}>급등 종목이 없어요.</p>
              )}
              {trendingStocks.map((stock) => (
                <div key={stock.stockId} className={styles.tableRow}>
                  <div className={styles.stockNameWrap}>
                    <p className={styles.stockName}>{stock.stockName}</p>
                    <span className={`${styles.tag} ${styles.tagUp}`}>
                      급등
                    </span>
                  </div>
                  <p className={styles.stockPrice}>
                    {stock.currentPrice.toLocaleString('ko-KR')}
                  </p>
                  <p className={changeClass(stock.changeRate)}>
                    {formatRate(stock.changeRate)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.newsSection}>
            <p className={styles.sectionTitle}>📰 실시간 뉴스</p>
            <ul className={styles.newsList}>
              {newsError && <li className={styles.newsItem}>{newsError}</li>}
              {!newsError && news.length === 0 && (
                <li className={styles.newsItem}>표시할 뉴스가 없어요.</li>
              )}
              {news.map((item) => (
                <li key={item.newsId} className={styles.newsItem}>
                  <Link to={`/news/${item.newsId}`} className={styles.newsLink}>
                    <p className={styles.newsText}>{item.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.colRight}>
          <p className={styles.sectionTitle}>🤖 AI 추천</p>
          {aiError && <p className={styles.pickName}>{aiError}</p>}
          {!aiError && aiPicks.length === 0 && (
            <p className={styles.pickName}>추천 종목이 없어요.</p>
          )}
          {aiPicks.map((pick) => (
            <div key={pick.stockId} className={styles.pickCard}>
              <div className={styles.pickHead}>
                <p className={styles.pickName}>{pick.stockName}</p>
                <span className={`${styles.tag} ${styles.tagViolet}`}>
                  AI추천
                </span>
              </div>
              <p className={changeClass(pick.changeRate)}>
                {formatRate(pick.changeRate)}
              </p>
            </div>
          ))}
        </section>
      </div>

      {reportReady ? (
        <button
          type="button"
          className={styles.reportToast}
          onClick={() => navigate('/report')}
        >
          <img src={pulseIcon} alt="" className={styles.toastIcon} />
          <span className={styles.reportText}>레포트 출력</span>
        </button>
      ) : (
        <div className={styles.triggerToast}>
          <img src={pulseIcon} alt="" className={styles.toastIcon} />
          <div className={styles.toastText}>
            <p className={styles.toastTitle}>{triggerToast.title}</p>
            <p className={styles.toastSubtitle}>{triggerToast.subtitle}</p>
          </div>
          <Link to="/stocks" className={styles.toastCta}>
            보기
          </Link>
        </div>
      )}
    </div>
  );
}

export default HomePage;
