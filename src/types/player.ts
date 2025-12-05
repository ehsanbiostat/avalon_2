/**
 * Player reconnection types
 * Phase 6: Player Recovery & Reconnection
 */

// ============================================
// CONNECTION STATUS
// ============================================

/**
 * Connection status computed from last_activity_at
 * Not stored in database - calculated on each request
 */
export interface ConnectionStatus {
  /** True if player has activity within last 60 seconds */
  is_connected: boolean;
  /** Seconds since last heartbeat/activity */
  seconds_since_activity: number;
  /** True if player can be reclaimed (disconnected + grace period passed) */
  can_be_reclaimed: boolean;
  /** Seconds remaining in grace period, or null if not applicable */
  grace_period_remaining: number | null;
}

// ============================================
// RECLAIM TYPES
// ============================================

/** Error codes returned by reclaim_seat function */
export type ReclaimErrorCode =
  | 'PLAYER_NOT_FOUND'  // No player with this nickname in the room
  | 'PLAYER_ACTIVE'     // Player is still connected (activity in last 60s)
  | 'GRACE_PERIOD';     // Player disconnected but grace period hasn't passed

/**
 * Result from seat reclaim operation
 */
export interface ReclaimResult {
  success: boolean;
  error_code?: ReclaimErrorCode;
  room_id?: string;
  old_player_id?: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/** POST /api/players/register - Request */
export interface RegisterRequest {
  nickname: string;  // 3-20 chars, alphanumeric + _ + -
  player_id: string; // UUID from localStorage
}

/** POST /api/players/register - Success Response */
export interface RegisterResponse {
  success: true;
  player: {
    id: string;
    nickname: string;
    player_id: string;
    created_at: string;
  };
}

/** POST /api/players/register - Error Response */
export interface RegisterErrorResponse {
  success: false;
  error: 'NICKNAME_TAKEN' | 'INVALID_NICKNAME';
  message: string;
  validation_errors?: {
    field: string;
    message: string;
  }[];
}

/** GET /api/players/check-nickname - Response */
export interface CheckNicknameResponse {
  nickname: string;
  available: boolean;
  message?: string;
}

/** POST /api/players/heartbeat - Request */
export interface HeartbeatRequest {
  room_code?: string; // Optional: which room player is viewing
}

/** POST /api/players/heartbeat - Response */
export interface HeartbeatResponse {
  success: boolean;
  timestamp?: string;
  error?: 'PLAYER_NOT_FOUND';
}

/** GET /api/players/find-game - Response */
export interface FindGameResponse {
  found: boolean;
  game?: {
    room_code: string;
    room_id: string;
    status: 'waiting' | 'roles_distributed' | 'started';
    player_count: number;
    expected_players: number;
    is_manager: boolean;
    can_reclaim: boolean;
    grace_period_remaining?: number;
  };
}

/** POST /api/rooms/[code]/reclaim - Request */
export interface ReclaimRequest {
  nickname: string;
}

/** POST /api/rooms/[code]/reclaim - Success Response */
export interface ReclaimSuccessResponse {
  success: true;
  room_id: string;
  room_code: string;
  player: {
    id: string;
    nickname: string;
    is_manager: boolean;
  };
  game_id?: string;
}

/** POST /api/rooms/[code]/reclaim - Error Response */
export interface ReclaimErrorResponse {
  success: false;
  error: ReclaimErrorCode | 'ROOM_NOT_FOUND';
  message: string;
  grace_period_remaining?: number;
  player_last_activity?: string;
}

// ============================================
// PLAYER INFO WITH CONNECTION STATUS
// ============================================

/**
 * Player info including computed connection status
 * Used in room/game responses
 */
export interface PlayerWithConnectionStatus {
  id: string;
  nickname: string;
  is_manager?: boolean;
  is_connected: boolean;
  seconds_since_activity: number;
  joined_at?: string;
  seat_position?: number;
}

// ============================================
// PLAYER IDENTITY (localStorage)
// ============================================

/**
 * Player identity stored in localStorage and used by usePlayer hook
 */
export interface PlayerIdentity {
  playerId: string;
  nickname: string | null;
  registeredAt: string | null;
}

/**
 * Response from player registration (for backward compatibility)
 */
export interface RegisterPlayerResponse {
  id: string;
  player_id: string;
  nickname: string;
  created_at: string;
}

/**
 * Payload for player registration (backward compatible with existing API)
 */
export interface RegisterPlayerPayload {
  player_id: string;
  nickname: string;
}

// ============================================
// SESSION RESTORE (for returning players on new devices)
// ============================================

/** POST /api/players/restore-session - Request */
export interface RestoreSessionRequest {
  nickname: string;
  room_code: string;
}

/** POST /api/players/restore-session - Success Response */
export interface RestoreSessionSuccessResponse {
  success: true;
  player_id: string;  // The localStorage UUID to save
  nickname: string;
  room_code: string;
  room_id: string;
  game_id?: string;
  is_manager: boolean;
}

/** POST /api/players/restore-session - Error Response */
export interface RestoreSessionErrorResponse {
  success: false;
  error: 'INVALID_INPUT' | 'PLAYER_NOT_FOUND' | 'PLAYER_ACTIVE' | 'GRACE_PERIOD' | 'SERVER_ERROR';
  message: string;
  grace_period_remaining?: number;
}
