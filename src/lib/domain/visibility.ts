/**
 * Visibility Matrix Logic
 * Pure functions for determining what each role can see
 * 
 * Visibility Matrix:
 * -----------------
 * Merlin:          Sees all evil EXCEPT Mordred and Oberon (Chaos)
 * Percival:        Sees Merlin + Morgana (can't tell apart)
 * Loyal Servant:   Sees nothing special
 * Assassin:        Sees evil teammates (except Oberon)
 * Morgana:         Sees evil teammates (except Oberon)
 * Mordred:         Sees evil teammates (except Oberon)
 * Oberon Standard: Sees nothing (but Merlin sees them)
 * Oberon Chaos:    Sees nothing (and NO ONE sees them)
 * Minion:          Sees evil teammates (except Oberon)
 */

import type { SpecialRole } from '@/types/database';
import type { RoleConfig } from '@/types/role-config';

/**
 * Role assignment for visibility calculations
 */
export interface RoleAssignment {
  playerId: string;
  playerName: string;
  role: 'good' | 'evil';
  specialRole: SpecialRole;
}

/**
 * Visibility result for a role
 */
export interface VisibilityResult {
  knownPlayers: Array<{ id: string; name: string }>;
  knownPlayersLabel: string;
  hiddenEvilCount: number;
  abilityNote?: string;
}

/**
 * T012: Main visibility function - determines what a role can see
 */
export function getVisibilityForRole(
  myPlayerId: string,
  mySpecialRole: SpecialRole,
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig
): VisibilityResult {
  switch (mySpecialRole) {
    case 'merlin':
      return getMerlinVisibility(allAssignments, roleConfig);
    case 'percival':
      return getPercivalVisibility(allAssignments, roleConfig);
    case 'servant':
      return getServantVisibility();
    case 'assassin':
    case 'morgana':
    case 'mordred':
    case 'minion':
      return getEvilVisibility(myPlayerId, mySpecialRole, allAssignments, roleConfig);
    case 'oberon_standard':
      return getOberonVisibility('standard', roleConfig);
    case 'oberon_chaos':
      return getOberonVisibility('chaos', roleConfig);
    default:
      return {
        knownPlayers: [],
        knownPlayersLabel: '',
        hiddenEvilCount: 0,
      };
  }
}

/**
 * T013: Merlin's visibility - sees evil except Mordred and Oberon Chaos
 */
export function getMerlinVisibility(
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig
): VisibilityResult {
  // Merlin sees evil players except Mordred and Oberon Chaos
  const visibleEvil = allAssignments.filter(a => 
    a.role === 'evil' &&
    a.specialRole !== 'mordred' &&
    a.specialRole !== 'oberon_chaos'
  );

  // Count hidden evil (Mordred + Oberon Chaos if present)
  const hiddenCount = 
    (roleConfig.mordred ? 1 : 0) + 
    (roleConfig.oberon === 'chaos' ? 1 : 0);

  let abilityNote: string | undefined;
  if (hiddenCount === 1) {
    abilityNote = 'One evil player is hidden from you!';
  } else if (hiddenCount >= 2) {
    abilityNote = `${hiddenCount} evil players are hidden from you!`;
  }

  return {
    knownPlayers: visibleEvil.map(a => ({ id: a.playerId, name: a.playerName })),
    knownPlayersLabel: 'Evil Players Known to You',
    hiddenEvilCount: hiddenCount,
    abilityNote,
  };
}

/**
 * T14: Percival's visibility - sees Merlin + Morgana (can't distinguish)
 */
export function getPercivalVisibility(
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig
): VisibilityResult {
  // Percival sees players who appear as Merlin (Merlin + Morgana)
  const merlinCandidates = allAssignments.filter(a =>
    a.specialRole === 'merlin' || a.specialRole === 'morgana'
  );

  let abilityNote: string;
  if (roleConfig.morgana) {
    abilityNote = 'Protect Merlin, but beware - Morgana appears the same to you!';
  } else {
    abilityNote = 'Protect Merlin at all costs!';
  }

  return {
    knownPlayers: merlinCandidates.map(a => ({ id: a.playerId, name: a.playerName })),
    knownPlayersLabel: merlinCandidates.length > 1 
      ? 'One of These is Merlin' 
      : 'Merlin',
    hiddenEvilCount: 0,
    abilityNote,
  };
}

/**
 * Servant visibility - sees nothing special
 */
