import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import { useAuth } from '../../hooks/useAuth';
import { getReport } from '../../api/reports';
import { loadLatestReportId } from '../../utils/reportStorage';
import styles from './ReportPage.module.css';

const TYPE_EMOJI = {
  군중심리형: '🟪',
};
const DEFAULT_TYPE_EMOJI = '🟣';

const TRIGGER_META = [
  {
    key: 'newsInformationScore',
    icon: '📰',
    tone: 'Alert',
    label: '뉴스 정보 확인',
    subject: '뉴스·정보 확인',
  },
  {
    key: 'surgingStockScore',
    icon: '🔥',
    tone: 'Up',
    label: '급등주 추천',
    subject: '급등주 추천',
  },
  {
    key: 'aiRecommendationScore',
    icon: '🤖',
    tone: 'Violet',
    label: 'AI 추천',
    subject: 'AI 추천',
  },
];

/** 점수(0~100)를 민감도 설명 문구로 변환합니다. */
function sensitivityPhrase(score) {
  if (score >= 70) return '매우 민감하게 반응해요';
  if (score >= 40) return '어느 정도 반응하는 편이에요';
  return '크게 반응하지 않는 편이에요';
}

function formatWon(n) {
  return `${n.toLocaleString('ko-KR')}원`;
}

function formatSignedWon(n) {
  return `${n >= 0 ? '+' : ''}${formatWon(n)}`;
}

function formatRate(rate) {
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;
}

