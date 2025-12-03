/**
 * Game Start Logic
 * Handles auto-start when all roles are confirmed
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Game, GameInsert } from '@/types/game';
import { createGame, gameExistsForRoom } from '@/lib/supabase/games';
import { logGameStarted } from '@/lib/supabase/game-events';
import { updateRoomStatus } from '@/lib/supabase/rooms';
import { initializeSeating } from './seating';
import { getQuestRequirementsMap } from './quest-config';

/**
 * Game initialization result
 */
export interface GameInitResult {
  game: Game;
  seatingOrder: string[];
  firstLeaderId: string;
  questRequirements: ReturnType<typeof getQuestRequirementsMap>;
}

/**
 * Initialize and create a new game for a room
 * Called when all players have confirmed their roles
 * 
 * @param client Supabase client (service role)
 * @param roomId Room ID to create game for
 * @param playerIds Player IDs in the room (will be randomized)
 */
export async function initializeGame(
  client: SupabaseClient,
  roomId: string,
  playerIds: string[]
): Promise<GameInitResult> {
  // Validate player count
  const playerCount = playerIds.length;
  if (playerCount < 5 || playerCount > 10) {
    throw new Error(`Invalid player count: ${playerCount}. Must be 5-10.`);
  }
  
  // Check if game already exists for this room
  const gameExists = await gameExistsForRoom(client, roomId);
  if (gameExists) {
    throw new Error('Game already exists for this room');
  }
  
  // Initialize seating (randomize order and select first leader)
  const { seatingOrder, leaderIndex, leaderId } = initializeSeating(playerIds);
  
  // Create game record
  const gameInsert: GameInsert = {
    room_id: roomId,
    player_count: playerCount,
    phase: 'team_building',
    current_quest: 1,
    current_leader_id: leaderId,
    vote_track: 0,
    quest_results: [],
    seating_order: seatingOrder,
    leader_index: leaderIndex,
  };
  
  const game = await createGame(client, gameInsert);
  
  // Update room status to 'started'
  await updateRoomStatus(client, roomId, 'started');
  
  // Log game started event
  await logGameStarted(client, game.id, {
    seating_order: seatingOrder,
    first_leader_id: leaderId,
    player_count: playerCount,
  });
  
  // Get quest requirements for this player count
  const questRequirements = getQuestRequirementsMap(playerCount);
  
  return {
    game,
    seatingOrder,
    firstLeaderId: leaderId,
    questRequirements,
  };
}

/**
 * Check if game should auto-start
 * Called after each role confirmation
 * 
 * @param totalPlayers Total players in room
 * @param confirmedPlayers Number of players who confirmed
 */
export function shouldAutoStartGame(
  totalPlayers: number,
  confirmedPlayers: number
): boolean {
  return totalPlayers > 0 && totalPlayers === confirmedPlayers;
}

/**
 * Get player IDs from room_players for game initialization
 */
export async function getPlayerIdsForRoom(
  client: SupabaseClient,
  roomId: string
): Promise<string[]> {
  const { data, error } = await client
    .from('room_players')
    .select('player_id')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  
  if (error) {
    throw error;
  }
  
  return (data || []).map((rp: { player_id: string }) => rp.player_id);
}

/**
 * Full auto-start flow
 * Called when a player confirms their role
 * Returns the created game if auto-start triggered, null otherwise
 */
export async function tryAutoStartGame(
  client: SupabaseClient,
  roomId: string,
  totalPlayers: number,
  confirmedPlayers: number
): Promise<GameInitResult | null> {
  // Check if we should auto-start
  if (!shouldAutoStartGame(totalPlayers, confirmedPlayers)) {
    return null;
  }
  
  // Check if game already exists (prevent double-start)
  const gameExists = await gameExistsForRoom(client, roomId);
  if (gameExists) {
    return null;
  }
  
  // Get player IDs
  const playerIds = await getPlayerIdsForRoom(client, roomId);
  
  // Initialize and create the game
  return initializeGame(client, roomId, playerIds);
}

