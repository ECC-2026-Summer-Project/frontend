import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { changePassword } from '../../api/settings';
import styles from './SettingPage.module.css';

const SIDE_NAV_ITEMS = ['계정', '데이터 · 초기화'];

function formatDate(iso) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}

function getAvatarInitials(userId = '') {
  return userId.slice(0, 2).toUpperCase();
}

function SettingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeNav, setActiveNav] = useState(SIDE_NAV_ITEMS[0]);
  const [passwordChangedAt, setPasswordChangedAt] = useState(
    '2026-03-12T00:00:00.000Z',
  );

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError('');
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== newPasswordConfirm) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setChangingPassword(true);
    try {
      const { passwordChangedAt: changedAt } = await changePassword(
        user?.accessToken,
        currentPassword,
        newPassword,
      );
      setPasswordChangedAt(changedAt);
      setShowPasswordModal(false);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className={styles.setting}>
      <Header />

      <div className={styles.settingBody}>
        <aside className={styles.sidebar}>
          <div className={styles.profile}>
            <div className={styles.avatar}>
              {getAvatarInitials(user?.userId)}
            </div>
            <p className={styles.profileName}>{user?.userId}</p>
          </div>

          <nav className={styles.sideNav}>
            {SIDE_NAV_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.navItem} ${item === activeNav ? styles.navActive : ''}`}
                onClick={() => setActiveNav(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className={styles.main}>
          <section className={styles.group}>
            <h2 className={styles.groupTitle}>계정</h2>
            <div className={styles.card}>
              <button
                type="button"
                className={styles.row}
                onClick={openPasswordModal}
              >
                <div className={styles.rowLeft}>
                  <p className={styles.rowTitle}>비밀번호 변경</p>
                  <p className={styles.rowDesc}>
                    마지막 변경일: {formatDate(passwordChangedAt)}
                  </p>
                </div>
                <span className={styles.chevron}>›</span>
              </button>

              <div className={styles.row}>
                <p className={styles.rowTitle}>아이디</p>
                <span className={styles.rowValue}>{user?.userId}</span>
              </div>

              <button
                type="button"
                className={styles.row}
                onClick={openLogoutModal}
              >
                <div className={styles.rowLeft}>
                  <p className={styles.rowTitle}>로그아웃</p>
                </div>
                <span className={styles.chevron}>›</span>
              </button>
            </div>
          </section>

          <section className={styles.group}>
            <h2 className={styles.groupTitle}>데이터 · 초기화</h2>
            <div className={styles.card}>
              <div className={styles.row}>
                <div className={styles.rowLeft}>
                  <p className={styles.rowTitle}>투자 데이터 초기화</p>
                  <p className={styles.rowDesc}>
                    보유 종목과 거래 내역을 초기화합니다
                  </p>
                </div>
                <span className={styles.chevron}>›</span>
              </div>

              <div className={styles.row}>
                <div className={styles.rowLeft}>
                  <p className={`${styles.rowTitle} ${styles.danger}`}>
                    회원 탈퇴
                  </p>
                  <p className={styles.rowDesc}>
                    모든 데이터가 영구적으로 삭제됩니다
                  </p>
                </div>
                <span className={styles.chevron}>›</span>
              </div>
            </div>
          </section>
        </main>
      </div>

      {showLogoutModal && (
        <div className={styles.modalOverlay} onClick={closeLogoutModal}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <p>로그아웃하시겠습니까?</p>
            </div>

            <div className={styles.modalActions}>
              <Button type="button" variant="outline" onClick={closeLogoutModal}>
                취소
              </Button>
              <Button type="button" variant="primary" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className={styles.modalOverlay} onClick={closePasswordModal}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <p>비밀번호 변경</p>
              <button
                type="button"
                onClick={closePasswordModal}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitPasswordChange}>
              <Input
                label="현재 비밀번호"
                type="password"
                placeholder="현재 비밀번호를 입력하세요"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
              <Input
                label="새 비밀번호"
                type="password"
                placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label="새 비밀번호 확인"
                type="password"
                placeholder="새 비밀번호를 한 번 더 입력하세요"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                error={passwordError}
              />

              <div className={styles.modalActions}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePasswordModal}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={changingPassword}
                  disabled={
                    !currentPassword || !newPassword || !newPasswordConfirm
                  }
                >
                  변경하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingPage;
