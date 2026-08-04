import styles from './Input.module.css';

/**
 * 공통 인풋 컴포넌트
 *
 * @param {string} label - 필드 라벨
 * @param {string} error - 에러 메시지 (있으면 빨간 테두리 + 하단 표시)
 * @param {string} helperText - 에러가 없을 때 보여줄 보조 설명
 * @param {{text: string, available: boolean}} suffix - 아이디 중복확인 등 우측 표시용
 */
function Input({ label, error, helperText, suffix, id, ...rest }) {
  const inputId = id || rest.name;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.inputWrap}>
        <input
          id={inputId}
          className={`${styles.input} ${error ? styles.hasError : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {suffix && (
          <span
            className={`${styles.suffix} ${
              suffix.available
                ? styles.suffixAvailable
                : styles.suffixUnavailable
            }`}
          >
            {suffix.text}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.errorText}>
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className={styles.helperText}>{helperText}</p>
      )}
    </div>
  );
}

export default Input;
