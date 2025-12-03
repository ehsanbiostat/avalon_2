/**
 * Player ID utility for localStorage-based identity
 * Generates and persists a unique player identifier
 */

const PLAYER_ID_KEY = 'avalon_player_id';
const PLAYER_NICKNAME_KEY = 'avalon_player_nickname';

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID when available, falls back to manual generation
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create the player ID from localStorage
 * @returns The player's unique ID (persists across sessions)
 */
export function getPlayerId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getPlayerId() can only be called on the client');
  }

  let playerId = localStorage.getItem(PLAYER_ID_KEY);

  if (!playerId) {
    playerId = generateUUID();
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  return playerId;
}

/**
 * Check if a player ID exists in localStorage
 */
export function hasPlayerId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(PLAYER_ID_KEY) !== null;
}

/**
 * Get the stored nickname (if any)
 */
export function getStoredNickname(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(PLAYER_NICKNAME_KEY);
}

/**
 * Store the player's nickname
 */
export function setStoredNickname(nickname: string): void {
  if (typeof window === 'undefined') {
    throw new Error('setStoredNickname() can only be called on the client');
  }
  localStorage.setItem(PLAYER_NICKNAME_KEY, nickname);
}

/**
 * Clear all player data (for testing/debugging)
 */
export function clearPlayerData(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(PLAYER_ID_KEY);
  localStorage.removeItem(PLAYER_NICKNAME_KEY);
}

/**
 * Get player identity (ID + nickname if stored)
 */
export function getPlayerIdentity() {
  return {
    playerId: getPlayerId(),
    nickname: getStoredNickname(),
  };
}

/**
 * Validate a UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
