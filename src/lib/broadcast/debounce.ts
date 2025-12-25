/**
 * Broadcast Debounce Utility
 * Feature 016: Real-Time Broadcast Updates
 *
 * Implements FR-010: System MUST debounce rapid broadcasts to prevent
 * message flooding (minimum 50ms between broadcasts).
 *
 * Uses last-write-wins strategy within the debounce window.
 */

import { BROADCAST_DEBOUNCE_MS } from '@/types/broadcast';

// ============================================
// DEBOUNCE STATE
// ============================================

/**
 * Track pending broadcasts per game channel
 * Key format: `${gameId}:${eventType}`
 */
const pendingBroadcasts = new Map<
  string,
  {
    timeoutId: ReturnType<typeof setTimeout>;
    payload: unknown;
    resolve: () => void;
    reject: (error: Error) => void;
  }
>();

/**
 * Track last broadcast timestamp per key
 */
const lastBroadcastTime = new Map<string, number>();

// ============================================
// DEBOUNCE FUNCTIONS
// ============================================

/**
 * Generate a unique key for debouncing
 */
function getDebounceKey(gameId: string, eventType: string): string {
  return `${gameId}:${eventType}`;
}

/**
 * Debounced broadcast executor
 *
 * If called multiple times within BROADCAST_DEBOUNCE_MS window for the
 * same game and event type, only the last call's payload will be broadcast.
 *
 * @param gameId - The game ID
 * @param eventType - The broadcast event type
 * @param broadcastFn - The actual broadcast function to call
 * @returns Promise that resolves when broadcast is sent (or debounced)
 */
export async function debouncedBroadcast<T>(
  gameId: string,
  eventType: string,
  payload: T,
  broadcastFn: (payload: T) => Promise<void>
): Promise<void> {
  const key = getDebounceKey(gameId, eventType);
  const now = Date.now();
  const lastTime = lastBroadcastTime.get(key) || 0;
  const timeSinceLastBroadcast = now - lastTime;

  // If enough time has passed, broadcast immediately
  if (timeSinceLastBroadcast >= BROADCAST_DEBOUNCE_MS) {
    // Cancel any pending broadcast for this key
    const pending = pendingBroadcasts.get(key);
    if (pending) {
      clearTimeout(pending.timeoutId);
      pendingBroadcasts.delete(key);
      // Resolve the pending promise (it will be superseded)
      pending.resolve();
    }

    // Broadcast immediately
    lastBroadcastTime.set(key, now);
    await broadcastFn(payload);
    return;
  }

  // Otherwise, schedule or update pending broadcast
  return new Promise<void>((resolve, reject) => {
    // Cancel existing pending broadcast for this key
    const existing = pendingBroadcasts.get(key);
    if (existing) {
      clearTimeout(existing.timeoutId);
      // Resolve the previous promise (it's being superseded by this one)
      existing.resolve();
    }

    // Calculate delay to reach minimum interval
    const delay = BROADCAST_DEBOUNCE_MS - timeSinceLastBroadcast;

    // Schedule new broadcast
    const timeoutId = setTimeout(async () => {
      pendingBroadcasts.delete(key);
      lastBroadcastTime.set(key, Date.now());

      try {
        await broadcastFn(payload);
        resolve();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }, delay);

    // Store pending broadcast
    pendingBroadcasts.set(key, {
      timeoutId,
      payload,
      resolve,
      reject,
    });
  });
}

// ============================================
// CLEANUP FUNCTIONS
// ============================================

/**
 * Cancel all pending broadcasts for a game
 * Call this when a game ends or channel is destroyed
 */
export function cancelPendingBroadcasts(gameId: string): void {
  const keysToDelete: string[] = [];

  pendingBroadcasts.forEach((pending, key) => {
    if (key.startsWith(`${gameId}:`)) {
      clearTimeout(pending.timeoutId);
      pending.resolve(); // Resolve without broadcasting
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => {
    pendingBroadcasts.delete(key);
    lastBroadcastTime.delete(key);
  });
}

/**
 * Clear all debounce state
 * Primarily for testing
 */
export function clearAllDebounceState(): void {
  pendingBroadcasts.forEach((pending) => {
    clearTimeout(pending.timeoutId);
    pending.resolve();
  });
  pendingBroadcasts.clear();
  lastBroadcastTime.clear();
}

// ============================================
// STATISTICS (for debugging)
// ============================================

/**
 * Get count of pending broadcasts
 */
export function getPendingBroadcastCount(): number {
  return pendingBroadcasts.size;
}

/**
 * Check if there are pending broadcasts for a game
 */
export function hasPendingBroadcasts(gameId: string): boolean {
  for (const key of pendingBroadcasts.keys()) {
    if (key.startsWith(`${gameId}:`)) {
      return true;
    }
  }
  return false;
}
