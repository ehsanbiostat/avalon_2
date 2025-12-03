/**
 * Role database queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlayerRole } from '@/types/database';
import type { RoleAssignment } from '@/lib/domain/roles';

/**
 * Insert role assignments for a room
 */
export async function insertRoleAssignments(
  client: SupabaseClient,
  roomId: string,
  assignments: RoleAssignment[]
): Promise<PlayerRole[]> {
  const inserts = assignments.map((a) => ({
    room_id: roomId,
    player_id: a.playerId,
    role: a.role,
    is_confirmed: false,
  }));

  const { data, error } = await client
    .from('player_roles')
    .insert(inserts)
    .select();

  if (error) {
    throw error;
  }

  return data as PlayerRole[];
}

/**
 * Get player's role in a room
 */
export async function getPlayerRole(
  client: SupabaseClient,
  roomId: string,
  playerId: string
): Promise<PlayerRole | null> {
  const { data, error } = await client
    .from('player_roles')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as PlayerRole | null;
}

/**
 * Confirm a player's role
 */
export async function confirmPlayerRole(
  client: SupabaseClient,
  roomId: string,
  playerId: string
): Promise<PlayerRole> {
  const { data, error } = await client
    .from('player_roles')
    .update({ is_confirmed: true })
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PlayerRole;
}

/**
 * Get confirmation status for a room
 */
export async function getRoomConfirmations(
  client: SupabaseClient,
  roomId: string
): Promise<{ total: number; confirmed: number }> {
  const { data, error } = await client
    .from('player_roles')
    .select('is_confirmed')
    .eq('room_id', roomId);

  if (error) {
    throw error;
  }

  const roles = data || [];
  return {
    total: roles.length,
    confirmed: roles.filter((r: { is_confirmed: boolean }) => r.is_confirmed).length,
  };
}

/**
 * Check if all players have confirmed
 */
export async function allPlayersConfirmed(
  client: SupabaseClient,
  roomId: string
): Promise<boolean> {
  const { total, confirmed } = await getRoomConfirmations(client, roomId);
  return total > 0 && total === confirmed;
}

/**
 * Get evil teammates for a player
 */
export async function getEvilTeammates(
  client: SupabaseClient,
  roomId: string,
  playerId: string
): Promise<string[]> {
  // First verify the player is evil
  const playerRole = await getPlayerRole(client, roomId, playerId);
  if (!playerRole || playerRole.role !== 'evil') {
    return [];
  }

  // Get all evil players in the room (except self)
  const { data, error } = await client
    .from('player_roles')
    .select(`
      player_id,
      players!inner (
        nickname
      )
    `)
    .eq('room_id', roomId)
    .eq('role', 'evil')
    .neq('player_id', playerId);

  if (error) {
    throw error;
  }

  return (data || []).map(
    (r: { players: { nickname: string }[] }) => r.players[0]?.nickname || 'Unknown'
  );
}

/**
 * Check if roles have been distributed for a room
 */
export async function rolesDistributed(
  client: SupabaseClient,
  roomId: string
): Promise<boolean> {
  const { count, error } = await client
    .from('player_roles')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}
