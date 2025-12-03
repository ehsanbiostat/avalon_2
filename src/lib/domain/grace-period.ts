/**
 * Grace period tracking for disconnected players
 * Handles reconnection windows and automatic removal
 */

import { RECONNECTION_GRACE_PERIOD } from '@/lib/utils/constants';

/**
 * Calculate if a player's grace period has expired
 */
export function isGracePeriodExpired(disconnectedAt: string | null): boolean {
  if (!disconnectedAt) {
    return false;
  }

  const disconnectedTime = new Date(disconnectedAt).getTime();
  const now = Date.now();
  const elapsed = now - disconnectedTime;

  return elapsed > RECONNECTION_GRACE_PERIOD;
}

/**
 * Get remaining grace period time in milliseconds
 */
export function getRemainingGracePeriod(disconnectedAt: string | null): number {
  if (!disconnectedAt) {
    return RECONNECTION_GRACE_PERIOD;
  }

  const disconnectedTime = new Date(disconnectedAt).getTime();
  const now = Date.now();
  const elapsed = now - disconnectedTime;
  const remaining = RECONNECTION_GRACE_PERIOD - elapsed;

  return Math.max(0, remaining);
}

/**
 * Format remaining grace period as human-readable string
 */
export function formatRemainingGracePeriod(disconnectedAt: string | null): string {
  const remaining = getRemainingGracePeriod(disconnectedAt);

  if (remaining <= 0) {
    return 'Expired';
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Check if player should be removed from room
 * Returns true if disconnected and grace period expired
 */
export function shouldRemovePlayer(
  isConnected: boolean,
  disconnectedAt: string | null
): boolean {
  if (isConnected) {
    return false;
  }

  return isGracePeriodExpired(disconnectedAt);
}

/**
 * Get players who should be removed due to expired grace period
 */
export function getExpiredPlayers<T extends { is_connected: boolean; disconnected_at: string | null }>(
  players: T[]
): T[] {
  return players.filter((p) => shouldRemovePlayer(p.is_connected, p.disconnected_at));
}

/**
 * Get players who are still within grace period
 */
export function getDisconnectedWithinGracePeriod<T extends { is_connected: boolean; disconnected_at: string | null }>(
  players: T[]
): T[] {
  return players.filter(
    (p) => !p.is_connected && p.disconnected_at && !isGracePeriodExpired(p.disconnected_at)
  );
}

/**
 * Grace period status for a player
 */
export interface GracePeriodStatus {
  isConnected: boolean;
  isDisconnected: boolean;
  isExpired: boolean;
  remainingMs: number;
  remainingFormatted: string;
}

/**
 * Get grace period status for a player
 */
export function getGracePeriodStatus(
  isConnected: boolean,
  disconnectedAt: string | null
): GracePeriodStatus {
  const isDisconnected = !isConnected;
  const isExpired = isDisconnected && isGracePeriodExpired(disconnectedAt);
  const remainingMs = getRemainingGracePeriod(disconnectedAt);
  const remainingFormatted = formatRemainingGracePeriod(disconnectedAt);

  return {
    isConnected,
    isDisconnected,
    isExpired,
    remainingMs,
    remainingFormatted,
  };
}
