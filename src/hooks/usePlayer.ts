'use client';

/**
 * Player identity hook
 * Manages player ID and nickname state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getPlayerId,
  getStoredNickname,
  setStoredNickname,
  hasPlayerId,
} from '@/lib/utils/player-id';
import type { PlayerIdentity, RegisterPlayerResponse } from '@/types/player';

interface UsePlayerReturn {
  /** Player ID from localStorage */
  playerId: string | null;
  /** Current nickname (from localStorage or server) */
  nickname: string | null;
  /** Whether the player is registered with the server */
  isRegistered: boolean;
  /** Whether loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Register or update player with server */
  register: (nickname: string) => Promise<RegisterPlayerResponse | null>;
  /** Update nickname */
  updateNickname: (nickname: string) => void;
}

/**
 * Hook for managing player identity
 */
export function usePlayer(): UsePlayerReturn {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (hasPlayerId()) {
        const id = getPlayerId();
        const storedNickname = getStoredNickname();
        setPlayerId(id);
        setNickname(storedNickname);
        // If we have a stored nickname, assume registered
        setIsRegistered(!!storedNickname);
      } else {
        // Generate new player ID
        const id = getPlayerId();
        setPlayerId(id);
      }
    } catch (err) {
      console.error('Error initializing player:', err);
      setError('Failed to initialize player identity');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register or update player with server
   */
  const register = useCallback(async (newNickname: string): Promise<RegisterPlayerResponse | null> => {
    if (!playerId) {
      setError('Player ID not initialized');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Player-ID': playerId,
        },
        body: JSON.stringify({
          player_id: playerId,
          nickname: newNickname,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to register');
      }

      const { data } = await response.json();

      // Store nickname locally
      setStoredNickname(newNickname);
      setNickname(newNickname);
      setIsRegistered(true);

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  /**
   * Update nickname (local only, call register to sync with server)
   */
  const updateNickname = useCallback((newNickname: string) => {
    setStoredNickname(newNickname);
    setNickname(newNickname);
  }, []);

  return {
    playerId,
    nickname,
    isRegistered,
    isLoading,
    error,
    register,
    updateNickname,
  };
}

/**
 * Get player identity synchronously (for API calls)
 * Only use this after initial load
 */
export function getPlayerIdentitySync(): PlayerIdentity {
  return {
    playerId: getPlayerId(),
    nickname: getStoredNickname(),
    registeredAt: null, // Would need to track this if important
  };
}
