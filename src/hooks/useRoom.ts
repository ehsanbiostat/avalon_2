'use client';

/**
 * Room data hook with Supabase Realtime subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getPlayerId } from '@/lib/utils/player-id';
import type { RoomDetails, RoomPlayerInfo } from '@/types/room';
import type { Room } from '@/types/database';

interface UseRoomReturn {
  /** Room details including players */
  room: RoomDetails | null;
  /** Whether loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh room data */
  refresh: () => Promise<void>;
  /** Leave the room */
  leave: () => Promise<boolean>;
}

/**
 * Hook for managing room data with real-time updates
 */
export function useRoom(roomCode: string): UseRoomReturn {
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch room data from API
   */
  const fetchRoom = useCallback(async () => {
    try {
      const playerId = getPlayerId();
      const response = await fetch(`/api/rooms/${roomCode}`, {
        headers: {
          'X-Player-ID': playerId,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch room');
      }

      const { data } = await response.json();
      setRoom(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch room');
    } finally {
      setIsLoading(false);
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

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchRoom();

    // Set up Supabase Realtime subscription
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
        },
        (payload) => {
          console.log('Room players change:', payload);
          // Refresh room data on any change
          fetchRoom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
        },
        (payload) => {
          console.log('Room update:', payload);
          // Update room status in place
          const newRoom = payload.new as Room;
          setRoom((prev) => {
            if (!prev || prev.room.id !== newRoom.id) return prev;
            return {
              ...prev,
              room: newRoom,
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_roles',
        },
        () => {
          console.log('Roles changed');
          // Refresh to get updated confirmation status
          fetchRoom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, fetchRoom]);

  return {
    room,
    isLoading,
    error,
    refresh: fetchRoom,
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
