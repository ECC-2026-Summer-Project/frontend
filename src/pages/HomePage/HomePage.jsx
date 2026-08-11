import Header from '../../components/layout/Header/Header';
import { Link, useNavigate } from 'react-router-dom';
import pulseIcon from '../../assets/pulse.svg';
import styles from './HomePage.module.css';

// TODO: 실제로는 거래 횟수 등 리포트 생성 조건 충족 여부를 서버에서 받아와야 함
const REPORT_READY = true;

const accountSummary = {
  totalAsset: 1080000,
  changeAmount: 80000,
  changeRate: 8.0,
};

const holdings = [
  {
    ticker: '삼전',
    name: '삼성전자',
    shares: 12,
    price: 78200,
    changeRate: 3.4,
  },
  {
    ticker: '2차전',
    name: '2차전지 ETF',
    shares: 5,
    price: 14850,
    changeRate: -1.1,
  },
  {
    ticker: '카카오',
    name: '카카오',
    shares: 8,
    price: 42300,
    changeRate: 1.8,
  },
];

const trendingStocks = [
  {
    name: '에코프로',
    tag: '급등',
    tagType: 'up',
    price: 812000,
    changeRate: 18.2,
  },
  {
    name: '셀트리온',
    tag: 'AI추천',
    tagType: 'violet',
    price: 189500,
    changeRate: 6.4,
  },
  {
    name: '한미반도체',
    tag: '급등',
    tagType: 'up',
    price: 142300,
    changeRate: 11.9,
  },
  { name: 'LG에너지솔루션', tag: null, price: 398000, changeRate: -2.1 },
];

const news = [
  { category: '속보', text: '○○기업, 신규 계약 체결로 실적 개선 기대' },
  { category: '시황', text: '코스피, 외국인 순매수에 상승 마감' },
  { category: '특징주', text: '2차전지 관련주, 정책 기대감에 동반 강세' },
];

const aiPicks = [
  { name: '셀트리온', changeRate: 6.4 },
  { name: '삼성바이오로직스', changeRate: 2.9 },
  { name: 'NAVER', changeRate: 4.1 },
];

const triggerToast = {
  title: '현재 91%의 투자자가 매수했어요',
  subtitle: '에코프로 · 지금 가장 뜨거운 종목',
};

/** 등락률이 상승(빨강)인지 하락(파랑)인지에 맞는 클래스명을 반환합니다. */
function changeClass(rate) {
  return rate >= 0 ? styles.up : styles.down;
}

/** 등락률을 부호가 붙은 퍼센트 문자열로 변환합니다. (예: 3.4 -> "+3.4%") */
function formatRate(rate) {
  return `${rate >= 0 ? '+' : ''}${rate}%`;
}

/** 태그 종류('up' | 'violet')에 맞는 뱃지 클래스명을 반환합니다. */
function tagClass(tagType) {
  return tagType === 'violet' ? styles.tagViolet : styles.tagUp;
}

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.home}>
      <Header />

      <div className={styles.homeBody}>
        <section className={styles.colLeft}>
          <div className={styles.accountCard}>
            <p className={styles.cardLabel}>총 평가자산</p>
            <p className={styles.cardValue}>
              {accountSummary.totalAsset.toLocaleString('ko-KR')}원
            </p>
            <p className={changeClass(accountSummary.changeRate)}>
              {accountSummary.changeAmount >= 0 ? '▲' : '▼'}{' '}
              {accountSummary.changeAmount >= 0 ? '+' : ''}
              {accountSummary.changeAmount.toLocaleString('ko-KR')}원 (
              {formatRate(accountSummary.changeRate)})
            </p>
          </div>

          <div className={styles.sectionHead}>
            <p className={styles.sectionTitle}>보유 종목</p>
            <Link to="/stocks" className={styles.sectionLink}>
              전체보기
            </Link>
          </div>

          <ul className={styles.holdingsList}>
            {holdings.map((holding) => (
              <li key={holding.name} className={styles.holdingRow}>
                <div className={styles.holdingLeft}>
                  <div className={styles.tickerBadge}>{holding.ticker}</div>
                  <div className={styles.hInfo}>
                    <p className={styles.holdingName}>{holding.name}</p>
                    <p className={styles.holdingShares}>
                      {holding.shares}주 보유
                    </p>
                  </div>
                </div>
                <div className={styles.holdingRight}>
                  <p className={styles.holdingPrice}>
                    {holding.price.toLocaleString('ko-KR')}
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
              {trendingStocks.map((stock) => (
                <div key={stock.name} className={styles.tableRow}>
                  <div className={styles.stockNameWrap}>
                    <p className={styles.stockName}>{stock.name}</p>
                    {stock.tag && (
                      <span
                        className={`${styles.tag} ${tagClass(stock.tagType)}`}
                      >
                        {stock.tag}
                      </span>
                    )}
                  </div>
                  <p className={styles.stockPrice}>
                    {stock.price.toLocaleString('ko-KR')}
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
              {news.map((item) => (
                <li key={item.text} className={styles.newsItem}>
                  <p className={styles.newsCategory}>{item.category}</p>
                  <p className={styles.newsText}>{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.colRight}>
          <p className={styles.sectionTitle}>🤖 AI 추천</p>
          {aiPicks.map((pick) => (
            <div key={pick.name} className={styles.pickCard}>
              <div className={styles.pickHead}>
                <p className={styles.pickName}>{pick.name}</p>
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

      {REPORT_READY ? (
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
