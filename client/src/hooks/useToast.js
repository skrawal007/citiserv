import { useState, useCallback, useRef } from 'react';

let toastId = 0;

/**
 * useToast
 * ────────
 * Returns { toasts, addToast, removeToast }
 *
 * addToast({ title, message, type, duration })
 *   type: 'success' | 'error' | 'info' | 'warning'
 *   duration: ms before auto-dismiss (default 5000)
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const addToast = useCallback(
    ({ title = '', message = '', type = 'success', duration = 5000 }) => {
      const id = ++toastId;
      setToasts((prev) => [{ id, title, message, type }, ...prev]);

      if (duration > 0) {
        timers.current[id] = setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast],
  );

  return { toasts, addToast, removeToast };
}
