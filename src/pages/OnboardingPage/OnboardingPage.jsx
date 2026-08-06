import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './OnboardingPage.module.css';

const TOTAL_STEPS = 3;
const SIGNUP_BONUS = 10000000;

const EVENT_ICONS = [
  { emoji: '🔥', className: styles.iconFire },
  { emoji: '⏰', className: styles.iconClock },
  { emoji: '👥', className: styles.iconUsers },
  { emoji: '🤖', className: styles.iconBot },
];

const NEXT_BUTTON_LABEL = {
  1: '다음으로',
  2: '다음으로',
  3: '투자 시작하기',
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const goPrev = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/home" className={styles.skip}>
        건너뛰기
      </Link>

      <div className={styles.centerCol}>
        {step === 1 && (
          <>
            <div className={styles.hero}>
              <div className={styles.ringOuter} />
              <div className={styles.ringInner} />
              <div className={styles.core}>
                <span>🧠</span>
              </div>
              <div className={`${styles.badge} ${styles.badgeFire}`}>🔥</div>
              <div className={`${styles.badge} ${styles.badgeUsers}`}>👥</div>
              <div className={`${styles.badge} ${styles.badgeClock}`}>⏰</div>
            </div>

            <p className={styles.eyebrow}>WELCOME</p>

            <h1 className={styles.title}>
              당신은 투자 심리에
              <br />
              <span className={styles.highlight}>얼마나 흔들릴까요?</span>
            </h1>

            <p className={styles.description}>
              가상 투자금으로 실전처럼 투자하면서, 나도 몰랐던 나의 투자 습관과
              <br />
              심리적 약점을 확인해보는 실험형 서비스예요.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.iconRow}>
              {EVENT_ICONS.map(({ emoji, className }) => (
                <div key={emoji} className={`${styles.iconTile} ${className}`}>
                  {emoji}
                </div>
              ))}
            </div>

            <p className={styles.eyebrow}>
              STEP {step} / {TOTAL_STEPS}
            </p>

            <h1 className={`${styles.title} ${styles.titleWide}`}>
              투자 중간중간
              <br />
              <span className={styles.highlight}>심리를 흔드는 이벤트</span>가
              등장해요
            </h1>

            <p className={styles.description}>
              급등 알림, 다른 투자자들의 매수 현황 같은 요소들이 실제 투자
              앱처럼 랜덤하게 나타납니다. 흔들리지 않고 판단할 수 있을까요?
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <div className={styles.fundPanel}>
              <p className={styles.fundLabel}>지급된 가상 투자금</p>
              <div className={styles.fundAmount}>
                <span>{SIGNUP_BONUS.toLocaleString('ko-KR')}</span>
                <span className={styles.fundUnit}>원</span>
              </div>
              <div className={styles.fundBadge}>✓ 계좌에 입금 완료</div>
            </div>

            <p className={styles.eyebrow}>
              STEP {step} / {TOTAL_STEPS}
            </p>

            <h1 className={styles.title}>
              이제 <span className={styles.highlight}>1000만원</span>으로
              <br />
              투자를 시작해볼까요?
            </h1>

            <p className={styles.description}>
              모든 거래는 가상으로 진행돼요. 마음껏 투자하면서,
              <br />
              마지막엔 당신만의 투자 심리 리포트를 받아보세요.
            </p>
          </>
        )}

        <div className={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((n) => (
            <span
              key={n}
              className={`${styles.dot} ${n === step ? styles.dotActive : ''}`}
            />
          ))}
        </div>

        <div className={styles.nav}>
          {step > 1 && (
            <button
              type="button"
              className={styles.prevButton}
              onClick={goPrev}
            >
              이전
            </button>
          )}
          <button type="button" className={styles.startButton} onClick={goNext}>
            {NEXT_BUTTON_LABEL[step]}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
