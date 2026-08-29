import { useEffect, useRef } from 'react';
import { useQueue } from '../context/QueueContext';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './Toast';

/**
 * GlobalToast
 * ──────────────────────────────────────────────────────────────────────
 * Renders ONE toast stack for the entire app.
 * Mounted once inside App.jsx — outside of any page component — so
 * toasts fire regardless of which route the user is currently on.
 *
 * Shows a notification whenever:
 *   queue:completed  →  green/blue/red toast with request number + new status
 *   queue:failed     →  red toast with error message
 */
export default function GlobalToast() {
  const { toasts, addToast, removeToast } = useToast();
  const { subscribeCompleted, subscribeFailed } = useQueue();

  // Stable refs so the subscription effect runs exactly once ([] deps)
  const completedRef = useRef(null);
  const failedRef    = useRef(null);

  // Update refs on every render so the latest addToast closure is always used
  completedRef.current = (data) => {
    const reqNum      = String(data.request_number || '');
    const preStatus   = data.pre_Current_Status || null;
    const activeStatus = data.active_status || null;
    const requestType = data.type || '';

    const statusLabel = preStatus || activeStatus || 'Updated';

    addToast({
      type: statusLabel === 'APPROVED' ? 'success'
           : statusLabel === 'REJECTED' ? 'error'
           : 'info',
      title:   `${requestType} : ${reqNum}`,
      message: `New Status: ${statusLabel}`,
      duration: 6000,
    });
  };

  failedRef.current = (data) => {
    const reqNum = String(data.request_number || '');
    addToast({
      type:    'error',
      title:   `✕ Request ${reqNum}`,
      message: data.message || 'Update Failed',
      duration: 7000,
    });
  };

  // Subscribe once on mount — stays active for the entire app lifetime
  useEffect(() => {
    const onCompleted = (data) => completedRef.current?.(data);
    const onFailed    = (data) => failedRef.current?.(data);

    const unsubComplete = subscribeCompleted(onCompleted);
    const unsubFailed   = subscribeFailed(onFailed);

    return () => {
      unsubComplete();
      unsubFailed();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — subscribe once for the whole app

  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
}
