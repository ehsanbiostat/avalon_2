/**
 * Room cleanup logic
 * Handles automatic deletion of stale rooms based on inactivity
 */

import {
  WAITING_ROOM_TIMEOUT,
  STARTED_ROOM_TIMEOUT,
} from '@/lib/utils/constants';
import type { RoomStatus } from '@/types/database';

/**
 * Check if a room should be cleaned up based on status and last activity
 */
export function shouldCleanupRoom(
  status: RoomStatus,
  lastActivityAt: string
): boolean {
  const lastActivity = new Date(lastActivityAt).getTime();
  const now = Date.now();
  const elapsed = now - lastActivity;

  switch (status) {
    case 'waiting':
      // Waiting rooms expire after 24 hours of inactivity
      return elapsed > WAITING_ROOM_TIMEOUT;

    case 'roles_distributed':
      // Rooms with distributed roles also use 24h timeout
      // (players should confirm quickly or game is abandoned)
      return elapsed > WAITING_ROOM_TIMEOUT;

    case 'started':
      // Started games have a longer 48h timeout
      return elapsed > STARTED_ROOM_TIMEOUT;

    default:
      return false;
  }
}

/**
 * Get the timeout duration for a room based on its status
 */
export function getTimeoutDuration(status: RoomStatus): number {
  switch (status) {
    case 'waiting':
    case 'roles_distributed':
      return WAITING_ROOM_TIMEOUT;
    case 'started':
      return STARTED_ROOM_TIMEOUT;
    default:
      return WAITING_ROOM_TIMEOUT;
  }
}

/**
 * Get remaining time before room expires (in milliseconds)
 */
export function getRemainingTime(
  status: RoomStatus,
  lastActivityAt: string
): number {
  const timeout = getTimeoutDuration(status);
  const lastActivity = new Date(lastActivityAt).getTime();
  const now = Date.now();
  const elapsed = now - lastActivity;
  const remaining = timeout - elapsed;

  return Math.max(0, remaining);
}

/**
 * Format remaining time as human-readable string
 */
export function formatRemainingTime(
  status: RoomStatus,
  lastActivityAt: string
): string {
  const remaining = getRemainingTime(status, lastActivityAt);

  if (remaining <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Cleanup result for a batch operation
 */
export interface CleanupResult {
  roomsChecked: number;
  roomsDeleted: number;
  deletedRoomCodes: string[];
  errors: Array<{ roomCode: string; error: string }>;
}

/**
 * Room info for cleanup check
 */
export interface RoomForCleanup {
  id: string;
  code: string;
  status: RoomStatus;
  last_activity_at: string;
}

/**
 * Get rooms that should be cleaned up from a list
 */
export function getRoomsToCleanup(rooms: RoomForCleanup[]): RoomForCleanup[] {
  return rooms.filter((room) =>
    shouldCleanupRoom(room.status, room.last_activity_at)
  );
}

/**
 * Cleanup reason for logging
 */
export function getCleanupReason(status: RoomStatus): string {
  switch (status) {
    case 'waiting':
      return 'waiting_timeout_24h';
    case 'roles_distributed':
      return 'roles_distributed_timeout_24h';
    case 'started':
      return 'started_timeout_48h';
    default:
      return 'unknown';
  }
}
