'use client';

/**
 * Room data hook with Supabase Realtime subscriptions
 * Provides centralized real-time state synchronization for all players in a room
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getPlayerId } from '@/lib/utils/player-id';
import type { RoomDetails, RoomPlayerInfo } from '@/types/room';
import type { Room } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRoomReturn {
  /** Room details including players */
  room: RoomDetails | null;
  /** Whether loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether real-time is connected */
  isConnected: boolean;
  /** Refresh room data */
  refresh: () => Promise<void>;
  /** Leave the room */
  leave: () => Promise<boolean>;
}

/**
 * Hook for managing room data with real-time updates
 * Centralizes state synchronization for all room events:
 * - Player joins/leaves
 * - Role distribution
 * - Role confirmation
 * - Game start
 */
export function useRoom(roomCode: string): UseRoomReturn {
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomIdRef = useRef<string | null>(null);

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
        // Prevent caching to always get fresh data
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch room');
      }

      const { data } = await response.json();
      setRoom(data);
      setError(null);
      
      // Store room ID for subscription filtering
      if (data?.room?.id) {
        roomIdRef.current = data.room.id;
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch room');
      return null;
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
    let isMounted = true;
    
    const setupRealtimeSubscription = async () => {
      // First fetch room data to get the room ID
      const roomData = await fetchRoom();
      if (!isMounted || !roomData?.room?.id) return;
      
      const roomId = roomData.room.id;
      const supabase = createBrowserClient();

      // Clean up any existing channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      // Create a unique channel name for this room
      const channelName = `room-sync:${roomCode}:${Date.now()}`;
      
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true },
            presence: { key: getPlayerId() },
          },
        })
        // Listen for room_players changes (joins/leaves) - filtered by room_id
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'room_players',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log('[Realtime] room_players change:', payload.eventType);
            // Always refetch to get complete player data with nicknames
            if (isMounted) fetchRoom();
          }
        )
        // Listen for room updates (status changes) - filtered by id
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${roomId}`,
          },
          (payload) => {
            console.log('[Realtime] room update:', payload.eventType);
            if (!isMounted) return;
            
            // Update room status in place for faster UI update
            const newRoom = payload.new as Room;
            setRoom((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                room: newRoom,
              };
            });
            
            // Also fetch full data for any related changes
            fetchRoom();
          }
        )
        // Listen for player_roles changes (distribution, confirmation) - filtered by room_id
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'player_roles',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log('[Realtime] player_roles change:', payload.eventType);
            // Refresh to get updated confirmation status
            if (isMounted) fetchRoom();
          }
        )
        .subscribe((status) => {
          console.log('[Realtime] Subscription status:', status);
          if (isMounted) {
            setIsConnected(status === 'SUBSCRIBED');
          }
        });

      channelRef.current = channel;
    };

    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      isMounted = false;
      if (channelRef.current) {
        const supabase = createBrowserClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, fetchRoom]);

  // Periodic polling as fallback (every 10 seconds)
  // This ensures state stays in sync even if realtime has issues
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!isConnected && room) {
        console.log('[Polling] Fallback refresh due to disconnected state');
        fetchRoom();
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [isConnected, room, fetchRoom]);

  return {
    room,
    isLoading,
    error,
    isConnected,
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
