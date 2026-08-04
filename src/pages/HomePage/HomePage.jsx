import Header from '../../components/layout/Header/Header';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [isUserAvailable, setIsUserAvailable] = useState(false);
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  console.log(userId);
  async function checkId(userId) {
    const response = await fetch(`/api/users/check-id?userId=${userId}`);
    const data = await response.json();
    console.log(data);
  }

  useEffect(() => {
    checkId(userId);
  }, [userId]);

  console.log(isUserAvailable);

  return (
    <div>
      <Header />
      <div style={{ padding: '60px 40px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {isAuthenticated
            ? `${user.userId} 님, 환영합니다`
            : '심리투자에 오신 걸 환영합니다'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          홈 화면은 준비 중입니다. 다음 단계에서 종목 리스트/대시보드를 붙일
          예정이에요.
        </p>
      </div>
    </div>
  );
}

export default HomePage;
