/**
 * Decoy Selection Logic
 * Feature 009: Merlin Decoy Mode
 *
 * Pure functions for selecting and validating decoy players.
 * The decoy is a random good player (not Merlin) who appears evil to Merlin.
 */

import type { RoleAssignment } from './visibility';

/**
 * Result of decoy selection
 */
export interface DecoySelectionResult {
  playerId: string;
  playerName: string;
}

/**
 * T010: Check if a role assignment is eligible to be a decoy
 * Criteria: Must be good player AND must not be Merlin
 */
export function isEligibleForDecoy(assignment: RoleAssignment): boolean {
  return assignment.role === 'good' && assignment.specialRole !== 'merlin';
}

/**
 * T011: Get all players eligible to be the decoy
 * Returns all good players except Merlin
 */
export function getEligibleDecoyPlayers(
  assignments: RoleAssignment[]
): RoleAssignment[] {
  return assignments.filter(isEligibleForDecoy);
}

/**
 * T009: Select a random decoy player from role assignments
 * Returns the player ID of the selected decoy
 *
 * Selection rules:
 * - Must be a good player
 * - Must not be Merlin (Merlin can't see themselves as evil)
 * - Uses uniform random distribution
 *
 * @throws Error if no eligible players found (shouldn't happen in valid games)
 */
export function selectDecoyPlayer(
  assignments: RoleAssignment[]
): DecoySelectionResult {
  const eligiblePlayers = getEligibleDecoyPlayers(assignments);

  // T046: Defensive error handling for edge case
  if (eligiblePlayers.length === 0) {
    throw new Error(
      'No eligible players for decoy selection. This should not happen in a valid game configuration.'
    );
  }

  // Uniform random selection
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
  const selected = eligiblePlayers[randomIndex];

  return {
    playerId: selected.playerId,
    playerName: selected.playerName,
  };
}

/**
 * Validate that a given player ID is a valid decoy selection
 * Used for verification after selection
 */
export function validateDecoySelection(
  decoyPlayerId: string,
  assignments: RoleAssignment[]
): boolean {
  const assignment = assignments.find(a => a.playerId === decoyPlayerId);

  if (!assignment) {
    return false; // Player not in game
  }

  return isEligibleForDecoy(assignment);
}

/**
 * Get the count of eligible decoy candidates for a player count
 * Useful for UI display and validation
 *
 * Formula: Good count - 1 (excluding Merlin)
 */
export function getEligibleDecoyCount(playerCount: number): number {
  // Good count by player count (from ROLE_RATIOS)
  const goodCounts: Record<number, number> = {
    5: 3,  // 3 good, 2 eligible (excluding Merlin)
    6: 4,  // 4 good, 3 eligible
    7: 4,  // 4 good, 3 eligible
    8: 5,  // 5 good, 4 eligible
    9: 6,  // 6 good, 5 eligible
    10: 6, // 6 good, 5 eligible
  };

  const goodCount = goodCounts[playerCount];
  if (goodCount === undefined) {
    return 0;
  }

  return goodCount - 1; // -1 for Merlin
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * Used to shuffle Merlin's player list after decoy injection
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
