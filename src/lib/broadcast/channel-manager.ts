/**
 * Broadcast Channel Manager
 * Feature 016: Real-Time Broadcast Updates
 *
 * Manages game broadcast channel lifecycle.
 *
 * Note: In a serverless environment (Vercel), server-side channel state
 * is ephemeral. This module provides utilities for channel naming and
 * cleanup coordination. Supabase handles actual channel lifecycle.
 *
 * FR-004: Create channel on game start (team_building), destroy on game_over
 * or after 2 hours of inactivity.
 */

import {
  getChannelName,
  CHANNEL_INACTIVITY_TIMEOUT_MS,
} from '@/types/broadcast';
import { cancelPendingBroadcasts } from './debounce';

// ============================================
// CHANNEL LIFECYCLE TRACKING
// ============================================

/**
 * Track active games for cleanup coordination
 * Key: gameId, Value: last activity timestamp
 *
 * Note: This state is per-serverless-instance. For distributed cleanup,
 * use database timestamps or external state (Redis, etc.)
 */
const activeGames = new Map<string, { lastActivity: Date; startedAt: Date }>();

// ============================================
// CHANNEL LIFECYCLE FUNCTIONS
// ============================================

/**
 * Mark a game as active (channel created)
 * Called when game phase transitions to team_building
 *
 * @param gameId - The game UUID
 */
export function markGameActive(gameId: string): void {
  const now = new Date();
  activeGames.set(gameId, {
    lastActivity: now,
    startedAt: now,
  });
  // eslint-disable-next-line no-console
  console.log(`[Broadcast] Channel active for game:${gameId}`);
}

/**
 * Update last activity for a game
 * Called after each broadcast
 *
 * @param gameId - The game UUID
 */
export function updateGameActivity(gameId: string): void {
  const existing = activeGames.get(gameId);
  if (existing) {
    existing.lastActivity = new Date();
  } else {
    // Auto-create if not tracked (might have been created on different instance)
    markGameActive(gameId);
  }
}

/**
 * Mark a game as ended (channel should be destroyed)
 * Called when game phase transitions to game_over
 *
 * @param gameId - The game UUID
 */
export function markGameEnded(gameId: string): void {
  activeGames.delete(gameId);
  cancelPendingBroadcasts(gameId);
  // eslint-disable-next-line no-console
  console.log(`[Broadcast] Channel ended for game:${gameId}`);
}

/**
 * Check if a game channel is considered active
 *
 * @param gameId - The game UUID
 * @returns true if game is tracked as active
 */
export function isGameActive(gameId: string): boolean {
  return activeGames.has(gameId);
}

/**
 * Get channel name for a game
 * Convenience wrapper for consistent channel naming
 *
 * @param gameId - The game UUID
 * @returns The channel name (format: "game:{gameId}")
 */
export function getGameChannelName(gameId: string): string {
  return getChannelName(gameId);
}

// ============================================
// INACTIVITY CLEANUP
// ============================================

/**
 * Check for stale games that have exceeded inactivity timeout
 * Call periodically (e.g., via cron job or scheduled function)
 *
 * @returns Array of gameIds that were cleaned up
 */
export function cleanupInactiveGames(): string[] {
  const now = Date.now();
  const cleanedUp: string[] = [];

  activeGames.forEach((data, gameId) => {
    const inactiveMs = now - data.lastActivity.getTime();
    if (inactiveMs >= CHANNEL_INACTIVITY_TIMEOUT_MS) {
      markGameEnded(gameId);
      cleanedUp.push(gameId);
      // eslint-disable-next-line no-console
      console.log(
        `[Broadcast] Cleaned up inactive channel for game:${gameId} ` +
          `(inactive for ${Math.round(inactiveMs / 1000 / 60)} minutes)`
      );
    }
  });

  return cleanedUp;
}

/**
 * Get statistics about active channels
 * Useful for monitoring and debugging
 */
export function getChannelStats(): {
  activeCount: number;
  games: Array<{
    gameId: string;
    startedAt: Date;
    lastActivity: Date;
    inactiveMinutes: number;
  }>;
} {
  const now = Date.now();
  const games: Array<{
    gameId: string;
    startedAt: Date;
    lastActivity: Date;
    inactiveMinutes: number;
  }> = [];

  activeGames.forEach((data, gameId) => {
    games.push({
      gameId,
      startedAt: data.startedAt,
      lastActivity: data.lastActivity,
      inactiveMinutes: Math.round(
        (now - data.lastActivity.getTime()) / 1000 / 60
      ),
    });
  });

  return {
    activeCount: activeGames.size,
    games,
  };
}

// ============================================
// TESTING UTILITIES
// ============================================

/**
 * Clear all tracked games
 * For testing purposes only
 */
export function clearAllGames(): void {
  activeGames.forEach((_, gameId) => {
    cancelPendingBroadcasts(gameId);
  });
  activeGames.clear();
}
