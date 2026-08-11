import styles from './Button.module.css';

/**
 * 공통 버튼 컴포넌트
 *
 * @param {'primary'|'outline'|'danger'|'dangerSolid'} variant - 버튼 스타일
 * @param {boolean} loading - 로딩 중이면 텍스트 대신 안내 문구 + 비활성화
 * @param {boolean} disabled
 * @param {'button'|'submit'} type
 */
function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? '처리 중...' : children}
    </button>
  );
}

export default Button;
