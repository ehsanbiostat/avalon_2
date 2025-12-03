/**
 * Game Events database queries
 * Audit log for game history
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  GameEvent,
  GameEventInsert,
  GameStartedEventData,
  TeamProposedEventData,
  VotesRevealedEventData,
  QuestCompletedEventData,
  GameEndedEventData,
} from '@/types/game';

// Event type constants
export const EVENT_TYPES = {
  GAME_STARTED: 'game_started',
  TEAM_PROPOSED: 'team_proposed',
  VOTE_SUBMITTED: 'vote_submitted',
  VOTES_REVEALED: 'votes_revealed',
  QUEST_STARTED: 'quest_started',
  QUEST_ACTION: 'quest_action',
  QUEST_COMPLETED: 'quest_completed',
  GAME_ENDED: 'game_ended',
} as const;

/**
 * Log a game event
 */
export async function logGameEvent(
  client: SupabaseClient,
  event: GameEventInsert
): Promise<GameEvent> {
  const { data, error } = await client
    .from('game_events')
    .insert(event)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as GameEvent;
}

/**
 * Log game started event
 */
export async function logGameStarted(
  client: SupabaseClient,
  gameId: string,
  data: GameStartedEventData
): Promise<GameEvent> {
  return logGameEvent(client, {
    game_id: gameId,
    event_type: EVENT_TYPES.GAME_STARTED,
    event_data: data as unknown as Record<string, unknown>,
  });
}

/**
 * Log team proposed event
 */
export async function logTeamProposed(
  client: SupabaseClient,
  gameId: string,
  data: TeamProposedEventData
): Promise<GameEvent> {
  return logGameEvent(client, {
    game_id: gameId,
    event_type: EVENT_TYPES.TEAM_PROPOSED,
    event_data: data as unknown as Record<string, unknown>,
  });
}

/**
 * Log votes revealed event
 */
export async function logVotesRevealed(
  client: SupabaseClient,
  gameId: string,
  data: VotesRevealedEventData
): Promise<GameEvent> {
  return logGameEvent(client, {
    game_id: gameId,
    event_type: EVENT_TYPES.VOTES_REVEALED,
    event_data: data as unknown as Record<string, unknown>,
  });
}

/**
 * Log quest completed event
 */
export async function logQuestCompleted(
  client: SupabaseClient,
  gameId: string,
  data: QuestCompletedEventData
): Promise<GameEvent> {
  return logGameEvent(client, {
    game_id: gameId,
    event_type: EVENT_TYPES.QUEST_COMPLETED,
    event_data: data as unknown as Record<string, unknown>,
  });
}

/**
 * Log game ended event
 */
export async function logGameEnded(
  client: SupabaseClient,
  gameId: string,
  data: GameEndedEventData
): Promise<GameEvent> {
  return logGameEvent(client, {
    game_id: gameId,
    event_type: EVENT_TYPES.GAME_ENDED,
    event_data: data as unknown as Record<string, unknown>,
  });
}

/**
 * Log game over (convenience wrapper)
 */
export async function logGameOver(
  client: SupabaseClient,
  gameId: string,
  winner: 'good' | 'evil',
  reason: string,
  assassinFoundMerlin: boolean = false
): Promise<GameEvent> {
  return logGameEnded(client, gameId, {
    winner,
    reason,
    assassin_found_merlin: assassinFoundMerlin,
  } as GameEndedEventData);
}

/**
 * Get all events for a game (chronological)
 */
export async function getGameEvents(
  client: SupabaseClient,
  gameId: string
): Promise<GameEvent[]> {
  const { data, error } = await client
    .from('game_events')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as GameEvent[];
}

/**
 * Get events by type for a game
 */
export async function getEventsByType(
  client: SupabaseClient,
  gameId: string,
  eventType: string
): Promise<GameEvent[]> {
  const { data, error } = await client
    .from('game_events')
    .select('*')
    .eq('game_id', gameId)
    .eq('event_type', eventType)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as GameEvent[];
}

/**
 * Get recent events for a game (for live updates)
 */
export async function getRecentEvents(
  client: SupabaseClient,
  gameId: string,
  limit: number = 10
): Promise<GameEvent[]> {
  const { data, error } = await client
    .from('game_events')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  // Return in chronological order
  return ((data || []) as GameEvent[]).reverse();
}

