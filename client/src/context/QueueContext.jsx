import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import axios from 'axios';
import { API_BASE } from '../config/env';
import getAuthConfig from '../functions/getAuthConfig';

/**
 * QueueContext
 * ─────────────────────────────────────────────────────────────────────────
 * Maintains ONE global SSE connection for the entire app lifetime.
 * Any component can:
 *   1. Read  queueStatuses  – { [request_number]: 'PENDING'|'PROCESSING' }
 *   2. Call  subscribeCompleted(fn) / subscribeCompleted  to register a
 *      listener that fires on queue:completed / queue:failed events.
 *      The listener is automatically unregistered when the caller unmounts.
 *
 * This replaces the per-mount SSE that useQueueStatus previously opened
 * inside Characters.jsx, which caused:
 *   – Multiple connections when navigating back to /characters
 *   – Toasts showing on Dashboard/Upload because an old SSE ref was still live
 */

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [queueStatuses, setQueueStatuses] = useState({});

  // Sets of listener functions registered by mounted components
  const completedListeners = useRef(new Set());
  const failedListeners    = useRef(new Set());

  // ── Helper: update queueStatuses map ────────────────────────────────────
  const applyUpdate = useCallback((request_number, status) => {
    const key = String(request_number);
    setQueueStatuses((prev) => {
      if (status === 'COMPLETED' || status === 'FAILED') {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      if (prev[key] === status) return prev;
      return { ...prev, [key]: status };
    });
  }, []);

  // ── Initial snapshot ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchSnapshot = async () => {
      try {
        const res = await axios.get(`${API_BASE}/queueStatus`, getAuthConfig());
        if (cancelled) return;
        const map = {};
        for (const item of res.data || []) {
          map[String(item.request_no)] = item.status;
        }
        setQueueStatuses(map);
      } catch (err) {
        console.warn('[QueueContext] Snapshot fetch failed:', err.message);
      }
    };
    fetchSnapshot();
    return () => { cancelled = true; };
  }, []);

  // ── Single global SSE connection ─────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const url = `${API_BASE}/queueStream?token=${encodeURIComponent(token)}`;
    let es;
    let reconnectTimer = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      es = new EventSource(url);

      const handleStatusUpdate = (e) => {
        try {
          const data = JSON.parse(e.data);
          applyUpdate(data.request_number, data.status);
        } catch (err) {
          console.error('[QueueContext] SSE parse error:', err);
        }
      };

      const handleCompleted = (e) => {
        try {
          const data = JSON.parse(e.data);
          applyUpdate(data.request_number, 'COMPLETED');
          // Notify only currently-registered listeners (mounted components)
          completedListeners.current.forEach((fn) => fn(data));
        } catch (err) {
          console.error('[QueueContext] SSE completed parse error:', err);
        }
      };

      const handleFailed = (e) => {
        try {
          const data = JSON.parse(e.data);
          applyUpdate(data.request_number, 'FAILED');
          // Notify only currently-registered listeners (mounted components)
          failedListeners.current.forEach((fn) => fn(data));
        } catch (err) {
          console.error('[QueueContext] SSE failed parse error:', err);
        }
      };

      es.addEventListener('queue:added',      handleStatusUpdate);
      es.addEventListener('queue:processing', handleStatusUpdate);
      es.addEventListener('queue:completed',  handleCompleted);
      es.addEventListener('queue:failed',     handleFailed);

      es.onerror = () => {
        if (destroyed) return;
        console.warn('[QueueContext] SSE disconnected — reconnecting in 5 s…');
        es.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }, [applyUpdate]);

  // ── Public API ───────────────────────────────────────────────────────────
  /**
   * Register a listener for queue:completed events.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  const subscribeCompleted = useCallback((fn) => {
    completedListeners.current.add(fn);
    return () => completedListeners.current.delete(fn);
  }, []);

  /**
   * Register a listener for queue:failed events.
   * Returns an unsubscribe function — call it in useEffect cleanup.
   */
  const subscribeFailed = useCallback((fn) => {
    failedListeners.current.add(fn);
    return () => failedListeners.current.delete(fn);
  }, []);

  return (
    <QueueContext.Provider
      value={{ queueStatuses, subscribeCompleted, subscribeFailed }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used inside <QueueProvider>');
  return ctx;
}
