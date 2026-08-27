import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header/Header';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { useAuth } from '../../hooks/useAuth';
import { changePassword, deleteAccount } from '../../api/auth';
import styles from './SettingPage.module.css';
import Modal from '../../components/common/Modal/Modal';
import { clearWatchlist } from '../../utils/watchlistStorage';
import { clearOnboardingSeen } from '../../utils/onboardingStorage';

const SIDE_NAV_ITEMS = ['계정'];

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
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordChangedModal, setShowPasswordChangedModal] =
    useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  const Logout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const confirmChangePassword = () => {
    setShowPasswordChangedModal(false);
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setPasswordError('');
    setCurrentPasswordError('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError('');
    setCurrentPasswordError('');
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setCurrentPasswordError('');

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
      await changePassword(
        user?.accessToken,
        user?.userId,
        currentPassword,
        newPassword,
      );

      setPasswordChangedAt(new Date().toISOString());
      setShowPasswordModal(false);
      setShowPasswordChangedModal(true);
    } catch (err) {
      setCurrentPasswordError(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const openWithdrawModal = () => {
    setWithdrawPassword('');
    setWithdrawError('');
    setShowWithdrawModal(true);
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setWithdrawError('');
  };

  const submitWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawing(true);
    try {
      await deleteAccount(user?.accessToken, user?.userId, withdrawPassword);

      clearWatchlist(user?.userId);
      clearOnboardingSeen(user?.userId);

      setShowWithdrawModal(false);
      await logout();
      navigate('/login');
    } catch (err) {
      setWithdrawError(err.message);
    } finally {
      setWithdrawing(false);
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

              <button
                type="button"
                className={styles.row}
                onClick={openWithdrawModal}
              >
                <div className={styles.rowLeft}>
                  <p className={`${styles.rowTitle} ${styles.danger}`}>
                    회원 탈퇴
                  </p>
                  <p className={styles.rowDesc}>
                    모든 데이터가 영구적으로 삭제됩니다
                  </p>
                </div>
                <span className={styles.chevron}>›</span>
              </button>
            </div>
          </section>
        </main>
      </div>

      <Modal
        open={showLogoutModal}
        onClose={closeLogoutModal}
        title="로그아웃 하시겠습니까?"
      >
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={closeLogoutModal}>
            취소
          </Button>
          <Button variant="dangerSolid" onClick={Logout}>
            로그아웃
          </Button>
        </div>
      </Modal>

      <Modal
        open={showPasswordModal}
        onClose={closePasswordModal}
        title="비밀번호 변경"
      >
        <form onSubmit={submitPasswordChange}>
          <Input
            label="현재 비밀번호"
            type="password"
            placeholder="현재 비밀번호를 입력하세요"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (currentPasswordError) setCurrentPasswordError('');
            }}
            autoComplete="current-password"
            autoFocus
            error={currentPasswordError}
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
              disabled={!currentPassword || !newPassword || !newPasswordConfirm}
            >
              변경하기
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showPasswordChangedModal}
        onClose={confirmChangePassword}
        title="비밀번호가 변경되었습니다."
        showCloseButton={false}
      >
        <div className={styles.modalActions}>
          <Button variant="primary" onClick={confirmChangePassword}>
            확인
          </Button>
        </div>
      </Modal>

      <Modal
        open={showWithdrawModal}
        onClose={closeWithdrawModal}
        title="정말 탈퇴하시겠어요?"
      >
        <form onSubmit={submitWithdraw}>
          <p className={styles.rowDesc} style={{ marginBottom: 12 }}>
            탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 계속하려면
            비밀번호를 입력하세요.
          </p>
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={withdrawPassword}
            onChange={(e) => setWithdrawPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            error={withdrawError}
          />
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="outline"
              onClick={closeWithdrawModal}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={withdrawing}
              disabled={!withdrawPassword}
            >
              탈퇴하기
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SettingPage;
