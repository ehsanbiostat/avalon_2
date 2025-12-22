/**
 * Split Intel Mode Domain Logic
 * Feature 011: Merlin Split Intel Mode
 *
 * Merlin sees two groups:
 * - Certain Evil: Guaranteed evil players (0-2 players)
 * - Mixed Intel: 1 evil + 1 good player (Merlin doesn't know which is which)
 */

import type { RoleConfig } from '@/types/role-config';
import type { SplitIntelGroups, SplitIntelViability } from '@/types/game';
import type { RoleAssignment } from './visibility';
import { shuffleArray } from './decoy-selection';

/**
 * T007: Check if Split Intel Mode can be used with current role assignments
 * Returns viability status and reason if not viable
 */
export function canUseSplitIntelMode(
  assignments: RoleAssignment[],
  roleConfig: RoleConfig
): SplitIntelViability {
  // Count visible evil (exclude Mordred, Oberon Chaos)
  const visibleEvil = getVisibleEvilPlayers(assignments);

  if (visibleEvil.length === 0) {
    return {
      viable: false,
      visibleEvilCount: 0,
      reason:
        'Cannot use Split Intel Mode with current role configuration. All evil players are hidden from Merlin (Mordred + Oberon Chaos). Please disable Split Intel Mode or change role selection.',
    };
  }

  return { viable: true, visibleEvilCount: visibleEvil.length };
}

/**
 * T006: Distribute players into Split Intel groups
 * Returns null if Split Intel Mode cannot be used (0 visible evil)
 *
 * Group Distribution Algorithm:
 * - 3+ visible evil: 2 in Certain Evil, 1 in Mixed Intel
 * - 2 visible evil: 1 in Certain Evil, 1 in Mixed Intel
 * - 1 visible evil: 0 in Certain Evil, 1 in Mixed Intel
 * - 0 visible evil: Returns null (mode cannot be activated)
 */
export function distributeSplitIntelGroups(
  assignments: RoleAssignment[],
  roleConfig: RoleConfig
): SplitIntelGroups | null {
  // Check viability first
  const viability = canUseSplitIntelMode(assignments, roleConfig);
  if (!viability.viable) {
    return null;
  }

  // Get visible evil players (exclude Mordred, Oberon Chaos)
  const visibleEvil = getVisibleEvilPlayers(assignments);

  // Shuffle for randomness
  const shuffledEvil = shuffleArray([...visibleEvil]);

  // Determine group sizes based on visible evil count
  let certainEvilCount: number;
  if (shuffledEvil.length >= 3) {
    certainEvilCount = 2;
  } else if (shuffledEvil.length === 2) {
    certainEvilCount = 1;
  } else {
    certainEvilCount = 0; // Only 1 visible evil
  }

  // Split evil players between groups
  const certainEvilIds = shuffledEvil.slice(0, certainEvilCount).map((a) => a.playerId);
  const mixedEvilId = shuffledEvil[certainEvilCount].playerId;

  // Select random good player for mixed group (not Merlin)
  const eligibleGood = getEligibleGoodPlayers(assignments);
  if (eligibleGood.length === 0) {
    // This should never happen in a valid game configuration
    throw new Error('No eligible good players for mixed group');
  }

  const shuffledGood = shuffleArray([...eligibleGood]);
  const mixedGoodId = shuffledGood[0].playerId;

  return {
    certainEvilIds,
    mixedEvilId,
    mixedGoodId,
  };
}

/**
 * Get evil players visible to Merlin (excludes Mordred and Oberon Chaos)
 */
export function getVisibleEvilPlayers(assignments: RoleAssignment[]): RoleAssignment[] {
  return assignments.filter(
    (a) =>
      a.role === 'evil' &&
      a.specialRole !== 'mordred' &&
      a.specialRole !== 'oberon_chaos'
  );
}

/**
 * Get good players eligible for mixed group (excludes Merlin)
 */
export function getEligibleGoodPlayers(assignments: RoleAssignment[]): RoleAssignment[] {
  return assignments.filter((a) => a.role === 'good' && a.specialRole !== 'merlin');
}

/**
 * Count hidden evil players (Mordred + Oberon Chaos)
 */
export function countHiddenEvil(roleConfig: RoleConfig): number {
  return (roleConfig.mordred ? 1 : 0) + (roleConfig.oberon === 'chaos' ? 1 : 0);
}

/**
 * Validate split intel groups against assignments
 * Ensures all group members are valid for their group
 */
export function validateSplitIntelGroups(
  groups: SplitIntelGroups,
  assignments: RoleAssignment[]
): boolean {
  // Validate Certain Evil group - all must be visible evil
  for (const id of groups.certainEvilIds) {
    const assignment = assignments.find((a) => a.playerId === id);
    if (!assignment || assignment.role !== 'evil') return false;
    if (assignment.specialRole === 'mordred' || assignment.specialRole === 'oberon_chaos')
      return false;
  }

  // Validate Mixed Evil player - must be visible evil
  const mixedEvil = assignments.find((a) => a.playerId === groups.mixedEvilId);
  if (!mixedEvil || mixedEvil.role !== 'evil') return false;
  if (mixedEvil.specialRole === 'mordred' || mixedEvil.specialRole === 'oberon_chaos')
    return false;

  // Validate Mixed Good player - must be good and not Merlin
  const mixedGood = assignments.find((a) => a.playerId === groups.mixedGoodId);
  if (!mixedGood || mixedGood.role !== 'good') return false;
  if (mixedGood.specialRole === 'merlin') return false;

  return true;
}

