/**
 * Room code generation utility
 * Generates unique, non-guessable room codes
 */

/**
 * Characters used in room codes
 * Excludes easily confused characters (0/O, 1/I/L)
 */
const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Length of generated room codes
 */
export const ROOM_CODE_LENGTH = 6;

/**
 * Generate a random room code
 * @returns A 6-character alphanumeric code (e.g., "ABC123")
 */
export function generateRoomCode(): string {
  let code = '';

  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[randomIndex];
  }

  return code;
}

/**
 * Generate a cryptographically secure room code
 * Uses crypto.getRandomValues for better randomness
 */
export function generateSecureRoomCode(): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    // Fallback to basic random if crypto not available
    return generateRoomCode();
  }

  const array = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(array);

  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[array[i] % ROOM_CODE_CHARS.length];
  }

  return code;
}

/**
 * Validate a room code format
 * @param code - The code to validate
 * @returns Whether the code is a valid format
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || code.length !== ROOM_CODE_LENGTH) {
    return false;
  }

  const upperCode = code.toUpperCase();
  return upperCode.split('').every(char => ROOM_CODE_CHARS.includes(char));
}

/**
 * Normalize a room code (uppercase, trimmed)
 * @param code - The code to normalize
 * @returns The normalized code
 */
export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Format a room code for display (with optional grouping)
 * @param code - The code to format
 * @returns Formatted code (e.g., "ABC-123")
 */
export function formatRoomCode(code: string): string {
  const normalized = normalizeRoomCode(code);
  if (normalized.length !== ROOM_CODE_LENGTH) {
    return normalized;
  }
  // Split into two groups of 3
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}
