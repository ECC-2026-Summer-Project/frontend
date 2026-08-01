import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

/**
 * 로그인 / 회원가입 페이지가 공유하는 레이아웃.
 * 왼쪽 브랜드 패널 + 오른쪽 폼 영역, 상단 탭으로 두 페이지를 사용
 *
 * @param {'login'|'signup'} activeTab
 * @param {string} title - 폼 상단 타이틀 (예: "다시 오셨네요")
 * @param {string} description - 타이틀 아래 설명
 */
function AuthLayout({ activeTab, title, description, children }) {
  return (
    <div className={styles.body}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <span className={styles.mark} />
          심리투자
        </div>

        <div>
          <div className={styles.headline}>
            당신은 투자 심리에
            <br />
            얼마나 <em>흔들릴까요?</em>
          </div>
          <div className={styles.sub}>
            가상 자산 100만원으로 시작하는 투자 심리 실험. 급등 알림,
            <br />
            카운트다운, 군중심리 속에서 당신의 진짜 투자 성향을 확인해보세요.
          </div>
        </div>

        <div className={styles.copyright}>
          © 2026 심리투자 · 모의투자 서비스
        </div>

        <div className={`${styles.floatToast} ${styles.ft1}`}>
          🔥 현재 91%가 매수했어요
        </div>
        <div className={`${styles.floatToast} ${styles.ft2}`}>
          🤖 AI 추천 종목
        </div>
        <div className={`${styles.floatToast} ${styles.ft3}`}>
          ⏰ 3분 후 종료
        </div>
      </div>

      <div className={styles.formWrap}>
        <div className={styles.formInner}>
          <div className={styles.tabs}>
            <Link
              to="/login"
              className={`${styles.tab} ${activeTab === 'login' ? styles.tabActive : ''}`}
            >
              로그인
            </Link>
            <Link
              to="/signup"
              className={`${styles.tab} ${activeTab === 'signup' ? styles.tabActive : ''}`}
            >
              회원가입
            </Link>
          </div>

          <h2 className={styles.title}>{title}</h2>
          <p className={styles.desc}>{description}</p>

          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
