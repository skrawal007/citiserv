import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/env';
import getAuthConfig from '../functions/getAuthConfig';

/**
 * useQueueStatus
 * ──────────────
 * Maintains a live Map<request_number → 'PENDING'|'PROCESSING'> for every
 * request currently in the queue.
 *
 * On mount:
 *   1. Fetches a snapshot of all PENDING/PROCESSING rows from /queueStatus.
 *   2. Opens an SSE connection to /queueStream and listens for four events:
 *        queue:added      → mark as PENDING   (button turns amber)
 *        queue:processing → mark as PROCESSING (button turns blue-pulse)
 *        queue:completed  → remove entry + call onCompleted(data)
 *        queue:failed     → remove entry + call onFailed(data)
 *
 * Props/Options (optional):
 *   onCompleted(data)  — called whenever queue:completed fires.
 *                        data = { request_number, type, status,
 *                                 active_status, pre_Current_Status, per_Current_Status }
 *   onFailed(data)     — called whenever queue:failed fires.
 *
 * Returns: { queueStatuses, isLoading }
 *   queueStatuses — plain object  { [request_number]: 'PENDING'|'PROCESSING' }
 */
export default function useQueueStatus({ onCompleted, onFailed } = {}) {
  const [queueStatuses, setQueueStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const esRef = useRef(null);

  // Keep stable refs to callbacks so we never need to re-subscribe SSE
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef    = useRef(onFailed);
  useEffect(() => { onCompletedRef.current = onCompleted; }, [onCompleted]);
  useEffect(() => { onFailedRef.current    = onFailed;    }, [onFailed]);

  // ── Helper: merge a single status update into state ────────────────────────
  const applyUpdate = useCallback((request_number, status) => {
    const key = String(request_number);
    setQueueStatuses((prev) => {
      // COMPLETED / FAILED → remove from map (button goes back to idle)
      if (status === 'COMPLETED' || status === 'FAILED') {
        if (!(key in prev)) return prev; // no change
        const next = { ...prev };
        delete next[key];
        return next;
      }
      // PENDING / PROCESSING → upsert
      if (prev[key] === status) return prev; // no change
      return { ...prev, [key]: status };
    });
  }, []);

  // ── 1. Initial snapshot fetch ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchSnapshot = async () => {
      try {
        const res = await axios.get(`${API_BASE}/queueStatus`, getAuthConfig());
        if (cancelled) return;

        const map = {};
        for (const item of res.data || []) {
          map[String(item.request_no)] = item.status; // 'PENDING' | 'PROCESSING'
        }
        setQueueStatuses(map);
      } catch (err) {
        console.warn('[useQueueStatus] Failed to fetch initial snapshot:', err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchSnapshot();
    return () => { cancelled = true; };
  }, []);

  // ── 2. SSE subscription ─────────────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) return; // not logged in yet

    // EventSource cannot set custom headers; pass JWT as query param
    const url = `${API_BASE}/queueStream?token=${encodeURIComponent(token)}`;

    let es;
    let reconnectTimer = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

      es = new EventSource(url);
      esRef.current = es;

      // Generic handler used for PENDING / PROCESSING events
      const handleStatusUpdate = (e) => {
        try {
          const data = JSON.parse(e.data);
          applyUpdate(data.request_number, data.status);
        } catch (err) {
          console.error('[useQueueStatus] SSE parse error:', err);
        }
      };

      // Completed — remove from queue map AND fire optional callback
      const handleCompleted = (e) => {
        try {
          const data = JSON.parse(e.data);
          applyUpdate(data.request_number, 'COMPLETED');
          if (typeof onCompletedRef.current === 'function') {
            onCompletedRef.current(data);
          }
        } catch (err) {
          console.error('[useQueueStatus] SSE completed parse error:', err);
        }
      };

      // Failed — remove from queue map AND fire optional callback
      const handleFailed = (e) => {
        try {
          const data = JSON.parse(e.data);
          applyUpdate(data.request_number, 'FAILED');
          if (typeof onFailedRef.current === 'function') {
            onFailedRef.current(data);
          }
        } catch (err) {
          console.error('[useQueueStatus] SSE failed parse error:', err);
        }
      };

      es.addEventListener('queue:added',      handleStatusUpdate);
      es.addEventListener('queue:processing', handleStatusUpdate);
      es.addEventListener('queue:completed',  handleCompleted);
      es.addEventListener('queue:failed',     handleFailed);

      es.onerror = () => {
        if (destroyed) return;
        console.warn('[useQueueStatus] SSE disconnected — reconnecting in 5 s…');
        es.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimer);
      if (es) es.close();
      esRef.current = null;
    };
  }, [applyUpdate]);

  return { queueStatuses, isLoading };
}
