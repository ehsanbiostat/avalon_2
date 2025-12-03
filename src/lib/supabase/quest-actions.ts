/**
 * Quest Actions database queries
 * Note: Quest actions are sensitive - only service role should access
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { QuestAction, QuestActionInsert, QuestActionType } from '@/types/game';

/**
 * Submit a quest action (success/fail)
 * Only team members can submit, Good players can only submit success
 */
export async function submitQuestAction(
  client: SupabaseClient,
  action: QuestActionInsert
): Promise<QuestAction> {
  const { data, error } = await client
    .from('quest_actions')
    .insert(action)
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation (already submitted)
    if (error.code === '23505') {
      throw new Error('ALREADY_SUBMITTED');
    }
    throw error;
  }

  return data as QuestAction;
}

/**
 * Check if player has submitted action for quest
 */
export async function hasPlayerSubmittedAction(
  client: SupabaseClient,
  gameId: string,
  questNumber: number,
  playerId: string
): Promise<boolean> {
  const { count, error } = await client
    .from('quest_actions')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('quest_number', questNumber)
    .eq('player_id', playerId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

/**
 * Count submitted actions for a quest
 */
export async function getActionCount(
  client: SupabaseClient,
  gameId: string,
  questNumber: number
): Promise<number> {
  const { count, error } = await client
    .from('quest_actions')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('quest_number', questNumber);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * Get all actions for a quest (service role only)
 * Used to calculate quest result - NEVER expose to client directly
 */
export async function getQuestActions(
  client: SupabaseClient,
  gameId: string,
  questNumber: number
): Promise<QuestAction[]> {
  const { data, error } = await client
    .from('quest_actions')
    .select('*')
    .eq('game_id', gameId)
    .eq('quest_number', questNumber);

  if (error) {
    throw error;
  }

  return (data || []) as QuestAction[];
}

/**
 * Calculate quest result from actions
 * Returns shuffled counts (no player attribution)
 */
export async function calculateQuestResult(
  client: SupabaseClient,
  gameId: string,
  questNumber: number
): Promise<{ success: number; fail: number }> {
  const actions = await getQuestActions(client, gameId, questNumber);

  return {
    success: actions.filter((a) => a.action === 'success').length,
    fail: actions.filter((a) => a.action === 'fail').length,
  };
}

/**
 * Get player IDs who have submitted actions
 */
export async function getSubmittedPlayerIds(
  client: SupabaseClient,
  gameId: string,
  questNumber: number
): Promise<string[]> {
  const { data, error } = await client
    .from('quest_actions')
    .select('player_id')
    .eq('game_id', gameId)
    .eq('quest_number', questNumber);

  if (error) {
    throw error;
  }

  return (data || []).map((a: { player_id: string }) => a.player_id);
}

