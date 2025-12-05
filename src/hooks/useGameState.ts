/**
 * useGameState hook
 * Manages game state with polling updates
 * T073: Updated for Phase 6 to detect session takeover
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState } from '@/types/game';
import { getPlayerId } from '@/lib/utils/player-id';

const POLL_INTERVAL = 3000; // 3 seconds

interface UseGameStateResult {
  gameState: GameState | null;
  currentPlayerId: string | null;
  playerRole: 'good' | 'evil';
  specialRole: string | null;
  roomCode: string | null;
  loading: boolean;
  error: string | null;
  /** T073: Session was taken over by another device */
  sessionTakenOver: boolean;
  refetch: () => Promise<void>;
}

export function useGameState(gameId: string | null): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<'good' | 'evil'>('good');
  const [specialRole, setSpecialRole] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // T073: Session takeover detection
  const [sessionTakenOver, setSessionTakenOver] = useState(false);
  const hadGameAccessRef = useRef<boolean>(false);

  const fetchGameState = useCallback(async () => {
    if (!gameId) {
      setGameState(null);
      setCurrentPlayerId(null);
      setLoading(false);
      return;
    }

    try {
      const playerId = getPlayerId();
      const response = await fetch(`/api/games/${gameId}`, {
        headers: { 'X-Player-ID': playerId },
      });

      if (!response.ok) {
        const data = await response.json();
        const errorCode = data.error?.code;

        // T073: Detect session takeover - if we previously had access but now don't
        if (hadGameAccessRef.current &&
            (errorCode === 'NOT_IN_GAME' || response.status === 403)) {
          setSessionTakenOver(true);
          return;
        }

        throw new Error(data.error?.message || 'Failed to fetch game state');
      }

      const responseData = await response.json();
      setGameState(responseData.data);
      setCurrentPlayerId(responseData.current_player_id);
      setPlayerRole(responseData.player_role || 'good');
      setSpecialRole(responseData.special_role || null);
      setRoomCode(responseData.room_code || null);
      setError(null);
      // Mark that we had successful access
      hadGameAccessRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchGameState();

    const interval = setInterval(fetchGameState, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  return {
    gameState,
    currentPlayerId,
    playerRole,
    specialRole,
    roomCode,
    loading,
    error,
    sessionTakenOver,
    refetch: fetchGameState,
  };
}
