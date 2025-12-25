/**
 * useWatcherState hook
 * Feature 015: Manages watcher game state with polling updates
 * Feature 016: Added real-time broadcast subscription for instant updates
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
import { useBroadcastChannel } from './useBroadcastChannel';
import type {
  DraftUpdatePayload,
  VoteSubmittedPayload,
  ActionSubmittedPayload,
  PhaseTransitionPayload,
  GameOverPayload,
} from '@/types/broadcast';

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

  // Feature 016: Broadcast handlers for real-time updates (same as players)
  const handleDraftUpdate = useCallback((payload: DraftUpdatePayload) => {
    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        draft_team: payload.draft_team,
      };
    });
  }, []);

  const handleVoteSubmitted = useCallback((payload: VoteSubmittedPayload) => {
    setGameState((prev) => {
      if (!prev) return null;
      // Update votes_submitted count and mark the player as voted
      const updatedPlayers = prev.players.map((p) =>
        p.id === payload.player_id ? { ...p, has_voted: true } : p
      );
      return {
        ...prev,
        votes_submitted: payload.votes_count,
        players: updatedPlayers,
      };
    });
  }, []);

  const handleActionSubmitted = useCallback((payload: ActionSubmittedPayload) => {
    setGameState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        actions_submitted: payload.actions_count,
        total_team_members: payload.total_team_members,
      };
    });
  }, []);

  const handlePhaseTransition = useCallback(
    (payload: PhaseTransitionPayload) => {
      // eslint-disable-next-line no-console
      console.log(
        `[Watcher Broadcast] Phase transition: ${payload.previous_phase} → ${payload.phase}`
      );
      // Trigger full refetch to get accurate state for new phase
      fetchGameStateRef.current?.();
    },
    []
  );

  const handleGameOver = useCallback((payload: GameOverPayload) => {
    // eslint-disable-next-line no-console
    console.log(`[Watcher Broadcast] Game over: ${payload.winner} wins (${payload.reason})`);
    // Trigger full refetch to get final state with revealed roles
    fetchGameStateRef.current?.();
  }, []);

  // Store fetchGameState in ref for use in broadcast handlers
  const fetchGameStateRef = useRef<(() => Promise<void>) | null>(null);

  // Feature 016: Subscribe to broadcast channel (same channel as players)
  useBroadcastChannel(gameId, {
    onDraftUpdate: handleDraftUpdate,
    onVoteSubmitted: handleVoteSubmitted,
    onActionSubmitted: handleActionSubmitted,
    onPhaseTransition: handlePhaseTransition,
    onGameOver: handleGameOver,
  });

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

  // Store fetchGameState ref for broadcast handlers
  fetchGameStateRef.current = fetchGameState;

  // Initial fetch and polling setup
  // Note: Polling continues even with broadcast connection (fallback per FR-007)
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
