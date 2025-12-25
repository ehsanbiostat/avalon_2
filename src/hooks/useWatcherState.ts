/**
 * useWatcherState hook
 * Feature 015: Manages watcher game state with polling updates
 *
 * Similar to useGameState but:
 * - Uses /api/watch/[gameId] endpoint
 * - Returns WatcherGameState (neutral observer view)
 * - No player-specific state (my_vote, am_team_member, etc.)
 * - Auto-rejoins if session expires (browser tab throttling, etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WatcherGameState, UseWatcherStateResult } from '@/types/watcher';
import { WATCHER_POLL_INTERVAL_MS } from '@/types/watcher';
import { getPlayerId } from '@/lib/utils/player-id';

/**
 * Auto-rejoin as watcher when session expires
 */
async function rejoinAsWatcher(gameId: string, playerId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/watch/${gameId}/join`, {
      method: 'POST',
      headers: { 'X-Player-ID': playerId },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Hook for managing watcher game state
 *
 * @param gameId - The game ID to watch
 * @returns Watcher state, loading flag, error message, and refetch function
 */
export function useWatcherState(gameId: string | null): UseWatcherStateResult {
  const [gameState, setGameState] = useState<WatcherGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track rejoin attempts to avoid infinite loops
  const rejoinAttemptRef = useRef(false);

  const fetchGameState = useCallback(async () => {
    if (!gameId) {
      setGameState(null);
      setLoading(false);
      return;
    }

    try {
      const playerId = getPlayerId();
      const response = await fetch(`/api/watch/${gameId}`, {
        headers: { 'X-Player-ID': playerId },
      });

      if (!isMountedRef.current) return;

      if (!response.ok) {
        const data = await response.json();
        const errorCode = data.error?.code;

        // Handle session expiration by auto-rejoining
        if (errorCode === 'SESSION_EXPIRED' && !rejoinAttemptRef.current) {
          rejoinAttemptRef.current = true;
          const rejoined = await rejoinAsWatcher(gameId, playerId);
          rejoinAttemptRef.current = false;

          if (rejoined && isMountedRef.current) {
            // Retry fetch after successful rejoin
            const retryResponse = await fetch(`/api/watch/${gameId}`, {
              headers: { 'X-Player-ID': playerId },
            });
            if (retryResponse.ok && isMountedRef.current) {
              const retryData = await retryResponse.json();
              setGameState(retryData.data);
              setError(null);
              setLoading(false);
              return;
            }
          }
        }

        const errorMessage = data.error?.message || 'Failed to fetch game state';
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      setGameState(responseData.data);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [gameId]);

  // Initial fetch and polling setup
  useEffect(() => {
    isMountedRef.current = true;

    fetchGameState();

    // Poll at same interval as players (3 seconds)
    const interval = setInterval(fetchGameState, WATCHER_POLL_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchGameState]);

  return {
    gameState,
    loading,
    error,
    refetch: fetchGameState,
  };
}
