import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { hasSeenOnboarding } from '../../utils/onboardingStorage';
import { consumeSessionExpired } from '../../utils/authStorage';
import styles from './LoginPage.module.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 세션(Access/Refresh Token 모두) 만료로 강제 로그아웃되어 넘어온 경우 안내 문구를 보여줍니다.
  useEffect(() => {
    if (consumeSessionExpired()) {
      setError('세션이 만료되었습니다. 다시 로그인해주세요.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = await login(userId, password);
      navigate(hasSeenOnboarding(auth.userId) ? '/home' : '/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="login"
      title="안녕하세요:)"
      description="아이디와 비밀번호를 입력해주세요"
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="아이디"
          name="userId"
          placeholder="아이디를 입력하세요"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          error={error}
          autoComplete="username"
        />
        <Input
          label="비밀번호"
          name="password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <Button type="submit" variant="primary" loading={loading}>
          로그인
        </Button>
      </form>

      <p className={styles.footer}>
        계정이 없으신가요?{' '}
        <Link to="/signup" className={styles.footerLink}>
          회원가입
        </Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