function getServantVisibility(): VisibilityResult {
  return {
    knownPlayers: [],
    knownPlayersLabel: '',
    hiddenEvilCount: 0,
    abilityNote: 'Stay vigilant! Work with your fellow knights to identify the traitors.',
  };
}

/**
 * T15: Evil team visibility - sees teammates except Oberon
 */
export function getEvilVisibility(
  myPlayerId: string,
  mySpecialRole: SpecialRole,
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig
): VisibilityResult {
  // Evil players see each other, except Oberon (both variants)
  const visibleTeammates = allAssignments.filter(a =>
    a.role === 'evil' &&
    a.playerId !== myPlayerId &&
    a.specialRole !== 'oberon_standard' &&
    a.specialRole !== 'oberon_chaos'
  );

  // Role-specific ability notes
  let abilityNote: string;
  switch (mySpecialRole) {
    case 'assassin':
      abilityNote = 'If Good wins 3 quests, you get one chance to identify Merlin!';
      break;
    case 'morgana':
      if (roleConfig.percival) {
        abilityNote = 'You appear as Merlin to Percival. Use this to confuse and deceive!';
      } else {
        abilityNote = 'Percival is not in this game, so your disguise ability has no effect.';
      }
      break;
    case 'mordred':
      abilityNote = 'Merlin does not know you are evil. Lead from the shadows!';
      break;
    case 'minion':
    default:
      abilityNote = 'Work with your fellow minions to sabotage the quests!';
      break;
  }

  return {
    knownPlayers: visibleTeammates.map(a => ({ id: a.playerId, name: a.playerName })),
    knownPlayersLabel: 'Your Evil Teammates',
    hiddenEvilCount: 0,
    abilityNote,
  };
}

/**
 * T16: Oberon visibility - works alone
 */
export function getOberonVisibility(
  mode: 'standard' | 'chaos',
  roleConfig: RoleConfig
): VisibilityResult {
  const abilityNote = mode === 'standard'
    ? "You work alone. Your teammates don't know you, and you don't know them. Merlin can see you."
    : 'Complete isolation! No one knows you are evil - not even Merlin! Work alone to sabotage the quests.';

  return {
    knownPlayers: [],
    knownPlayersLabel: '',
    hiddenEvilCount: 0,
    abilityNote,
  };
}

/**
 * Get players visible to Merlin (utility function)
 */
export function getPlayersVisibleToMerlin(
  assignments: RoleAssignment[]
): Array<{ id: string; name: string }> {
  return assignments
    .filter(a => 
      a.role === 'evil' &&
      a.specialRole !== 'mordred' &&
      a.specialRole !== 'oberon_chaos'
    )
    .map(a => ({ id: a.playerId, name: a.playerName }));
}

/**
 * Get Merlin candidates for Percival (utility function)
 */
export function getMerlinCandidates(
  assignments: RoleAssignment[]
): Array<{ id: string; name: string }> {
  return assignments
    .filter(a => a.specialRole === 'merlin' || a.specialRole === 'morgana')
    .map(a => ({ id: a.playerId, name: a.playerName }));
}

/**
 * Get evil teammates excluding Oberon (utility function)
 */
export function getEvilTeammatesExcludingOberon(
  assignments: RoleAssignment[],
  excludePlayerId: string
): Array<{ id: string; name: string }> {
  return assignments
    .filter(a =>
      a.role === 'evil' &&
      a.playerId !== excludePlayerId &&
      a.specialRole !== 'oberon_standard' &&
      a.specialRole !== 'oberon_chaos'
    )
    .map(a => ({ id: a.playerId, name: a.playerName }));
}

/**
 * Count evil players hidden from Merlin
 */
export function countHiddenEvilFromMerlin(roleConfig: RoleConfig): number {
  return (
    (roleConfig.mordred ? 1 : 0) +
    (roleConfig.oberon === 'chaos' ? 1 : 0)
  );
}

/**
 * Check if a role can see evil teammates
 */
export function canSeeEvilTeammates(specialRole: SpecialRole): boolean {
  return (
    specialRole === 'assassin' ||
    specialRole === 'morgana' ||
    specialRole === 'mordred' ||
    specialRole === 'minion'
  );
}

/**
 * Check if a role is visible to Merlin
 */
export function isVisibleToMerlin(specialRole: SpecialRole): boolean {
  return (
    specialRole !== 'mordred' &&
    specialRole !== 'oberon_chaos'
  );
}

/**
 * Check if a role appears as Merlin to Percival
 */
export function appearsAsMerlinToPercival(specialRole: SpecialRole): boolean {
  return specialRole === 'merlin' || specialRole === 'morgana';
}

