/**
 * useQueueStatus
 * ──────────────
 * Thin wrapper around QueueContext.
 *
 * Returns { queueStatuses } — the live map of
 *   { [request_number]: 'PENDING' | 'PROCESSING' }
 *
 * The SSE connection now lives in QueueContext (one connection for the whole
 * app). This hook no longer opens its own SSE, so navigating between pages
 * never creates duplicate connections or fires stale callbacks.
 *
 * Legacy usage (just reading statuses):
 *   const { queueStatuses } = useQueueStatus();
 *
 * To receive completion/failure events, use QueueContext directly:
 *   import { useQueue } from '../context/QueueContext';
 *   const { subscribeCompleted, subscribeFailed } = useQueue();
 */
import { useQueue } from '../context/QueueContext';

export default function useQueueStatus() {
  const { queueStatuses } = useQueue();
  return { queueStatuses, isLoading: false };
}
