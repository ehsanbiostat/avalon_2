/**
 * Role Configuration Types for Phase 2
 * Defines the structure for configurable special roles
 */

/**
 * Oberon mode variants
 * - 'standard': Visible to Merlin, invisible to/from other evil
 * - 'chaos': Invisible to everyone including Merlin
 */
export type OberonMode = 'standard' | 'chaos';

/**
 * Role configuration stored in rooms.role_config JSONB column
 * Empty object {} = MVP behavior (Merlin + Assassin only)
 * Merlin and Assassin are always implicitly included
 */
export interface RoleConfig {
  // Optional Good roles (max 1 each)
  percival?: boolean;

  // Optional Evil roles (max 1 each)
  morgana?: boolean;
  mordred?: boolean;
  oberon?: OberonMode;

  // Game options
  ladyOfLake?: boolean;

  // Feature 009: Merlin Decoy Mode
  // When enabled, one random good player (not Merlin) appears evil to Merlin
  merlin_decoy_enabled?: boolean;

  // Feature 011: Merlin Split Intel Mode
  // When enabled, Merlin sees two groups: Certain Evil (guaranteed evil) and Mixed Intel (1 evil + 1 good)
  // Mutually exclusive with merlin_decoy_enabled
  merlin_split_intel_enabled?: boolean;

  // Feature 018: Oberon Split Intel Mode
  // When enabled, Oberon is ALWAYS in the mixed group with one random good player
  // Certain Evil group contains other visible evil (Morgana, Assassin)
  // Prerequisite: oberon === 'standard' (not available with Oberon Chaos or no Oberon)
  // Mutually exclusive with merlin_decoy_enabled AND merlin_split_intel_enabled
  oberon_split_intel_enabled?: boolean;
}

/**
 * Default role configuration (MVP behavior)
 */
export const DEFAULT_ROLE_CONFIG: RoleConfig = {
  merlin_decoy_enabled: false,
  merlin_split_intel_enabled: false,
  oberon_split_intel_enabled: false,
};

/**
 * Role configuration validation result
 */
export interface RoleConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Role configuration with computed properties
 */
export interface RoleConfigDetails extends RoleConfig {
  // Computed: list of all roles that will be in play
  rolesInPlay: string[];

  // Computed: counts by team
  goodSpecialCount: number;  // Merlin + Percival (if enabled)
  evilSpecialCount: number;  // Assassin + Morgana + Mordred + Oberon

  // Computed: total slots needed
  goodSlotsNeeded: number;
  evilSlotsNeeded: number;
}

/**
 * Role configuration for API requests
 */
export interface RoleConfigRequest {
  percival?: boolean;
  morgana?: boolean;
  mordred?: boolean;
  oberon?: OberonMode;
  ladyOfLake?: boolean;
}

/**
 * Role configuration for API responses (includes computed fields)
 */
export interface RoleConfigResponse {
  config: RoleConfig;
  rolesInPlay: string[];
  ladyOfLakeEnabled: boolean;
  ladyOfLakeHolderId: string | null;
  ladyOfLakeHolderName: string | null;
}

/**
 * Type guard to check if oberon mode is valid
 */
export function isValidOberonMode(mode: unknown): mode is OberonMode {
  return mode === 'standard' || mode === 'chaos';
}

/**
 * Type guard to check if role config is valid structure
 */
export function isValidRoleConfig(config: unknown): config is RoleConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const c = config as Record<string, unknown>;

  // Check optional boolean fields
  if (c.percival !== undefined && typeof c.percival !== 'boolean') return false;
  if (c.morgana !== undefined && typeof c.morgana !== 'boolean') return false;
  if (c.mordred !== undefined && typeof c.mordred !== 'boolean') return false;
  if (c.ladyOfLake !== undefined && typeof c.ladyOfLake !== 'boolean') return false;
  if (c.merlin_decoy_enabled !== undefined && typeof c.merlin_decoy_enabled !== 'boolean') return false;
  if (c.merlin_split_intel_enabled !== undefined && typeof c.merlin_split_intel_enabled !== 'boolean') return false;
  if (c.oberon_split_intel_enabled !== undefined && typeof c.oberon_split_intel_enabled !== 'boolean') return false;

  // Check oberon mode
  if (c.oberon !== undefined && !isValidOberonMode(c.oberon)) return false;

  return true;
}
