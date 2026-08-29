import React, { useEffect, useRef } from 'react';
import './Toast.css';

/**
 * ToastContainer
 * ──────────────
 * Renders all active toasts in a fixed top-right stack.
 *
 * Props:
 *   toasts      — array from useToast()
 *   removeToast — function from useToast()
 */
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

/**
 * Single Toast item.
 */
function Toast({ toast, onDismiss }) {
  const { type = 'success', title, message } = toast;
  const ref = useRef(null);

  // Animate in
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.classList.add('toast--visible');
    });
  }, []);

  const ICONS = {
    success: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  return (
    <div ref={ref} className={`toast toast--${type}`} role="alert">
      <div className="toast__icon">{ICONS[type]}</div>
      <div className="toast__body">
        {title && <p className="toast__title">{title}</p>}
        {message && <p className="toast__message">{message}</p>}
      </div>
      <button
        className="toast__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        title="Dismiss"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="toast__progress" />
    </div>
  );
}
