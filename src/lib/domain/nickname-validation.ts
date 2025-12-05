/**
 * Nickname validation domain logic
 * Phase 6: Player Recovery & Reconnection
 *
 * Pure functions for validating player nicknames.
 */

// ============================================
// CONSTANTS
// ============================================

/** Minimum nickname length */
export const NICKNAME_MIN_LENGTH = 3;

/** Maximum nickname length */
export const NICKNAME_MAX_LENGTH = 20;

/** Pattern for valid nickname characters: letters, numbers, underscore, hyphen */
export const NICKNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** All validation error messages */
export const NICKNAME_ERROR_MESSAGES = {
  tooShort: `Nickname must be at least ${NICKNAME_MIN_LENGTH} characters`,
  tooLong: `Nickname must be at most ${NICKNAME_MAX_LENGTH} characters`,
  invalidChars: 'Nickname can only contain letters, numbers, underscores, and hyphens',
  taken: 'This nickname is already taken',
  empty: 'Nickname is required',
} as const;

// ============================================
// VALIDATION TYPES
// ============================================

export interface NicknameValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate a nickname against all rules
 *
 * @param nickname - The nickname to validate
 * @returns Validation result with valid flag and any error messages
 *
 * @example
 * validateNickname('Player1');  // { valid: true, errors: [] }
 * validateNickname('ab');       // { valid: false, errors: ['Nickname must be at least 3 characters'] }
 * validateNickname('Player@1'); // { valid: false, errors: ['Nickname can only contain...'] }
 */
export function validateNickname(nickname: string): NicknameValidationResult {
  const errors: string[] = [];

  // Check if nickname is provided
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, errors: [NICKNAME_ERROR_MESSAGES.empty] };
  }

  const trimmed = nickname.trim();

  // Check minimum length
  if (trimmed.length < NICKNAME_MIN_LENGTH) {
    errors.push(NICKNAME_ERROR_MESSAGES.tooShort);
  }

  // Check maximum length
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    errors.push(NICKNAME_ERROR_MESSAGES.tooLong);
  }

  // Check valid characters
  if (!NICKNAME_PATTERN.test(trimmed)) {
    errors.push(NICKNAME_ERROR_MESSAGES.invalidChars);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Quick check if a nickname is valid (no error messages returned)
 *
 * @param nickname - The nickname to validate
 * @returns true if valid, false otherwise
 */
export function isValidNickname(nickname: string): boolean {
  return validateNickname(nickname).valid;
}

/**
 * Normalize a nickname for comparison (lowercase, trimmed)
 *
 * @param nickname - The nickname to normalize
 * @returns Normalized nickname for case-insensitive comparison
 */
export function normalizeNickname(nickname: string): string {
  return nickname.trim().toLowerCase();
}

/**
 * Check if two nicknames are the same (case-insensitive)
 *
 * @param a - First nickname
 * @param b - Second nickname
 * @returns true if nicknames are equivalent
 */
export function nicknamesMatch(a: string, b: string): boolean {
  return normalizeNickname(a) === normalizeNickname(b);
}
