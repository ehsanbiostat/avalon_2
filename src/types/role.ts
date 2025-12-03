/**
 * Role-related types for application use
 */

import type { Role } from './database';

/**
 * Role distribution ratios based on player count
 * Standard Avalon ratios:
 * 5p = 3G/2E, 6p = 4G/2E, 7p = 4G/3E, 8p = 5G/3E, 9p = 6G/3E, 10p = 6G/4E
 */
export interface RoleDistribution {
  good: number;
  evil: number;
}

/**
 * Role ratios by player count
 */
export type RoleRatios = Record<number, RoleDistribution>;

/**
 * Role display info
 */
export interface RoleInfo {
  role: Role;
  role_name: string;
  role_description: string;
  is_confirmed: boolean;
  evil_teammates?: string[];
}

/**
 * Role assignment for a player
 */
export interface PlayerRoleAssignment {
  player_id: string;
  role: Role;
}

/**
 * Role distribution result
 */
export interface DistributeRolesResponse {
  distributed: true;
  player_count: number;
  good_count: number;
  evil_count: number;
}

/**
 * Role confirmation response
 */
export interface ConfirmRoleResponse {
  confirmed: true;
  confirmations: {
    total: number;
    confirmed: number;
  };
  all_confirmed: boolean;
}

/**
 * Role display names
 */
export const ROLE_NAMES: Record<Role, string> = {
  good: 'Loyal Servant of Arthur',
  evil: 'Minion of Mordred',
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  good: 'You serve King Arthur and seek to complete quests for the good of Camelot. You do not know who the Minions of Mordred are.',
  evil: 'You serve Mordred and seek to sabotage the quests of Camelot. You know who your fellow Minions are.',
};
