/**
 * Watcher Session Management
 * Feature 015: In-memory session tracking for spectators
 *
 * CRITICAL DESIGN DECISIONS:
 * - All data is ephemeral (in-memory Map) per NFR-004, NFR-006
 * - No database writes for watcher operations per SC-009, SC-010
 * - Server restart clears all sessions (watchers simply rejoin)
 * - Complete isolation from game state per Critical Isolation Constraints
 */

import type { WatcherInfo, WatcherSessionStore } from '@/types/watcher';
import {
  MAX_WATCHERS_PER_GAME,
  WATCHER_TIMEOUT_SECONDS,
} from '@/types/watcher';

// ============================================
// IN-MEMORY STORAGE
// ============================================

/**
 * Global in-memory storage for all watcher sessions
 * Key: gameId
 * Value: Map<playerId, WatcherInfo>
 *
 * CRITICAL: This is NOT persisted. Server restart clears all sessions.
 * This is intentional - watchers simply rejoin after restart.
 */
const watcherSessions: WatcherSessionStore = new Map();

// ============================================
// SESSION MANAGEMENT FUNCTIONS
// ============================================

/**
 * Add a watcher to a game session
 * Returns true if successfully added, false if limit reached
 *
 * @param gameId - The game to watch
 * @param playerId - The watcher's player ID
 * @param nickname - The watcher's display nickname
 */
export function addWatcher(
  gameId: string,
  playerId: string,
  nickname: string
): boolean {
  // Clean up stale watchers first
  cleanupStaleWatchers(gameId);

  // Get or create session map for this game
  let gameWatchers = watcherSessions.get(gameId);
  if (!gameWatchers) {
    gameWatchers = new Map();
    watcherSessions.set(gameId, gameWatchers);
  }

  // Check if this player is already watching (rejoin case)
  if (gameWatchers.has(playerId)) {
    // Update existing session
    const existing = gameWatchers.get(playerId)!;
    existing.lastSeen = Date.now();
    existing.nickname = nickname; // Update nickname in case it changed
    return true;
  }

  // Check watcher limit
  if (gameWatchers.size >= MAX_WATCHERS_PER_GAME) {
    return false;
  }

  // Add new watcher
  const now = Date.now();
  gameWatchers.set(playerId, {
    playerId,
    nickname,
    joinedAt: now,
    lastSeen: now,
  });

  return true;
}

/**
 * Remove a watcher from a game session
 *
 * @param gameId - The game being watched
 * @param playerId - The watcher's player ID
 */
export function removeWatcher(gameId: string, playerId: string): boolean {
  const gameWatchers = watcherSessions.get(gameId);
  if (!gameWatchers) {
    return false;
  }

  const removed = gameWatchers.delete(playerId);

  // Clean up empty game sessions
  if (gameWatchers.size === 0) {
    watcherSessions.delete(gameId);
  }

  return removed;
}

/**
 * Get the current watcher count for a game
 *
 * @param gameId - The game to check
 */
export function getWatcherCount(gameId: string): number {
  // Clean up stale watchers first
  cleanupStaleWatchers(gameId);

  const gameWatchers = watcherSessions.get(gameId);
  return gameWatchers?.size ?? 0;
}

/**
 * Check if the watcher limit has been reached for a game
 *
 * @param gameId - The game to check
 */
export function isWatcherLimitReached(gameId: string): boolean {
  return getWatcherCount(gameId) >= MAX_WATCHERS_PER_GAME;
}

/**
 * Update a watcher's last seen timestamp (for timeout tracking)
 * Called on each poll request to keep session alive
 *
 * @param gameId - The game being watched
 * @param playerId - The watcher's player ID
 */
export function updateWatcherLastSeen(
  gameId: string,
  playerId: string
): boolean {
  const gameWatchers = watcherSessions.get(gameId);
  if (!gameWatchers) {
    return false;
  }

  const watcher = gameWatchers.get(playerId);
  if (!watcher) {
    return false;
  }

  watcher.lastSeen = Date.now();
  return true;
}

/**
 * Clean up stale watcher sessions (30-second timeout)
 * Called lazily on watcher count checks and add operations
 *
 * @param gameId - The game to clean up
 */
export function cleanupStaleWatchers(gameId: string): number {
  const gameWatchers = watcherSessions.get(gameId);
  if (!gameWatchers) {
    return 0;
  }

  const now = Date.now();
  const timeoutMs = WATCHER_TIMEOUT_SECONDS * 1000;
  let removedCount = 0;

  for (const [playerId, watcher] of gameWatchers) {
    if (now - watcher.lastSeen > timeoutMs) {
      gameWatchers.delete(playerId);
      removedCount++;
    }
  }

  // Clean up empty game sessions
  if (gameWatchers.size === 0) {
    watcherSessions.delete(gameId);
  }

  return removedCount;
}

/**
 * Check if a player is currently a watcher for a game
 *
 * @param gameId - The game to check
 * @param playerId - The player ID to check
 */
export function isWatcher(gameId: string, playerId: string): boolean {
  // Clean up stale watchers first
  cleanupStaleWatchers(gameId);

  const gameWatchers = watcherSessions.get(gameId);
  if (!gameWatchers) {
    return false;
  }

  return gameWatchers.has(playerId);
}

/**
 * Get watcher info for a specific player
 *
 * @param gameId - The game being watched
 * @param playerId - The watcher's player ID
 */
export function getWatcher(
  gameId: string,
  playerId: string
): WatcherInfo | null {
  const gameWatchers = watcherSessions.get(gameId);
  if (!gameWatchers) {
    return null;
  }

  return gameWatchers.get(playerId) ?? null;
}

/**
 * Get all watchers for a game
 * Used for debugging/admin purposes
 *
 * @param gameId - The game to get watchers for
 */
export function getWatchers(gameId: string): WatcherInfo[] {
  // Clean up stale watchers first
  cleanupStaleWatchers(gameId);

  const gameWatchers = watcherSessions.get(gameId);
  if (!gameWatchers) {
    return [];
  }

  return Array.from(gameWatchers.values());
}

/**
 * Clear all watchers for a game
 * Called when game ends or room is deleted
 *
 * @param gameId - The game to clear watchers for
 */
export function clearGameWatchers(gameId: string): void {
  watcherSessions.delete(gameId);
}

/**
 * Get the total number of active watcher sessions across all games
 * Used for monitoring/debugging
 */
export function getTotalWatcherCount(): number {
  let total = 0;
  for (const [gameId] of watcherSessions) {
    total += getWatcherCount(gameId);
  }
  return total;
}

/**
 * Get the number of games with active watchers
 * Used for monitoring/debugging
 */
export function getActiveWatchedGamesCount(): number {
  // Trigger cleanup for all games
  for (const [gameId] of watcherSessions) {
    cleanupStaleWatchers(gameId);
  }
  return watcherSessions.size;
}
