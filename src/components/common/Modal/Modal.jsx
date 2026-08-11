import styles from './Modal.module.css';

function Modal({ open, onClose, title, showCloseButton = true, children }) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        {(title || showCloseButton) && (
          <div className={styles.head}>
            {title && <p>{title}</p>}
            {showCloseButton && (
              <button type="button" onClick={onClose} aria-label="닫기">
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default Modal;
