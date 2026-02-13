/**
 * Lightweight pub/sub for stats invalidation.
 *
 * Emit `statsChanged` after game completion so that all
 * `useUserStats` consumers (including NotificationWrapper)
 * refresh reactively without polling.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to stats-changed events. Returns an unsubscribe function. */
export function onStatsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify all subscribers that stats have changed (e.g. after game completion). */
export function emitStatsChanged(): void {
  listeners.forEach((fn) => fn());
}
