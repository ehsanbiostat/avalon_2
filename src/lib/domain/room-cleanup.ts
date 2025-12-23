/**
 * Room archiving logic
 * Handles marking stale rooms as 'closed' based on inactivity
 * Game history is preserved for statistics
 */

import {
  WAITING_ROOM_TIMEOUT,
  STARTED_ROOM_TIMEOUT,
} from '@/lib/utils/constants';
import type { RoomStatus } from '@/types/database';

/**
 * Check if a room should be archived based on status and last activity
 */
export function shouldArchiveRoom(
  status: RoomStatus,
  lastActivityAt: string
): boolean {
  // Already closed rooms should not be re-processed
  if (status === 'closed') {
    return false;
  }

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

// Keep old name for backwards compatibility
export const shouldCleanupRoom = shouldArchiveRoom;

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
    case 'closed':
      return 0; // Already archived
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
  if (status === 'closed') {
    return 0;
  }

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
  if (status === 'closed') {
    return 'Archived';
  }

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
 * Archive result for a batch operation
 */
export interface ArchiveResult {
  roomsChecked: number;
  roomsArchived: number;
  archivedRoomCodes: string[];
  errors: Array<{ roomCode: string; error: string }>;
}

// Keep old interface name for backwards compatibility
export type CleanupResult = ArchiveResult;

/**
 * Room info for archive check
 */
export interface RoomForArchive {
  id: string;
  code: string;
  status: RoomStatus;
  last_activity_at: string;
}

// Keep old interface name for backwards compatibility
export type RoomForCleanup = RoomForArchive;

/**
 * Get rooms that should be archived from a list
 */
export function getRoomsToArchive(rooms: RoomForArchive[]): RoomForArchive[] {
  return rooms.filter((room) =>
    shouldArchiveRoom(room.status, room.last_activity_at)
  );
}

// Keep old function name for backwards compatibility
export const getRoomsToCleanup = getRoomsToArchive;

/**
 * Archive reason for logging
 */
export function getArchiveReason(status: RoomStatus): string {
  switch (status) {
    case 'waiting':
      return 'waiting_timeout_24h';
    case 'roles_distributed':
      return 'roles_distributed_timeout_24h';
    case 'started':
      return 'started_timeout_48h';
    case 'closed':
      return 'already_archived';
    default:
      return 'unknown';
  }
}

// Keep old function name for backwards compatibility
export const getCleanupReason = getArchiveReason;
