/**
 * Oberon Split Intel Mode Domain Logic
 * Feature 018: Oberon Split Intel Mode
 *
 * A variant of Merlin Split Intel where:
 * - Oberon is ALWAYS in the mixed group (not random)
 * - Certain Evil group contains other visible evil (Morgana, Assassin)
 * - Prerequisite: Oberon Standard must be enabled
 */

import type { RoleConfig } from '@/types/role-config';
import type { OberonSplitIntelGroups, OberonSplitIntelPrerequisite } from '@/types/game';
import type { RoleAssignment } from './visibility';
import { shuffleArray } from './decoy-selection';

/**
 * T008: Check if Oberon Split Intel Mode can be used with current role config
 * Prerequisite: Oberon Standard must be enabled (not Oberon Chaos or no Oberon)
 */
export function canUseOberonSplitIntelMode(
  roleConfig: RoleConfig
): OberonSplitIntelPrerequisite {
  // Check prerequisite: Oberon Standard must be enabled
  if (!roleConfig.oberon) {
    return {
      canUse: false,
      reason: 'Requires Oberon (Standard) to be enabled',
    };
  }

  if (roleConfig.oberon === 'chaos') {
    return {
      canUse: false,
      reason: 'Not available with Oberon (Chaos) - Oberon must be visible to Merlin',
    };
  }

  return { canUse: true };
}

/**
 * T009: Distribute players into Oberon Split Intel groups
 * Oberon is ALWAYS in the mixed group; other visible evil goes to Certain group
 *
 * Group Distribution:
 * - Certain Evil: Morgana, Assassin, other visible evil (NOT Oberon, NOT Mordred)
 * - Mixed Intel: Oberon + 1 random good player (not Merlin)
 */
export function distributeOberonSplitIntelGroups(
  assignments: RoleAssignment[],
  roleConfig: RoleConfig
): OberonSplitIntelGroups {
  // Check prerequisite first
  const prerequisite = canUseOberonSplitIntelMode(roleConfig);
  if (!prerequisite.canUse) {
    throw new Error(prerequisite.reason || 'Oberon Split Intel prerequisites not met');
  }

  // 1. Find Oberon (always goes to mixed group)
  const oberon = assignments.find((a) => a.specialRole === 'oberon_standard');
  if (!oberon) {
    throw new Error('Oberon Standard not found in assignments');
  }

  // 2. Get other visible evil players (Morgana, Assassin) - go to Certain group
  // Exclude Oberon and Mordred (Mordred is hidden from Merlin)
  const certainEvil = assignments.filter(
    (a) =>
      a.role === 'evil' &&
      a.specialRole !== 'oberon_standard' &&
      a.specialRole !== 'mordred' &&
      a.specialRole !== 'oberon_chaos' // Should never happen but be safe
  );

  // 3. Select random good player for Mixed group (not Merlin)
  const eligibleGood = assignments.filter(
    (a) => a.role === 'good' && a.specialRole !== 'merlin'
  );

  if (eligibleGood.length === 0) {
    throw new Error('No eligible good players for mixed group');
  }

  const shuffledGood = shuffleArray([...eligibleGood]);
  const mixedGood = shuffledGood[0];

  return {
    certainEvilIds: certainEvil.map((a) => a.playerId),
    oberonId: oberon.playerId,
    mixedGoodId: mixedGood.playerId,
  };
}

/**
 * Get Oberon from assignments (utility function)
 */
export function findOberonPlayer(
  assignments: RoleAssignment[]
): RoleAssignment | undefined {
  return assignments.find((a) => a.specialRole === 'oberon_standard');
}

/**
 * Get visible evil players excluding Oberon (for Certain Evil group)
 */
export function getCertainEvilPlayers(
  assignments: RoleAssignment[]
): RoleAssignment[] {
  return assignments.filter(
    (a) =>
      a.role === 'evil' &&
      a.specialRole !== 'oberon_standard' &&
      a.specialRole !== 'mordred' &&
      a.specialRole !== 'oberon_chaos'
  );
}

/**
 * Get good players eligible for mixed group (excludes Merlin)
 */
export function getEligibleGoodPlayersForMixed(
  assignments: RoleAssignment[]
): RoleAssignment[] {
  return assignments.filter(
    (a) => a.role === 'good' && a.specialRole !== 'merlin'
  );
}

/**
 * Count hidden evil players for Oberon Split Intel Mode
 * Only Mordred is hidden (Oberon is visible in this mode)
 */
export function countHiddenEvilForOberonSplitIntel(roleConfig: RoleConfig): number {
  // Oberon Chaos should not be possible with Oberon Split Intel enabled
  // but we count it for safety
  return (roleConfig.mordred ? 1 : 0);
}

/**
 * Validate oberon split intel groups against assignments
 * Ensures all group members are valid for their group
 */
export function validateOberonSplitIntelGroups(
  groups: OberonSplitIntelGroups,
  assignments: RoleAssignment[]
): boolean {
  // Validate Oberon - must be oberon_standard
  const oberon = assignments.find((a) => a.playerId === groups.oberonId);
  if (!oberon || oberon.specialRole !== 'oberon_standard') return false;

  // Validate Certain Evil group - all must be visible evil (not Oberon, not Mordred)
  for (const id of groups.certainEvilIds) {
    const assignment = assignments.find((a) => a.playerId === id);
    if (!assignment || assignment.role !== 'evil') return false;
    if (
      assignment.specialRole === 'oberon_standard' ||
      assignment.specialRole === 'mordred' ||
      assignment.specialRole === 'oberon_chaos'
    ) {
      return false;
    }
  }

  // Validate Mixed Good player - must be good and not Merlin
  const mixedGood = assignments.find((a) => a.playerId === groups.mixedGoodId);
  if (!mixedGood || mixedGood.role !== 'good') return false;
  if (mixedGood.specialRole === 'merlin') return false;

  return true;
}
