/**
 * Player database queries
 * Updated for Phase 6: Player Recovery & Reconnection
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Player, PlayerInsert } from '@/types/database';
import type { ReclaimResult } from '@/types/player';
import { getConnectionStatus } from '@/lib/domain/connection-status';

/**
 * Find a player by their localStorage player_id
 */
export async function findPlayerByPlayerId(
  client: SupabaseClient,
  playerId: string
): Promise<Player | null> {
  const { data, error } = await client
    .from('players')
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Player | null;
}

/**
 * Find a player by their internal UUID
 */
export async function findPlayerById(
  client: SupabaseClient,
  id: string
): Promise<Player | null> {
  const { data, error } = await client
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Player | null;
}

/**
 * Create or update a player
 */
export async function upsertPlayer(
  client: SupabaseClient,
  player: PlayerInsert
): Promise<Player> {
  // First try to find existing player
  const existing = await findPlayerByPlayerId(client, player.player_id);

  if (existing) {
    // Update existing player
    const { data, error } = await client
      .from('players')
      .update({
        nickname: player.nickname,
        updated_at: new Date().toISOString(),
      })
      .eq('player_id', player.player_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Player;
  } else {
    // Insert new player
    const { data, error } = await client
      .from('players')
      .insert({
        player_id: player.player_id,
        nickname: player.nickname,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Player;
  }
}

/**
 * Update player nickname
 */
export async function updatePlayerNickname(
  client: SupabaseClient,
  playerId: string,
  nickname: string
): Promise<Player> {
  const { data, error } = await client
    .from('players')
    .update({
      nickname,
      updated_at: new Date().toISOString(),
    })
    .eq('player_id', playerId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Player;
}

/**
 * Check if a player exists
 */
export async function playerExists(
  client: SupabaseClient,
  playerId: string
): Promise<boolean> {
  const { count, error } = await client
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', playerId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

/**
 * Get players by their internal IDs
 */
export async function getPlayersByIds(
  client: SupabaseClient,
  ids: string[]
): Promise<Player[]> {
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from('players')
    .select('*')
    .in('id', ids);

  if (error) {
    throw error;
  }

  return (data ?? []) as Player[];
}

/**
 * Check if a player is currently in any active room (waiting or roles_distributed)
 * Does NOT block if player is in a 'started' room (game already ended for MVP purposes)
 */
export async function getPlayerCurrentRoom(
  client: SupabaseClient,
  playerId: string
): Promise<{ room_id: string; room_code: string; status: string } | null> {
  // First get the internal player ID
  const player = await findPlayerByPlayerId(client, playerId);
  if (!player) return null;

  const { data, error } = await client
    .from('room_players')
    .select(`
      room_id,
      rooms!inner (
        code,
        status
      )
    `)
    .eq('player_id', player.id);

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data || data.length === 0) return null;

  // Type assertion for the joined data
  type RoomPlayerData = { room_id: string; rooms: { code: string; status: string } | { code: string; status: string }[] };

  // Find first active room (not started)
  for (const entry of data as unknown as RoomPlayerData[]) {
    const rooms = Array.isArray(entry.rooms) ? entry.rooms[0] : entry.rooms;
    if (rooms && rooms.status !== 'started') {
      return {
        room_id: entry.room_id,
        room_code: rooms.code,
        status: rooms.status,
      };
    }
  }

  return null;
}

/**
 * Remove player from all 'started' rooms (cleanup stale memberships)
 */
export async function cleanupPlayerStartedRooms(
  client: SupabaseClient,
  playerId: string
): Promise<number> {
  const player = await findPlayerByPlayerId(client, playerId);
  if (!player) return 0;

  // Get all room_players entries for this player in 'started' rooms
  const { data: roomEntries, error: selectError } = await client
    .from('room_players')
    .select(`
      id,
      room_id,
      rooms!inner (
        status
      )
    `)
    .eq('player_id', player.id);

  if (selectError) {
    throw selectError;
  }

  if (!roomEntries || roomEntries.length === 0) return 0;

  // Filter to only started rooms
  type EntryWithRoom = { id: string; room_id: string; rooms: { status: string } | { status: string }[] };
  const startedEntryIds = (roomEntries as unknown as EntryWithRoom[])
    .filter((entry) => {
      const rooms = Array.isArray(entry.rooms) ? entry.rooms[0] : entry.rooms;
      return rooms?.status === 'started';
    })
    .map((entry) => entry.id);

  if (startedEntryIds.length === 0) return 0;

  // Delete these entries
  const { error: deleteError } = await client
    .from('room_players')
    .delete()
    .in('id', startedEntryIds);

  if (deleteError) {
    throw deleteError;
  }

  return startedEntryIds.length;
}

// ============================================
// Phase 6: Player Reconnection Functions
// ============================================

/**
 * T022: Check if a nickname is available (case-insensitive)
 */
export async function checkNicknameAvailable(
  client: SupabaseClient,
  nickname: string
): Promise<boolean> {
  const { data, error } = await client.rpc('check_nickname_available', {
    p_nickname: nickname
  });

  if (error) {
    throw error;
  }

  return data as boolean;
}

/**
 * T023: Register a new player with unique nickname validation
 */
export async function registerPlayer(
  client: SupabaseClient,
  playerId: string,
  nickname: string
): Promise<Player> {
  // Check availability first
  const available = await checkNicknameAvailable(client, nickname);
  if (!available) {
    const error = new Error('Nickname already taken') as Error & { code: string };
    error.code = 'NICKNAME_TAKEN';
    throw error;
  }

  // Insert new player
  const { data, error } = await client
    .from('players')
    .insert({
      player_id: playerId,
      nickname: nickname,
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (race condition)
    if (error.code === '23505') {
      const wrappedError = new Error('Nickname already taken') as Error & { code: string };
      wrappedError.code = 'NICKNAME_TAKEN';
      throw wrappedError;
    }
    throw error;
  }

  return data as Player;
}

/**
 * T032: Update player's last activity timestamp (heartbeat)
 */
export async function updatePlayerActivity(
  client: SupabaseClient,
  playerId: string
): Promise<boolean> {
  const { error } = await client
    .from('players')
    .update({
      last_activity_at: new Date().toISOString(),
    })
    .eq('player_id', playerId);

  if (error) {
    if (error.code === 'PGRST116') {
      return false; // Player not found
    }
    throw error;
  }

  return true;
}

/**
 * T050: Reclaim a seat using the database function
 */
export async function reclaimSeat(
  client: SupabaseClient,
  roomCode: string,
  nickname: string,
  newPlayerId: string
): Promise<ReclaimResult> {
  // First get the internal player ID for the new player
  const newPlayer = await findPlayerByPlayerId(client, newPlayerId);
  if (!newPlayer) {
    return {
      success: false,
      error_code: 'PLAYER_NOT_FOUND',
    };
  }

  const { data, error } = await client.rpc('reclaim_seat', {
    p_room_code: roomCode,
    p_nickname: nickname,
    p_new_player_id: newPlayer.id,
  });

  if (error) {
    throw error;
  }

  // The function returns an array with one row
  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    return {
      success: false,
      error_code: 'PLAYER_NOT_FOUND',
    };
  }

  return {
    success: result.success,
    error_code: result.error_code || undefined,
    room_id: result.room_id || undefined,
    old_player_id: result.old_player_id || undefined,
  };
}

/**
 * T064: Find active game by nickname
 */
export async function findActiveGameByNickname(
  client: SupabaseClient,
  nickname: string
): Promise<{
  room_code: string;
  room_id: string;
  status: string;
  player_count: number;
  expected_players: number;
  is_manager: boolean;
  last_activity_at: string;
} | null> {
  // Find player by nickname (case-insensitive)
  const { data: playerData, error: playerError } = await client
    .from('players')
    .select('id, last_activity_at')
    .ilike('nickname', nickname)
    .single();

  if (playerError || !playerData) {
    return null;
  }

  // Find active room membership
  const { data: roomData, error: roomError } = await client
    .from('room_players')
    .select(`
      room_id,
      rooms!inner (
        id,
        code,
        status,
        manager_id,
        expected_players
      )
    `)
    .eq('player_id', playerData.id);

  if (roomError || !roomData || roomData.length === 0) {
    return null;
  }

  // Find an active room (not in expired/finished state)
  type RoomPlayerJoin = {
    room_id: string;
    rooms: {
      id: string;
      code: string;
      status: string;
      manager_id: string;
      expected_players: number;
    } | {
      id: string;
      code: string;
      status: string;
      manager_id: string;
      expected_players: number;
    }[];
  };

  for (const entry of roomData as unknown as RoomPlayerJoin[]) {
    const room = Array.isArray(entry.rooms) ? entry.rooms[0] : entry.rooms;
    if (room && room.status !== 'expired') {
      // Get player count
      const { count } = await client
        .from('room_players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      return {
        room_code: room.code,
        room_id: room.id,
        status: room.status,
        player_count: count ?? 0,
        expected_players: room.expected_players,
        is_manager: room.manager_id === playerData.id,
        last_activity_at: playerData.last_activity_at,
      };
    }
  }

  return null;
}

/**
 * Find player by nickname (case-insensitive)
 */
export async function findPlayerByNickname(
  client: SupabaseClient,
  nickname: string
): Promise<Player | null> {
  const { data, error } = await client
    .from('players')
    .select('*')
    .ilike('nickname', nickname)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Player | null;
}
