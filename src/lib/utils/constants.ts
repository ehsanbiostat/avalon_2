/**
 * Application constants
 * Centralized configuration values
 */

import type { RoleRatios } from '@/types/role';

/**
 * Player count limits
 */
export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 10;

/**
 * Nickname constraints
 */
export const MIN_NICKNAME_LENGTH = 3;
export const MAX_NICKNAME_LENGTH = 20;

/**
 * Room code configuration
 */
export const ROOM_CODE_LENGTH = 6;

/**
 * Timing constants (in milliseconds)
 */
export const RECONNECTION_GRACE_PERIOD = 5 * 60 * 1000; // 5 minutes
export const WAITING_ROOM_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
export const STARTED_ROOM_TIMEOUT = 48 * 60 * 60 * 1000; // 48 hours
export const REALTIME_UPDATE_DELAY = 2000; // 2 seconds max

/**
 * Role distribution ratios by player count
 * Standard Avalon ratios:
 * 5p = 3G/2E, 6p = 4G/2E, 7p = 4G/3E, 8p = 5G/3E, 9p = 6G/3E, 10p = 6G/4E
 */
export const ROLE_RATIOS: RoleRatios = {
  5: { good: 3, evil: 2 },
  6: { good: 4, evil: 2 },
  7: { good: 4, evil: 3 },
  8: { good: 5, evil: 3 },
  9: { good: 6, evil: 3 },
  10: { good: 6, evil: 4 },
};

/**
 * Get role distribution for a player count
 * @param playerCount - Number of players (5-10)
 * @returns Role distribution or null if invalid count
 */
export function getRoleRatio(playerCount: number) {
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    return null;
  }
  return ROLE_RATIOS[playerCount];
}

/**
 * API Headers
 */
export const PLAYER_ID_HEADER = 'X-Player-ID';

/**
 * API Error codes
 */
export const ERROR_CODES = {
  // General
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Player errors
  INVALID_NICKNAME: 'INVALID_NICKNAME',
  INVALID_PLAYER_ID: 'INVALID_PLAYER_ID',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  PLAYER_ALREADY_IN_ROOM: 'PLAYER_ALREADY_IN_ROOM',

  // Room errors
  INVALID_PLAYER_COUNT: 'INVALID_PLAYER_COUNT',
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  ROOM_NOT_WAITING: 'ROOM_NOT_WAITING',
  NICKNAME_TAKEN: 'NICKNAME_TAKEN',
  NOT_ROOM_MEMBER: 'NOT_ROOM_MEMBER',
  NOT_ROOM_MANAGER: 'NOT_ROOM_MANAGER',

  // Role errors
  ROOM_NOT_FULL: 'ROOM_NOT_FULL',
  ROLES_ALREADY_DISTRIBUTED: 'ROLES_ALREADY_DISTRIBUTED',
  ROLES_NOT_DISTRIBUTED: 'ROLES_NOT_DISTRIBUTED',
  ALREADY_CONFIRMED: 'ALREADY_CONFIRMED',

  // Game errors
  NOT_ALL_CONFIRMED: 'NOT_ALL_CONFIRMED',
  ALREADY_STARTED: 'ALREADY_STARTED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
