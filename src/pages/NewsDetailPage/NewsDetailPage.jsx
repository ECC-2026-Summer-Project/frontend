import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import { useAuth } from '../../hooks/useAuth';
import { getNewsDetail, recordNewsView } from '../../api/news';
import styles from './NewsDetailPage.module.css';

/** ISO 문자열을 "2026년 8월 27일 14:30" 형태로 표시합니다. */
function formatPublishedAt(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NewsDetailPage() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.accessToken;

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 상세 화면에 머문 시간(초)을 이탈 시 서버에 기록하기 위한 진입 시각
  const enteredAtRef = useRef(Date.now());

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('로그인이 필요합니다.');
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    getNewsDetail(token, newsId)
      .then((data) => {
        if (!cancelled) {
          setNews(data);
          setError('');
        }
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

  // 화면을 벗어날 때 머문 시간을 기록합니다. (매수·매도 반응 점수 산정용)
  // 이미 이탈한 뒤라 실패해도 화면에는 알리지 않고 조용히 무시합니다.
  useEffect(() => {
    if (!token || !newsId) return undefined;
    enteredAtRef.current = Date.now();
    return () => {
      const durationSeconds = Math.round(
        (Date.now() - enteredAtRef.current) / 1000,
      );
      if (durationSeconds > 0) {
        recordNewsView(token, newsId, durationSeconds).catch(() => {});
      }
    };
  }, [token, newsId]);

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.body}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          ← 뒤로
        </button>

        {loading ? (
          <p className={styles.stateText}>불러오는 중...</p>
        ) : error ? (
          <p className={styles.stateText}>{error}</p>
        ) : !news ? (
          <p className={styles.stateText}>뉴스를 찾을 수 없어요.</p>
        ) : (
          <article className={styles.article}>
            <h1 className={styles.title}>{news.title}</h1>
            {news.publishedAt && (
              <p className={styles.publishedAt}>
                {formatPublishedAt(news.publishedAt)}
              </p>
            )}
            <p className={styles.content}>{news.content}</p>
          </article>
        )}
      </div>
    </div>
  );
}

export default NewsDetailPage;
