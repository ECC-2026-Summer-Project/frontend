import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import { useAuth } from '../../../hooks/useAuth';

const MENU_ITEMS = [
  { label: '홈', path: '/' },
  { label: '주식', path: '/stocks' },
  { label: '레포트', path: '/reports' },
  { label: '설정', path: '/settings' },
];

/** 아이디에서 아바타에 표시할 두 글자를 뽑아냅니다. (예: minjun_kim -> MI) */
function getAvatarInitials(userId = '') {
  return userId.slice(0, 2).toUpperCase();
}

function Header() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className={styles.topnav}>
      <Link to="/" className={styles.logo}>
        <span className={styles.mark} />
        심리투자
      </Link>

      <nav className={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? styles.active : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.right}>
        {isAuthenticated ? (
          <>
            <span className={styles.userName}>{user.userId} 님</span>
            <div className={styles.avatar}>
              {getAvatarInitials(user.userId)}
            </div>
          </>
        ) : (
          <Link to="/login" className={styles.loginLink}>
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
