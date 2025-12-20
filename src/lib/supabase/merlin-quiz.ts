/**
 * Merlin Quiz database operations
 * Feature 010: Endgame Merlin Quiz
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MerlinQuizVote, MerlinQuizVoteInsert } from '@/types/game';

/**
 * Submit a quiz vote
 */
export async function submitQuizVote(
  client: SupabaseClient,
  vote: MerlinQuizVoteInsert
): Promise<MerlinQuizVote> {
  const { data, error } = await client
    .from('merlin_quiz_votes')
    .insert(vote)
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation (already voted)
    if (error.code === '23505') {
      throw new Error('ALREADY_VOTED');
    }
    throw error;
  }

  return data as MerlinQuizVote;
}

/**
 * Get all quiz votes for a game
 */
export async function getQuizVotes(
  client: SupabaseClient,
  gameId: string
): Promise<MerlinQuizVote[]> {
  const { data, error } = await client
    .from('merlin_quiz_votes')
    .select('*')
    .eq('game_id', gameId)
    .order('submitted_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data as MerlinQuizVote[];
}

/**
 * Get count of quiz votes for a game
 */
export async function getQuizVoteCount(
  client: SupabaseClient,
  gameId: string
): Promise<number> {
  const { count, error } = await client
    .from('merlin_quiz_votes')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * Get a player's quiz vote (if exists)
 */
export async function getPlayerQuizVote(
  client: SupabaseClient,
  gameId: string,
  playerId: string
): Promise<MerlinQuizVote | null> {
  const { data, error } = await client
    .from('merlin_quiz_votes')
    .select('*')
    .eq('game_id', gameId)
    .eq('voter_player_id', playerId)
    .single();

  // PGRST116 = Row not found (expected when player hasn't voted)
  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as MerlinQuizVote | null;
}

/**
 * Check if a player has already voted in the quiz
 */
export async function hasPlayerVotedInQuiz(
  client: SupabaseClient,
  gameId: string,
  playerId: string
): Promise<boolean> {
  const vote = await getPlayerQuizVote(client, gameId, playerId);
  return vote !== null;
}

/**
 * Get the earliest vote timestamp (quiz start time)
 */
export async function getQuizStartTime(
  client: SupabaseClient,
  gameId: string
): Promise<string | null> {
  const { data, error } = await client
    .from('merlin_quiz_votes')
    .select('submitted_at')
    .eq('game_id', gameId)
    .order('submitted_at', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data?.submitted_at ?? null;
}
