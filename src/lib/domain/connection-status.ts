/**
 * Connection status domain logic
 * Phase 6: Player Recovery & Reconnection
 *
 * Pure functions for computing player connection status
 * from last_activity_at timestamp.
 */

import type { ConnectionStatus } from '@/types/player';

// ============================================
// CONSTANTS
// ============================================

/** Seconds of inactivity before player is marked as disconnected */
export const DISCONNECT_AFTER_SECONDS = 60;

/** Seconds after disconnect before seat can be reclaimed (grace period) */
export const GRACE_PERIOD_SECONDS = 30;

/** Total seconds of inactivity before reclaim is allowed */
export const RECLAIM_AFTER_SECONDS = DISCONNECT_AFTER_SECONDS + GRACE_PERIOD_SECONDS; // 90s

/** Client heartbeat interval in seconds */
export const HEARTBEAT_INTERVAL_SECONDS = 30;

// ============================================
// CONNECTION STATUS
// ============================================

/**
 * Compute connection status from last activity timestamp
 *
 * @param lastActivityAt - ISO timestamp of last heartbeat/activity
 * @returns ConnectionStatus object with computed fields
 *
 * @example
 * const status = getConnectionStatus('2025-12-05T10:00:00Z');
 * // If current time is 10:00:30 → is_connected: true
 * // If current time is 10:01:30 → is_connected: false, can_be_reclaimed: false
 * // If current time is 10:02:00 → is_connected: false, can_be_reclaimed: true
 */
export function getConnectionStatus(lastActivityAt: string | Date): ConnectionStatus {
  const lastActivity = typeof lastActivityAt === 'string'
    ? new Date(lastActivityAt)
    : lastActivityAt;

  const now = new Date();
  const secondsSince = Math.floor((now.getTime() - lastActivity.getTime()) / 1000);

  const isConnected = secondsSince < DISCONNECT_AFTER_SECONDS;
  const canBeReclaimed = secondsSince >= RECLAIM_AFTER_SECONDS;

  // Grace period remaining: only applicable if disconnected but not yet reclaimable
  let gracePeriodRemaining: number | null = null;
  if (!isConnected && !canBeReclaimed) {
    gracePeriodRemaining = Math.max(0, RECLAIM_AFTER_SECONDS - secondsSince);
  }

  return {
    is_connected: isConnected,
    seconds_since_activity: Math.max(0, secondsSince),
    can_be_reclaimed: canBeReclaimed,
    grace_period_remaining: gracePeriodRemaining,
  };
}

// ============================================
// RECLAIM ELIGIBILITY
// ============================================

/**
 * Check if a player's seat can be reclaimed based on their last activity
 *
 * @param lastActivityAt - ISO timestamp of last heartbeat/activity
 * @returns true if the seat can be reclaimed
 */
export function canReclaimSeat(lastActivityAt: string | Date): boolean {
  const status = getConnectionStatus(lastActivityAt);
  return status.can_be_reclaimed;
}

/**
 * Check if a player is currently connected (has recent activity)
 *
 * @param lastActivityAt - ISO timestamp of last heartbeat/activity
 * @returns true if the player is considered connected
 */
export function isPlayerConnected(lastActivityAt: string | Date): boolean {
  const status = getConnectionStatus(lastActivityAt);
  return status.is_connected;
}

/**
 * Get seconds until reclaim is allowed
 *
 * @param lastActivityAt - ISO timestamp of last heartbeat/activity
 * @returns seconds remaining, or 0 if already reclaimable, or null if player is connected
 */
export function getSecondsUntilReclaimable(lastActivityAt: string | Date): number | null {
  const status = getConnectionStatus(lastActivityAt);

  if (status.is_connected) {
    // Player is connected - would need to wait for disconnect + grace
    return null;
  }

  if (status.can_be_reclaimed) {
    return 0;
  }

  return status.grace_period_remaining;
}
