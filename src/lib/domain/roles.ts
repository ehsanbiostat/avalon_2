/**
 * Role distribution logic (pure functions)
 * Assigns roles based on Avalon standard ratios
 */

import { ROLE_RATIOS } from '@/lib/utils/constants';
import type { RoleDistribution } from '@/types/role';

export type Role = 'good' | 'evil';

export interface RoleAssignment {
  playerId: string;
  role: Role;
}

export interface RoleInfo {
  role: Role;
  role_name: string;
  role_description: string;
}

/**
 * Get role ratio for player count
 */
export function getRoleRatio(playerCount: number): RoleDistribution {
  const ratio = ROLE_RATIOS[playerCount];
  if (!ratio) {
    throw new Error(`Invalid player count: ${playerCount}. Must be 5-10.`);
  }
  return ratio;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * Creates a new array, doesn't mutate the original
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Distribute roles to players based on Avalon ratios
 * Returns array of role assignments
 */
export function distributeRoles(playerIds: string[]): RoleAssignment[] {
  const playerCount = playerIds.length;
  const ratio = getRoleRatio(playerCount);

  // Create role pool
  const roles: Role[] = [
    ...Array(ratio.good).fill('good' as Role),
    ...Array(ratio.evil).fill('evil' as Role),
  ];

  // Shuffle roles
  const shuffledRoles = shuffleArray(roles);

  // Shuffle players (for extra randomness)
  const shuffledPlayers = shuffleArray(playerIds);

  // Assign roles
  return shuffledPlayers.map((playerId, index) => ({
    playerId,
    role: shuffledRoles[index],
  }));
}

/**
 * Get human-readable role info
 */
export function getRoleInfo(role: Role): RoleInfo {
  if (role === 'good') {
    return {
      role: 'good',
      role_name: 'Loyal Servant of Arthur',
      role_description:
        'You are a loyal servant of King Arthur. Work with your fellow knights to complete quests and identify the traitors among you.',
    };
  }

  return {
    role: 'evil',
    role_name: 'Minion of Mordred',
    role_description:
      'You serve the dark lord Mordred. Sabotage the quests and avoid detection. You know who your fellow minions are.',
  };
}

/**
 * Validate role distribution
 * Ensures correct number of good/evil players
 */
export function validateRoleDistribution(
  assignments: RoleAssignment[],
  expectedCount: number
): { valid: boolean; error?: string } {
  if (assignments.length !== expectedCount) {
    return {
      valid: false,
      error: `Expected ${expectedCount} assignments, got ${assignments.length}`,
    };
  }

  const ratio = getRoleRatio(expectedCount);
  const goodCount = assignments.filter((a) => a.role === 'good').length;
  const evilCount = assignments.filter((a) => a.role === 'evil').length;

  if (goodCount !== ratio.good) {
    return {
      valid: false,
      error: `Expected ${ratio.good} good players, got ${goodCount}`,
    };
  }

  if (evilCount !== ratio.evil) {
    return {
      valid: false,
      error: `Expected ${ratio.evil} evil players, got ${evilCount}`,
    };
  }

  return { valid: true };
}
