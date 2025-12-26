/**
 * Role Configuration Domain Logic
 * Pure functions for validating and computing role configurations
 */

import { ROLE_RATIOS, SPECIAL_ROLES, LADY_OF_LAKE_MIN_RECOMMENDED } from '@/lib/utils/constants';
import type { RoleConfig, RoleConfigValidation } from '@/types/role-config';
import type { SpecialRole } from '@/types/database';
import type { RoleDistribution } from '@/types/role';

/**
 * T009: Get default role configuration (MVP behavior)
 * Empty config means Merlin + Assassin only
 */
export function getDefaultConfig(): RoleConfig {
  return {};
}

/**
 * T007: Validate role configuration against player count
 * Returns validation result with errors and warnings
 */
export function validateRoleConfig(
  config: RoleConfig,
  playerCount: number
): RoleConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate player count
  if (playerCount < 5 || playerCount > 10) {
    errors.push(`Invalid player count: ${playerCount}. Must be between 5 and 10.`);
    return { valid: false, errors, warnings };
  }

  const ratio = ROLE_RATIOS[playerCount];
  if (!ratio) {
    errors.push(`No role ratio defined for ${playerCount} players.`);
    return { valid: false, errors, warnings };
  }

  // Feature 011 + 018: Check triple mutual exclusivity of Merlin intel modes
  const intelModes = [
    config.merlin_decoy_enabled,
    config.merlin_split_intel_enabled,
    config.oberon_split_intel_enabled,
  ].filter(Boolean).length;

  if (intelModes > 1) {
    errors.push('Only one intel mode can be active: Merlin Decoy, Split Intel, or Oberon Split Intel. Choose one.');
  }

  // Feature 018: Check Oberon Split Intel prerequisites
  if (config.oberon_split_intel_enabled) {
    if (!config.oberon) {
      errors.push('Oberon Split Intel Mode requires Oberon (Standard) to be enabled.');
    } else if (config.oberon === 'chaos') {
      errors.push('Oberon Split Intel Mode is not available with Oberon (Chaos) - Oberon must be visible to Merlin.');
    }
  }

  // Count special roles by team
  const goodSpecials = countGoodSpecials(config);
  const evilSpecials = countEvilSpecials(config);

  // Validate good team slots
  // Merlin is always included (1 slot), plus optionally Percival (1 slot)
  const goodSlotsNeeded = 1 + (config.percival ? 1 : 0);
  if (goodSlotsNeeded > ratio.good) {
    errors.push(
      `Too many Good special roles (${goodSlotsNeeded}) for ${playerCount}-player game (max ${ratio.good} Good).`
    );
  }

  // Validate evil team slots
  // Assassin is always included (1 slot), plus optional evil roles
  const evilSlotsNeeded = 1 + evilSpecials;
  if (evilSlotsNeeded > ratio.evil) {
    errors.push(
      `Too many Evil special roles (${evilSlotsNeeded}) for ${playerCount}-player game (max ${ratio.evil} Evil).`
    );
  }

  // Add balance warnings (non-blocking)
  if (config.percival && !config.morgana) {
    warnings.push('Percival works best with Morgana for balance.');
  }

  if (config.morgana && !config.percival) {
    warnings.push("Morgana's disguise ability has no effect without Percival.");
  }

  // Lady of Lake warning for small games
  if (config.ladyOfLake && playerCount < LADY_OF_LAKE_MIN_RECOMMENDED) {
    warnings.push(
      `Lady of the Lake is recommended for ${LADY_OF_LAKE_MIN_RECOMMENDED}+ players.`
    );
  }

  // Multiple hidden evil warning for Merlin
  const hiddenFromMerlin = (config.mordred ? 1 : 0) + (config.oberon === 'chaos' ? 1 : 0);
  if (hiddenFromMerlin >= 2) {
    warnings.push('Multiple evil players hidden from Merlin may make the game very difficult for Good.');
  }

  // Feature 011: Warning for Split Intel Mode with hidden evil configuration
  if (config.merlin_split_intel_enabled && hiddenFromMerlin >= 2) {
    warnings.push('Split Intel Mode with multiple hidden evil players means fewer players in Certain Evil group.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Count optional good special roles in config (excluding Merlin which is always included)
 */
function countGoodSpecials(config: RoleConfig): number {
  let count = 0;
  if (config.percival) count++;
  return count;
}

/**
 * Count optional evil special roles in config (excluding Assassin which is always included)
 */
function countEvilSpecials(config: RoleConfig): number {
  let count = 0;
  if (config.morgana) count++;
  if (config.mordred) count++;
  if (config.oberon) count++;
  return count;
}

/**
 * T008: Get list of special roles for a configuration
 * Returns the complete list of roles to distribute
 */
export function getRolesForConfig(
  config: RoleConfig,
  playerCount: number
): { good: SpecialRole[]; evil: SpecialRole[] } {
  const ratio = ROLE_RATIOS[playerCount];
  if (!ratio) {
    throw new Error(`Invalid player count: ${playerCount}`);
  }

  // Build good team roles
  const goodRoles: SpecialRole[] = ['merlin']; // Always included
  if (config.percival) goodRoles.push('percival');

  // Fill remaining good slots with servants
  while (goodRoles.length < ratio.good) {
    goodRoles.push('servant');
  }

  // Build evil team roles
  const evilRoles: SpecialRole[] = ['assassin']; // Always included
  if (config.morgana) evilRoles.push('morgana');
  if (config.mordred) evilRoles.push('mordred');
  if (config.oberon === 'standard') evilRoles.push('oberon_standard');
  if (config.oberon === 'chaos') evilRoles.push('oberon_chaos');

  // Fill remaining evil slots with minions
  while (evilRoles.length < ratio.evil) {
    evilRoles.push('minion');
  }

  return { good: goodRoles, evil: evilRoles };
}

/**
 * T010: Compute human-readable list of roles in play
 * Returns display names for UI
 */
export function computeRolesInPlay(config: RoleConfig): string[] {
  const roles: string[] = [];

  // Good team (always Merlin)
  roles.push('Merlin');
  if (config.percival) roles.push('Percival');

  // Evil team (always Assassin)
  roles.push('Assassin');
  if (config.morgana) roles.push('Morgana');
  if (config.mordred) roles.push('Mordred');
  if (config.oberon === 'standard') roles.push('Oberon');
  if (config.oberon === 'chaos') roles.push('Oberon (Chaos)');

  return roles;
}

/**
 * Compute detailed role counts for a configuration
 */
export function getRoleDetails(
  config: RoleConfig,
  playerCount: number
): {
  goodCount: number;
  evilCount: number;
  goodSpecialCount: number;
  evilSpecialCount: number;
  servantCount: number;
  minionCount: number;
} {
  const ratio = ROLE_RATIOS[playerCount];
  if (!ratio) {
    throw new Error(`Invalid player count: ${playerCount}`);
  }

  // Count special roles
  const goodSpecialCount = 1 + (config.percival ? 1 : 0); // Merlin + optional Percival
  const evilSpecialCount =
    1 + // Assassin
    (config.morgana ? 1 : 0) +
    (config.mordred ? 1 : 0) +
    (config.oberon ? 1 : 0);

  return {
    goodCount: ratio.good,
    evilCount: ratio.evil,
    goodSpecialCount,
    evilSpecialCount,
    servantCount: ratio.good - goodSpecialCount,
    minionCount: ratio.evil - evilSpecialCount,
  };
}

/**
 * Get role distribution ratio for player count
 */
export function getRoleRatioForCount(playerCount: number): RoleDistribution | null {
  return ROLE_RATIOS[playerCount] || null;
}

/**
 * Check if a role configuration is empty (MVP default)
 */
export function isDefaultConfig(config: RoleConfig): boolean {
  return (
    !config.percival &&
    !config.morgana &&
    !config.mordred &&
    !config.oberon &&
    !config.ladyOfLake &&
    !config.merlin_decoy_enabled &&
    !config.merlin_split_intel_enabled &&
    !config.oberon_split_intel_enabled
  );
}

/**
 * T037: Designate Lady of the Lake holder
 * Returns the player ID who should start with Lady of the Lake
 * Holder is the player to the left of the room manager (next in join order)
 */
export function designateLadyOfLakeHolder(
  playerIds: string[],       // Ordered by join time
  managerId: string
): string {
  if (playerIds.length === 0) {
    throw new Error('No players to designate Lady of the Lake holder');
  }

  const managerIndex = playerIds.indexOf(managerId);
  if (managerIndex === -1) {
    // Manager not found, default to first player after manager would be first player
    return playerIds[0];
  }

  // Holder is the next player in order (wraps around)
  const holderIndex = (managerIndex + 1) % playerIds.length;
  return playerIds[holderIndex];
}

/**
 * Get special role info for display
 */
export function getSpecialRoleInfo(role: SpecialRole) {
  return SPECIAL_ROLES[role];
}
