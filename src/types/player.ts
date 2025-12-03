/**
 * Player-related types for application use
 */

import type { Player } from './database';

/**
 * Player registration payload
 */
export interface RegisterPlayerPayload {
  player_id: string;
  nickname: string;
}

/**
 * Player registration response
 */
export interface RegisterPlayerResponse {
  id: string;
  player_id: string;
  nickname: string;
  created_at: string;
}

/**
 * Player identity stored in localStorage
 */
export interface PlayerIdentity {
  playerId: string;
  nickname: string | null;
  registeredAt: string | null;
}

/**
 * Player in the context of a room
 */
export interface RoomPlayerDisplay extends Player {
  is_manager: boolean;
  is_connected: boolean;
  is_current_player: boolean;
}

/**
 * Connection state for a player
 */
export type PlayerConnectionState = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Player state in the lobby
 */
export interface LobbyPlayer {
  id: string;
  player_id: string;
  nickname: string;
  is_manager: boolean;
  is_connected: boolean;
  connection_state: PlayerConnectionState;
  joined_at: string;
  disconnected_at: string | null;
}
