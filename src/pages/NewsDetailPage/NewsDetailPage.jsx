import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import { useAuth } from '../../hooks/useAuth';
import { getNewsDetail, recordNewsView } from '../../api/news';
import styles from './NewsDetailPage.module.css';

/** ISO 날짜 문자열을 "yyyy.mm.dd HH:mm" 형태로 변환합니다. */
function formatPublishedAt(iso) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

/**
 * 뉴스 상세 화면
 * 홈 화면의 "실시간 뉴스" 목록에서 뉴스를 클릭하면 진입합니다.
 */
function NewsDetailPage() {
  const { newsId } = useParams();
  const { user } = useAuth();
  const token = user?.accessToken;

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    getNewsDetail(token, newsId)
      .then((data) => {
        if (!cancelled) setNews(data);
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
  }, [token, newsId]);

  // 뉴스 상세 화면에 머문 시간을 기록합니다. (매수·매도 반응 점수 산정에 활용)
  const enteredAtRef = useRef(Date.now());
  useEffect(() => {
    enteredAtRef.current = Date.now();
    return () => {
      if (!token) return;
      const durationSeconds = Math.round(
        (Date.now() - enteredAtRef.current) / 1000,
      );
      recordNewsView(token, newsId, durationSeconds).catch(() => {
        // 열람 기록 실패는 화면 흐름에 영향을 주지 않도록 조용히 무시합니다.
      });
    };
  }, [token, newsId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.stateText}>불러오는 중...</p>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.stateText}>{error || '뉴스를 찾을 수 없어요.'}</p>
        <Link to="/home" className={styles.backLink}>
          ← 홈으로
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.body}>
        <Link to="/home" className={styles.backLink}>
          ← 홈으로
        </Link>

        <article className={styles.article}>
          <p className={styles.publishedAt}>
            {formatPublishedAt(news.publishedAt)}
          </p>
          <h1 className={styles.title}>{news.title}</h1>
          <p className={styles.content}>{news.content}</p>
        </article>
      </div>
    </div>
  );
}

export default NewsDetailPage;
