import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout/AuthLayout';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { signup, checkUserId } from '../../api/auth';
import styles from './SignupPage.module.css';

function SignupPage() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // null | 'checking' | 'available' | 'unavailable'
  const [idCheck, setIdCheck] = useState(null);

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    setIdCheck(null);
  };

  const handleUserIdBlur = async () => {
    if (!userId) return;
    setIdCheck('checking');
    try {
      const { available } = await checkUserId(userId);
      setIdCheck(available ? 'available' : 'unavailable');
    } catch {
      setIdCheck(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(userId, password);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="signup"
      title="안녕하세요:)"
      description="회원가입에 사용할 아이디와 비밀번호를 입력해주세요"
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="아이디"
          name="userId"
          placeholder="아이디를 입력하세요"
          value={userId}
          onChange={handleUserIdChange}
          onBlur={handleUserIdBlur}
          error={
            error ||
            (idCheck === 'unavailable' ? '이미 사용중인 아이디입니다.' : '')
          }
          helperText={
            idCheck === 'available'
              ? '사용 가능한 아이디입니다.'
              : idCheck === 'checking'
                ? '확인 중...'
                : undefined
          }
          autoComplete="username"
        />
        <Input
          label="비밀번호"
          name="password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" loading={loading}>
          회원가입
        </Button>
      </form>

      <p className={styles.footer}>
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className={styles.footerLink}>
          로그인
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SignupPage;
