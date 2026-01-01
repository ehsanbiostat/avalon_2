/**
 * Feature 019: Evil Ring Visibility Mode
 *
 * In this mode, evil players only see ONE teammate each in a circular chain pattern.
 * Example: A→B→C→A (A knows B, B knows C, C knows A)
 *
 * Key rules:
 * - Oberon (standard and chaos) is excluded from the ring
 * - Each ring member sees only their one known teammate's NAME (not role)
 * - Hidden count includes Oberon and other ring members
 * - Ring assignments persist for the entire game
 */

import { shuffleArray } from './roles';
import { ROLE_RATIOS } from '@/lib/utils/constants';
import type { RoleConfig, OberonMode } from '@/types/role-config';
import type { EvilRingAssignments, EvilRingPrerequisite, EvilRingVisibility } from '@/types/game';

/**
 * T007: Check if Evil Ring Visibility Mode can be enabled
 *
 * Prerequisite: 3+ non-Oberon evil players
 * - 7+ players without Oberon: 3 evil → eligible
 * - 10 players with Oberon: 4 evil - 1 Oberon = 3 → eligible
 * - 7-9 players with Oberon: 3 evil - 1 Oberon = 2 → NOT eligible
 */
export function canEnableEvilRingVisibility(
  playerCount: number,
  oberon?: OberonMode
): EvilRingPrerequisite {
  const nonOberonEvilCount = calculateNonOberonEvilCount(playerCount, oberon);

  if (nonOberonEvilCount >= 3) {
    return {
      canEnable: true,
      nonOberonEvilCount,
    };
  }

  // Build helpful reason message
  let reason: string;
  if (oberon) {
    reason = `Requires 3+ non-Oberon evil players. With ${playerCount} players and Oberon, you have ${nonOberonEvilCount}.`;
  } else {
    reason = `Requires 3+ evil players. With ${playerCount} players, you have ${nonOberonEvilCount}.`;
  }

  return {
    canEnable: false,
    nonOberonEvilCount,
    reason,
  };
}

/**
 * T008: Calculate the number of non-Oberon evil players
 *
 * Uses ROLE_RATIOS to get evil count, then subtracts 1 if Oberon is enabled
 */
export function calculateNonOberonEvilCount(
  playerCount: number,
  oberon?: OberonMode
): number {
  const ratio = ROLE_RATIOS[playerCount as keyof typeof ROLE_RATIOS];
  if (!ratio) {
    return 0;
  }

  const totalEvil = ratio.evil;
  const oberonCount = oberon ? 1 : 0;

  return totalEvil - oberonCount;
}

/**
 * T009: Form the evil ring - creates circular chain of visibility
 *
 * Algorithm:
 * 1. Shuffle the evil player IDs to randomize ring order
 * 2. Create circular chain: each player knows the next one
 *
 * @param nonOberonEvilIds - Array of evil player IDs (excluding Oberon)
 * @returns Map of player ID → known teammate ID
 *
 * Example: [A, B, C] shuffled to [B, C, A]
 * Result: { B: C, C: A, A: B }
 */
export function formEvilRing(nonOberonEvilIds: string[]): EvilRingAssignments {
  if (nonOberonEvilIds.length < 3) {
    throw new Error('Evil Ring requires at least 3 non-Oberon evil players');
  }

  // Shuffle to randomize ring order
  const shuffled = shuffleArray([...nonOberonEvilIds]);

  // Create circular chain: each player knows the next one
  const ringAssignments: EvilRingAssignments = {};
  for (let i = 0; i < shuffled.length; i++) {
    const currentPlayer = shuffled[i];
    const nextPlayer = shuffled[(i + 1) % shuffled.length];
    ringAssignments[currentPlayer] = nextPlayer;
  }

  return ringAssignments;
}

/**
 * T010: Get the known teammate for a specific evil player
 *
 * @param playerId - The evil player's ID
 * @param ringAssignments - The ring assignments map
 * @returns The ID of the player's known teammate, or null if not in ring
 */
export function getKnownTeammate(
  playerId: string,
  ringAssignments: EvilRingAssignments | null
): string | null {
  if (!ringAssignments) {
    return null;
  }
  return ringAssignments[playerId] ?? null;
}

/**
 * T011: Calculate how many evil players are hidden from a ring member
 *
 * Hidden count = (ring size - 1) + (1 if Oberon present)
 * - Each ring member knows only 1 teammate, so ringSize - 1 are hidden
 * - Oberon is always hidden (not in ring, and Oberon doesn't know others)
 *
 * @param ringSize - Number of players in the ring
 * @param hasOberon - Whether Oberon is in the game
 * @returns Number of hidden evil players
 */
export function calculateHiddenCount(ringSize: number, hasOberon: boolean): number {
  // Ring members hidden = ringSize - 1 (knows 1, self + that 1 = 2, rest hidden)
  // But actually: you know yourself and 1 other, so hidden = ringSize - 2
  // Plus Oberon if present
  const hiddenRingMembers = ringSize - 2; // You know yourself and 1 teammate
  const oberonHidden = hasOberon ? 1 : 0;

  return hiddenRingMembers + oberonHidden;
}

/**
 * Build the ring visibility data for an evil player's role reveal
 *
 * @param playerId - The evil player's ID
 * @param ringAssignments - The ring assignments map
 * @param knownTeammateName - The name of the known teammate (fetched from players table)
 * @param ringSize - Total ring members (non-Oberon evil count)
 * @param hasOberon - Whether Oberon is in the game
 */
export function buildEvilRingVisibility(
  playerId: string,
  ringAssignments: EvilRingAssignments,
  knownTeammateName: string,
  ringSize: number,
  hasOberon: boolean
): EvilRingVisibility {
  const knownTeammateId = ringAssignments[playerId];

  if (!knownTeammateId) {
    throw new Error(`Player ${playerId} not found in ring assignments`);
  }

  return {
    enabled: true,
    knownTeammate: {
      id: knownTeammateId,
      name: knownTeammateName,
    },
    hiddenCount: calculateHiddenCount(ringSize, hasOberon),
    explanation: 'Ring Visibility Mode: You only know one teammate.',
  };
}

/**
 * Check if Evil Ring Visibility Mode should be auto-disabled
 * when Oberon is toggled or player count changes.
 *
 * Used by RoleConfigPanel to determine if auto-disable notification is needed.
 */
export function shouldAutoDisableRing(
  currentConfig: RoleConfig,
  newPlayerCount: number,
  newOberon?: OberonMode
): { shouldDisable: boolean; reason?: string } {
  if (!currentConfig.evil_ring_visibility_enabled) {
    return { shouldDisable: false };
  }

  const prereq = canEnableEvilRingVisibility(newPlayerCount, newOberon);
  if (!prereq.canEnable) {
    return {
      shouldDisable: true,
      reason: prereq.reason || 'Prerequisites no longer met',
    };
  }

  return { shouldDisable: false };
}

/**
 * Get all player IDs that should be in the evil ring
 * (all evil players except Oberon)
 *
 * @param evilPlayerIds - All evil player IDs
 * @param oberonId - Oberon's player ID (if present)
 * @returns Array of non-Oberon evil player IDs
 */
export function getNonOberonEvilIds(
  evilPlayerIds: string[],
  oberonId: string | null
): string[] {
  if (!oberonId) {
    return evilPlayerIds;
  }
  return evilPlayerIds.filter((id) => id !== oberonId);
}
