/**
 * Player database queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Player, PlayerInsert } from '@/types/database';

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
