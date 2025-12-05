/**
 * Feature 007: Real-Time Team Selection Visibility
 * Domain logic for validating draft team selections
 */

import type { DraftValidationResult } from '@/types/game';

/**
 * Validates a draft team selection
 * 
 * @param teamMemberIds - Array of player database IDs
 * @param requiredSize - Quest team size requirement
 * @param seatingOrder - Valid player IDs in the game
 * @returns Validation result with error message if invalid
 */
export function validateDraftSelection(
  teamMemberIds: string[],
  requiredSize: number,
  seatingOrder: string[]
): DraftValidationResult {
  // Check if array is provided
  if (!Array.isArray(teamMemberIds)) {
    return {
      valid: false,
      error: 'team_member_ids must be an array'
    };
  }

  // Check team size (allow 0 to required size)
  if (teamMemberIds.length > requiredSize) {
    return {
      valid: false,
      error: `Team size must be ${requiredSize} or fewer for this quest (received ${teamMemberIds.length})`
    };
  }

  // Validate all player IDs exist in game
  for (const playerId of teamMemberIds) {
    if (!seatingOrder.includes(playerId)) {
      return {
        valid: false,
        error: `Player ${playerId} is not in this game`
      };
    }
  }

  // Check for duplicates
  const uniqueIds = new Set(teamMemberIds);
  if (uniqueIds.size !== teamMemberIds.length) {
    return {
      valid: false,
      error: 'Team contains duplicate player IDs'
    };
  }

  return { valid: true };
}

/**
 * Helper function to determine if a draft is in progress
 * 
 * @param draftTeam - The draft team array (may be null or undefined)
 * @returns true if draft is in progress (non-null and non-empty)
 */
export function isDraftInProgress(draftTeam: string[] | null | undefined): boolean {
  return draftTeam !== null && draftTeam !== undefined && draftTeam.length > 0;
}

/**
 * Normalizes a draft team array by removing duplicates and preserving order
 * 
 * @param teamMemberIds - Potentially duplicate or unordered IDs
 * @returns Deduplicated array maintaining selection order
 */
export function normalizeDraftTeam(teamMemberIds: string[]): string[] {
  if (!Array.isArray(teamMemberIds)) {
    return [];
  }

  // Use Set to remove duplicates while preserving insertion order
  return Array.from(new Set(teamMemberIds));
}

