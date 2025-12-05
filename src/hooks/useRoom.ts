'use client';

/**
 * Room data hook with polling-based state synchronization
 * Provides centralized state sync for all players in a room
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPlayerId } from '@/lib/utils/player-id';
import type { RoomDetails, RoomPlayerInfo } from '@/types/room';

// Polling interval in milliseconds (3 seconds for near-real-time feel)
const POLL_INTERVAL_MS = 3000;

interface UseRoomReturn {
  /** Room details including players */
  room: RoomDetails | null;
  /** Whether loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether polling is active */
  isConnected: boolean;
  /** T036: Roles in play for this game */
  rolesInPlay: string[];
  /** T036: Lady of the Lake holder info */
  ladyOfLakeHolder: { id: string; nickname: string } | null;
  /** T072: Session was taken over by another device */
  sessionTakenOver: boolean;
  /** Refresh room data */
  refresh: () => Promise<void>;
  /** Leave the room */
  leave: () => Promise<boolean>;
}

/**
 * Hook for managing room data with fast polling
 * Centralizes state synchronization for all room events:
 * - Player joins/leaves
 * - Role distribution
 * - Role confirmation
 * - Game start
 */
export function useRoom(roomCode: string): UseRoomReturn {
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [rolesInPlay, setRolesInPlay] = useState<string[]>([]);
  const [ladyOfLakeHolder, setLadyOfLakeHolder] = useState<{ id: string; nickname: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  // T072: Session takeover detection
  const [sessionTakenOver, setSessionTakenOver] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const hadRoomAccessRef = useRef<boolean>(false);

  /**
   * Fetch room data from API (with deduplication)
   */
  const fetchRoom = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current && !force) {
      return null;
    }

    // Throttle fetches (min 1 second apart unless forced)
    const now = Date.now();
    if (!force && now - lastFetchRef.current < 1000) {
      return null;
    }

    isFetchingRef.current = true;
    lastFetchRef.current = now;

    try {
      const playerId = getPlayerId();
      const response = await fetch(`/api/rooms/${roomCode}`, {
        headers: {
          'X-Player-ID': playerId,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = await response.json();
        const errorCode = data.error?.code;

        // T072: Detect session takeover - if we previously had access but now don't
        if (hadRoomAccessRef.current &&
            (errorCode === 'NOT_IN_ROOM' || errorCode === 'NOT_ROOM_MEMBER' || response.status === 403)) {
          setSessionTakenOver(true);
          return null;
        }

        throw new Error(data.error?.message || 'Failed to fetch room');
      }

      const { data } = await response.json();
      setRoom(data);
      // T036: Extract roles in play and Lady of Lake holder from response
      setRolesInPlay(data.roles_in_play || []);
      setLadyOfLakeHolder(data.lady_of_lake_holder || null);
      setError(null);
      setIsConnected(true);
      // Mark that we had successful access
      hadRoomAccessRef.current = true;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch room');
      setIsConnected(false);
      return null;
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [roomCode]);

  /**
   * Leave the room
   */
  const leave = useCallback(async (): Promise<boolean> => {
    try {
      const playerId = getPlayerId();
      const response = await fetch(`/api/rooms/${roomCode}/leave`, {
        method: 'POST',
        headers: {
          'X-Player-ID': playerId,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to leave room');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room');
      return false;
    }
  }, [roomCode]);

  // Initial fetch
  useEffect(() => {
    fetchRoom(true);
  }, [fetchRoom]);

  // Fast polling for near-real-time updates (every 3 seconds)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchRoom();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollInterval);
  }, [fetchRoom]);

  // Visibility change handler - fetch when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRoom(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchRoom]);

  // Focus handler - fetch when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchRoom(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchRoom]);

  return {
    room,
    isLoading,
    error,
    isConnected,
    rolesInPlay,
    ladyOfLakeHolder,
    sessionTakenOver,
    refresh: () => fetchRoom(true),
    leave,
  };
}

/**
 * Get player info for specific player in room
 */
export function getPlayerInfo(
  room: RoomDetails | null,
  playerId: string
): RoomPlayerInfo | null {
  if (!room) return null;
  return room.players.find((p) => p.id === playerId) ?? null;
}
