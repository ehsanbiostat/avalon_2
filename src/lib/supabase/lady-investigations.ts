/**
 * Lady Investigations database queries
 * CRUD operations for lady_investigations table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LadyInvestigation } from '@/types/game';

/**
 * Create a new investigation record
 */
export async function createInvestigation(
  client: SupabaseClient,
  investigation: {
    game_id: string;
    quest_number: number;
    investigator_id: string;
    target_id: string;
    result: 'good' | 'evil';
  }
): Promise<LadyInvestigation> {
  const { data, error } = await client
    .from('lady_investigations')
    .insert(investigation)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as LadyInvestigation;
}

/**
 * Get all investigations for a game
 */
export async function getInvestigations(
  client: SupabaseClient,
  gameId: string
): Promise<LadyInvestigation[]> {
  const { data, error } = await client
    .from('lady_investigations')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as LadyInvestigation[];
}

/**
 * Get IDs of all investigated players in a game
 */
export async function getInvestigatedPlayerIds(
  client: SupabaseClient,
  gameId: string
): Promise<string[]> {
  const { data, error } = await client
    .from('lady_investigations')
    .select('target_id')
    .eq('game_id', gameId);

  if (error) {
    throw error;
  }

  return (data || []).map((row: { target_id: string }) => row.target_id);
}

/**
 * Get IDs of all previous Lady holders (investigators)
 * These players cannot be investigated per game rules
 */
export async function getPreviousLadyHolderIds(
  client: SupabaseClient,
  gameId: string
): Promise<string[]> {
  const { data, error } = await client
    .from('lady_investigations')
    .select('investigator_id')
    .eq('game_id', gameId);

  if (error) {
    throw error;
  }

  // Return unique investigator IDs (all previous Lady holders)
  const ids = (data || []).map((row: { investigator_id: string }) => row.investigator_id);
  return Array.from(new Set(ids));
}

/**
 * Get the last investigation for a game (for public announcement)
 */
export async function getLastInvestigation(
  client: SupabaseClient,
  gameId: string
): Promise<LadyInvestigation | null> {
  const { data, error } = await client
    .from('lady_investigations')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as LadyInvestigation | null;
}

/**
 * Check if a player has been investigated
 */
export async function hasBeenInvestigated(
  client: SupabaseClient,
  gameId: string,
  playerId: string
): Promise<boolean> {
  const { data, error } = await client
    .from('lady_investigations')
    .select('id')
    .eq('game_id', gameId)
    .eq('target_id', playerId)
    .single();

  if (error && error.code === 'PGRST116') {
    return false; // Not found
  }

  if (error) {
    throw error;
  }

  return !!data;
}

/**
 * Get investigation count for a game
 */
export async function getInvestigationCount(
  client: SupabaseClient,
  gameId: string
): Promise<number> {
  const { count, error } = await client
    .from('lady_investigations')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId);

  if (error) {
    throw error;
  }

  return count || 0;
}