function formatDate(iso) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} 생성`;
}

/** 값의 부호(+/-)에 맞는 up/down 클래스명을 반환합니다. */
function signClass(n) {
  return n >= 0 ? styles.up : styles.down;
}

/**
 * 투자 심리 리포트 화면
 * 홈 화면에서 "레포트 출력" 버튼(거래 조건 충족 시 활성화)을 눌러 진입합니다.
 * Figma: https://www.figma.com/design/8Bw3RnxaLuok7uLeStoiLD/인베스트미
 *  - node-id=194-2
 */
function ReportPage() {
  const { user } = useAuth();
  const token = user?.accessToken;
  // 생성된 레포트가 아직 없는 계정(데모 계정 invest_lover 제외)은 1로 폴백
  const reportId = loadLatestReportId(user?.userId) ?? 1;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notGenerated, setNotGenerated] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setNotGenerated(false);

    getReport(token, reportId)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.code === 'REPORT_NOT_GENERATED') {
          setNotGenerated(true);
        } else {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, reportId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.stateText}>불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.stateText}>{error}</p>
      </div>
    );
  }

  if (notGenerated) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.emptyState}>
          <p className={styles.stateText}>아직 생성된 레포트가 없어요.</p>
          <Link to="/stocks" className={styles.shareBtn}>
            투자하러 가기
          </Link>
        </div>
      </div>
    );
  }

  const {
    createdAt,
    investmentStyle,
    investmentSummary,
    triggerSensitivity,
    behaviorAnalysis,
    bestPerformingStock,
    worstPerformingStock,
    feedback,
  } = report;

  const totalTrades = behaviorAnalysis.buyCount + behaviorAnalysis.sellCount;
  const buyDeg = totalTrades
    ? (behaviorAnalysis.buyCount / totalTrades) * 360
    : 0;

  const stockPerformance = [
    { tag: 'BEST', tagType: 'up', ...bestPerformingStock },
    { tag: 'WORST', tagType: 'down', ...worstPerformingStock },
  ];

  const behaviorInsights = [
    {
      icon: '📰',
      iconBg: 'rgba(76, 141, 255, 0.12)',
      value: `뉴스 ${behaviorAnalysis.viewedNewsCount}개 확인`,
      desc: '정보 탐색 성향 · 매매 전 관련 뉴스를 확인한 정도예요',
    },
    {
      icon: '🤖',
      iconBg: 'rgba(180, 92, 255, 0.12)',
      value: `AI 추천 ${behaviorAnalysis.aiRecommendedPurchaseCount}회 매수`,
      desc: 'AI가 추천한 종목을 실제 매수로 이어간 횟수예요',
    },
  ];

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.body}>
        <aside className={styles.left}>
          <p className={styles.eyebrow}>투자 심리 리포트</p>
          <p className={styles.date}>{formatDate(createdAt)}</p>

          <div className={styles.typeBadge}>
            <span className={styles.typeEmoji}>
              {TYPE_EMOJI[investmentStyle.type] || DEFAULT_TYPE_EMOJI}
            </span>
            <p className={styles.typeTitle}>
              <span>{investmentStyle.type}</span>
              <span>투자자</span>
            </p>
          </div>

          <p className={styles.typeDesc}>{investmentStyle.description}</p>

          {/* TODO: 결과 공유 기능 구현 필요 */}
          <button type="button" className={styles.shareBtn}>
            결과 공유하기
          </button>
        </aside>

        <main className={styles.right}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>투자 결과 요약</h2>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <div>
                  <p className={styles.summaryLabel}>전체 투자 수익률</p>
                  <p
                    className={`${styles.summaryRate} ${signClass(investmentSummary.totalReturnRate)}`}
                  >
                    {formatRate(investmentSummary.totalReturnRate)}
                  </p>
                </div>
                <span className={styles.badge}>
                  총 {investmentSummary.totalTradeCount}회 거래
                </span>
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.summaryGrid}>
                <div className={styles.gridItem}>
                  <p className={styles.gridLabel}>총매수금액</p>
                  <p className={styles.gridValue}>
                    {formatWon(investmentSummary.totalPurchaseAmount)}
                  </p>
                </div>
                <div className={styles.gridItem}>
                  <p className={styles.gridLabel}>현재 평가금액</p>
                  <p className={styles.gridValue}>
                    {formatWon(investmentSummary.totalEvaluationAmount)}
                  </p>
                </div>
                <div className={styles.gridItem}>
                  <p className={styles.gridLabel}>평가손익</p>
                  <p
                    className={`${styles.gridValue} ${signClass(investmentSummary.totalProfitLoss)}`}
                  >
                    {formatSignedWon(investmentSummary.totalProfitLoss)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>심리 트리거 민감도</h2>
            <div className={styles.triggerCard}>
              {TRIGGER_META.map((meta) => {
                const score = triggerSensitivity[meta.key];
                return (
                  <div key={meta.key} className={styles.triggerItem}>
                    <div className={styles.triggerHead}>
                      <div className={styles.triggerLabel}>
                        <div
                          className={`${styles.triggerIcon} ${styles[`icon${meta.tone}`]}`}
                        >
                          {meta.icon}
                        </div>
                        <p>{meta.label}</p>
                      </div>
                      <p className={styles.triggerScore}>{score}점</p>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${styles[`bar${meta.tone}`]}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className={styles.triggerDesc}>
                      {meta.subject}에 {sensitivityPhrase(score)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>투자 행동 분석</h2>
            <div className={styles.behaviorGrid}>
              <div className={styles.donutCard}>
                <div className={styles.donutWrap}>
                  <div
                    className={styles.donutRing}
                    style={{
                      background: `conic-gradient(var(--up) 0deg ${buyDeg}deg, var(--down) ${buyDeg}deg 360deg)`,
                    }}
                  />
                  <div className={styles.donutHole}>
                    <p className={styles.donutCount}>{totalTrades}회</p>
                    <p className={styles.donutLabel}>총 거래</p>
                  </div>
                </div>

                <div className={styles.donutLegend}>
                  <div className={styles.legendItem}>
                    <i className={styles.dotUp} />
                    <span className={styles.legendText}>
                      <span className={styles.legendLabel}>매수</span>
                      <span className={styles.legendValue}>
                        {behaviorAnalysis.buyCount}
                      </span>
                    </span>
                  </div>
                  <div className={styles.legendItem}>
                    <i className={styles.dotDown} />
                    <span className={styles.legendText}>
                      <span className={styles.legendLabel}>매도</span>
                      <span className={styles.legendValue}>
                        {behaviorAnalysis.sellCount}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.behaviorSide}>
                {behaviorInsights.map((insight) => (
                  <div key={insight.value} className={styles.insightCard}>
                    <div
                      className={styles.insightIcon}
                      style={{ background: insight.iconBg }}
                    >
                      {insight.icon}
                    </div>
                    <div>
                      <p className={styles.insightValue}>{insight.value}</p>
                      <p className={styles.insightDesc}>{insight.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>종목별 성과</h2>
            <div className={styles.stockCompare}>
              {stockPerformance.map((stock) => (
                <div key={stock.stockId} className={styles.perfCard}>
                  <span
                    className={`${styles.perfTag} ${stock.tagType === 'up' ? styles.perfTagUp : styles.perfTagDown}`}
                  >
                    {stock.tag}
                  </span>
                  <p className={styles.perfName}>{stock.stockName}</p>
                  <p
                    className={`${styles.perfRate} ${stock.tagType === 'up' ? styles.up : styles.down}`}
                  >
                    {formatRate(stock.returnRate)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>종합 피드백</h2>
            <p className={styles.feedbackCard}>{feedback}</p>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ReportPage;
