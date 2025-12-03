/**
 * Room-related types for application use
 * Updated for Phase 2: Special Roles & Configurations
 */

import type { Room, RoomStatus } from './database';
import type { RoleConfig } from './role-config';

// Re-export for convenience
export type { RoleConfig } from './role-config';

/**
 * Room with computed properties for display
 */
export interface RoomWithDetails extends Room {
  manager_nickname: string;
  current_players: number;
  is_full: boolean;
}

/**
 * Room list item for active rooms page
 */
export interface RoomListItem {
  id: string;
  code: string;
  manager_nickname: string;
  expected_players: number;
  current_players: number;
  is_full: boolean;
  created_at: string;
}

/**
 * Room details with players for lobby view (extended for Phase 2)
 */
export interface RoomDetails {
  room: Room;
  players: RoomPlayerInfo[];
  current_player: {
    id: string;
    nickname: string;
    is_manager: boolean;
  };
  confirmations?: {
    total: number;
    confirmed: number;
  };
  // Phase 2 additions
  roles_in_play?: string[];
  lady_of_lake_holder?: {
    id: string;
    nickname: string;
  } | null;
}

/**
 * Player info within a room
 */
export interface RoomPlayerInfo {
  id: string;
  nickname: string;
  is_manager: boolean;
  is_connected: boolean;
  joined_at: string;
}

/**
 * Room creation payload (extended for Phase 2)
 */
export interface CreateRoomPayload {
  expected_players: number;
  // Phase 2: Optional role configuration
  role_config?: RoleConfig;
}

/**
 * Room creation response (extended for Phase 2)
 */
export interface CreateRoomResponse {
  id: string;
  code: string;
  manager_id: string;
  expected_players: number;
  status: RoomStatus;
  created_at: string;
  // Phase 2 additions
  role_config: RoleConfig;
  lady_of_lake_enabled: boolean;
  roles_in_play: string[];
}

/**
 * Join room response
 */
export interface JoinRoomResponse {
  room_id: string;
  player_id: string;
  joined_at: string;
  is_rejoin: boolean;
}

/**
 * Leave room response
 */
export interface LeaveRoomResponse {
  left: true;
  room_code: string;
}
