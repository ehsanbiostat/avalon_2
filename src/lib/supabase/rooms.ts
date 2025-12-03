/**
 * Room database queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Room, RoomInsert, RoomPlayer } from '@/types/database';
import type { RoomListItem, RoomDetails, RoomPlayerInfo } from '@/types/room';

/**
 * Find a room by code
 */
export async function findRoomByCode(
  client: SupabaseClient,
  code: string
): Promise<Room | null> {
  const { data, error } = await client
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Room | null;
}

/**
 * Find a room by ID
 */
export async function findRoomById(
  client: SupabaseClient,
  id: string
): Promise<Room | null> {
  const { data, error } = await client
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Room | null;
}

/**
 * Create a new room
 */
export async function createRoom(
  client: SupabaseClient,
  room: RoomInsert
): Promise<Room> {
  const { data, error } = await client
    .from('rooms')
    .insert(room)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Room;
}

/**
 * Update room status
 */
export async function updateRoomStatus(
  client: SupabaseClient,
  roomId: string,
  status: Room['status']
): Promise<Room> {
  const { data, error } = await client
    .from('rooms')
    .update({
      status,
      last_activity_at: new Date().toISOString()
    })
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Room;
}

/**
 * Update room activity timestamp
 */
export async function updateRoomActivity(
  client: SupabaseClient,
  roomId: string
): Promise<void> {
  const { error } = await client
    .from('rooms')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', roomId);

  if (error) {
    throw error;
  }
}

/**
 * Get all waiting rooms with player counts
 */
export async function getWaitingRooms(
  client: SupabaseClient
): Promise<RoomListItem[]> {
  const { data, error } = await client
    .from('rooms')
    .select(`
      id,
      code,
      manager_id,
      expected_players,
      created_at,
      players:room_players(count)
    `)
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Get manager nicknames
  const managerIds = (data || []).map((r: { manager_id: string }) => r.manager_id);
  const { data: managers } = await client
    .from('players')
    .select('id, nickname')
    .in('id', managerIds);

  const managerMap = new Map(
    (managers || []).map((m: { id: string; nickname: string }) => [m.id, m.nickname])
  );

  return (data || []).map((room: {
    id: string;
    code: string;
    manager_id: string;
    expected_players: number;
    created_at: string;
    players: { count: number }[];
  }) => {
    const currentPlayers = room.players[0]?.count || 0;
    return {
      id: room.id,
      code: room.code,
      manager_nickname: managerMap.get(room.manager_id) || 'Unknown',
      expected_players: room.expected_players,
      current_players: currentPlayers,
      is_full: currentPlayers >= room.expected_players,
      created_at: room.created_at,
    };
  });
}

/**
 * Get room details with players
 */
export async function getRoomDetails(
  client: SupabaseClient,
  roomId: string,
  currentPlayerId: string
): Promise<RoomDetails | null> {
  // Get room
  const room = await findRoomById(client, roomId);
  if (!room) return null;

  // Get players in room with their info
  const { data: roomPlayers, error: rpError } = await client
    .from('room_players')
    .select(`
      player_id,
      joined_at,
      is_connected,
      players!inner (
        id,
        nickname
      )
    `)
    .eq('room_id', roomId);

  if (rpError) {
    throw rpError;
  }

  // Get role confirmations if roles distributed
  let confirmations: { total: number; confirmed: number } | undefined;
  if (room.status === 'roles_distributed') {
    const { data: roles, error: rolesError } = await client
      .from('player_roles')
      .select('is_confirmed')
      .eq('room_id', roomId);

    if (rolesError) {
      throw rolesError;
    }

    confirmations = {
      total: roles?.length || 0,
      confirmed: roles?.filter((r: { is_confirmed: boolean }) => r.is_confirmed).length || 0,
    };
  }

  // Map players
  // Note: Supabase !inner join returns single object, not array
  const players: RoomPlayerInfo[] = (roomPlayers || []).map((rp: {
    player_id: string;
    joined_at: string;
    is_connected: boolean;
    players: { id: string; nickname: string } | { id: string; nickname: string }[];
  }) => {
    // Handle both single object (correct) and array (defensive) cases
    const playerData = Array.isArray(rp.players) ? rp.players[0] : rp.players;
    return {
      id: rp.player_id,
      nickname: playerData?.nickname || 'Unknown',
      is_manager: rp.player_id === room.manager_id,
      is_connected: rp.is_connected,
      joined_at: rp.joined_at,
    };
  });

  // Find current player
  const currentPlayer = players.find(p => p.id === currentPlayerId);

  return {
    room,
    players,
    current_player: currentPlayer ? {
      id: currentPlayer.id,
      nickname: currentPlayer.nickname,
      is_manager: currentPlayer.is_manager,
    } : {
      id: currentPlayerId,
      nickname: 'Unknown',
      is_manager: false,
    },
    confirmations,
  };
}

/**
 * Add player to room
 */
export async function addPlayerToRoom(
  client: SupabaseClient,
  roomId: string,
  playerId: string
): Promise<RoomPlayer> {
  const { data, error } = await client
    .from('room_players')
    .insert({
      room_id: roomId,
      player_id: playerId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Update room activity
  await updateRoomActivity(client, roomId);

  return data as RoomPlayer;
}

/**
 * Remove player from room
 */
export async function removePlayerFromRoom(
  client: SupabaseClient,
  roomId: string,
  playerId: string
): Promise<void> {
  const { error } = await client
    .from('room_players')
    .delete()
    .eq('room_id', roomId)
    .eq('player_id', playerId);

  if (error) {
    throw error;
  }

  await updateRoomActivity(client, roomId);
}

/**
 * Get player count in room
 */
export async function getRoomPlayerCount(
  client: SupabaseClient,
  roomId: string
): Promise<number> {
  const { count, error } = await client
    .from('room_players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * Check if player is in room
 */
export async function isPlayerInRoom(
  client: SupabaseClient,
  roomId: string,
  playerId: string
): Promise<boolean> {
  const { count, error } = await client
    .from('room_players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId)
    .eq('player_id', playerId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

/**
 * Update manager when current manager leaves
 */
export async function transferManager(
  client: SupabaseClient,
  roomId: string
): Promise<string | null> {
  // Get the longest-present player (excluding the leaving manager)
  const { data, error } = await client
    .from('room_players')
    .select('player_id')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // Update room manager
  await client
    .from('rooms')
    .update({ manager_id: data.player_id })
    .eq('id', roomId);

  return data.player_id;
}

/**
 * Delete empty room
 */
export async function deleteRoom(
  client: SupabaseClient,
  roomId: string
): Promise<void> {
  const { error } = await client
    .from('rooms')
    .delete()
    .eq('id', roomId);

  if (error) {
    throw error;
  }
}
