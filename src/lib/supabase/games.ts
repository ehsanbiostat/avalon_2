/**
 * Game database queries
 * CRUD operations for games table
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Game,
  GameInsert,
  GameUpdate,
  GamePhase,
  QuestResult,
} from '@/types/game';

/**
 * Create a new game for a room
 */
export async function createGame(
  client: SupabaseClient,
  game: GameInsert
): Promise<Game> {
  const { data, error } = await client
    .from('games')
    .insert(game)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Game;
}

/**
 * Get game by room ID
 */
export async function getGameByRoomId(
  client: SupabaseClient,
  roomId: string
): Promise<Game | null> {
  const { data, error } = await client
    .from('games')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Game | null;
}

/**
 * Get game by ID
 */
export async function getGameById(
  client: SupabaseClient,
  gameId: string
): Promise<Game | null> {
  const { data, error } = await client
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as Game | null;
}

/**
 * Update game state
 */
export async function updateGame(
  client: SupabaseClient,
  gameId: string,
  update: GameUpdate
): Promise<Game> {
  const { data, error } = await client
    .from('games')
    .update(update)
    .eq('id', gameId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Game;
}

/**
 * Update game phase
 */
export async function updateGamePhase(
  client: SupabaseClient,
  gameId: string,
  phase: GamePhase
): Promise<Game> {
  return updateGame(client, gameId, { phase });
}

/**
 * Increment vote track (on rejection)
 */
export async function incrementVoteTrack(
  client: SupabaseClient,
  gameId: string
): Promise<Game> {
  // Get current vote track
  const game = await getGameById(client, gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  return updateGame(client, gameId, {
    vote_track: game.vote_track + 1,
  });
}

/**
 * Reset vote track to 0 (on team approval)
 */
export async function resetVoteTrack(
  client: SupabaseClient,
  gameId: string
): Promise<Game> {
  return updateGame(client, gameId, { vote_track: 0 });
}

/**
 * Rotate leader to next player in seating order
 */
export async function rotateLeader(
  client: SupabaseClient,
  gameId: string
): Promise<Game> {
  const game = await getGameById(client, gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  const nextIndex = (game.leader_index + 1) % game.seating_order.length;
  const nextLeaderId = game.seating_order[nextIndex];

  return updateGame(client, gameId, {
    leader_index: nextIndex,
    current_leader_id: nextLeaderId,
  });
}

/**
 * Add quest result and advance to next quest
 */
export async function addQuestResult(
  client: SupabaseClient,
  gameId: string,
  result: QuestResult
): Promise<Game> {
  const game = await getGameById(client, gameId);
  if (!game) {
    throw new Error('Game not found');
  }

  const updatedResults = [...game.quest_results, result];

  return updateGame(client, gameId, {
    quest_results: updatedResults,
    current_quest: game.current_quest + 1,
    vote_track: 0, // Reset vote track after quest
  });
}

/**
 * Set game winner and end the game
 */
export async function endGame(
  client: SupabaseClient,
  gameId: string,
  winner: 'good' | 'evil',
  winReason: string
): Promise<Game> {
  return updateGame(client, gameId, {
    phase: 'game_over',
    winner,
    win_reason: winReason,
    ended_at: new Date().toISOString(),
  });
}

/**
 * Check if game exists for room
 */
export async function gameExistsForRoom(
  client: SupabaseClient,
  roomId: string
): Promise<boolean> {
  const { count, error } = await client
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

