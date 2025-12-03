/**
 * useGameState hook
 * Manages game state with polling updates
 */

import { useState, useEffect, useCallback } from 'react';
import type { GameState } from '@/types/game';
import { getPlayerIdHeader } from '@/lib/auth/identity';

const POLL_INTERVAL = 3000; // 3 seconds

interface UseGameStateResult {
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGameState(gameId: string | null): UseGameStateResult {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameState = useCallback(async () => {
    if (!gameId) {
      setGameState(null);
      setLoading(false);
      return;
    }

    try {
      const headers = getPlayerIdHeader();
      const response = await fetch(`/api/games/${gameId}`, { headers });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch game state');
      }

      const { data } = await response.json();
      setGameState(data);
      setError(null);
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
    loading,
    error,
    refetch: fetchGameState,
  };
}

