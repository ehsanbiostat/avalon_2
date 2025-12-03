/**
 * Unit tests for visibility matrix domain logic
 * T017: Tests for getVisibilityForRole and related visibility functions
 */

import { describe, it, expect } from 'vitest';
import {
  getVisibilityForRole,
  getMerlinVisibility,
  getPercivalVisibility,
  getEvilVisibility,
  getOberonVisibility,
  getPlayersVisibleToMerlin,
  getMerlinCandidates,
  getEvilTeammatesExcludingOberon,
  countHiddenEvilFromMerlin,
  canSeeEvilTeammates,
  isVisibleToMerlin,
  appearsAsMerlinToPercival,
  type RoleAssignment,
} from '@/lib/domain/visibility';
import type { RoleConfig } from '@/types/role-config';

// Test data factory
function createAssignments(): RoleAssignment[] {
  return [
    { playerId: 'p1', playerName: 'Alice', role: 'good', specialRole: 'merlin' },
    { playerId: 'p2', playerName: 'Bob', role: 'good', specialRole: 'percival' },
    { playerId: 'p3', playerName: 'Carol', role: 'good', specialRole: 'servant' },
    { playerId: 'p4', playerName: 'Dave', role: 'evil', specialRole: 'assassin' },
    { playerId: 'p5', playerName: 'Eve', role: 'evil', specialRole: 'morgana' },
  ];
}

function createFullAssignments(): RoleAssignment[] {
  return [
    { playerId: 'p1', playerName: 'Alice', role: 'good', specialRole: 'merlin' },
    { playerId: 'p2', playerName: 'Bob', role: 'good', specialRole: 'percival' },
    { playerId: 'p3', playerName: 'Carol', role: 'good', specialRole: 'servant' },
    { playerId: 'p4', playerName: 'Dave', role: 'good', specialRole: 'servant' },
    { playerId: 'p5', playerName: 'Eve', role: 'evil', specialRole: 'assassin' },
    { playerId: 'p6', playerName: 'Frank', role: 'evil', specialRole: 'morgana' },
    { playerId: 'p7', playerName: 'Grace', role: 'evil', specialRole: 'mordred' },
  ];
}

describe('getMerlinVisibility', () => {
  it('sees all evil except Mordred', () => {
    const assignments = createFullAssignments();
    const config: RoleConfig = { percival: true, morgana: true, mordred: true };
    
    const result = getMerlinVisibility(assignments, config);
    
    expect(result.knownPlayers.map(p => p.name)).toContain('Eve'); // Assassin
    expect(result.knownPlayers.map(p => p.name)).toContain('Frank'); // Morgana
    expect(result.knownPlayers.map(p => p.name)).not.toContain('Grace'); // Mordred - hidden!
  });

  it('sees all evil except Oberon Chaos', () => {
    const assignments: RoleAssignment[] = [
      { playerId: 'p1', playerName: 'Alice', role: 'good', specialRole: 'merlin' },
      { playerId: 'p2', playerName: 'Bob', role: 'evil', specialRole: 'assassin' },
      { playerId: 'p3', playerName: 'Carol', role: 'evil', specialRole: 'oberon_chaos' },
    ];
    const config: RoleConfig = { oberon: 'chaos' };
    
    const result = getMerlinVisibility(assignments, config);
    
    expect(result.knownPlayers.map(p => p.name)).toContain('Bob'); // Assassin visible
    expect(result.knownPlayers.map(p => p.name)).not.toContain('Carol'); // Oberon Chaos hidden
  });

  it('sees Oberon Standard', () => {
    const assignments: RoleAssignment[] = [
      { playerId: 'p1', playerName: 'Alice', role: 'good', specialRole: 'merlin' },
      { playerId: 'p2', playerName: 'Bob', role: 'evil', specialRole: 'assassin' },
      { playerId: 'p3', playerName: 'Carol', role: 'evil', specialRole: 'oberon_standard' },
    ];
    const config: RoleConfig = { oberon: 'standard' };
    
    const result = getMerlinVisibility(assignments, config);
    
    expect(result.knownPlayers.map(p => p.name)).toContain('Carol'); // Oberon Standard visible
  });

  it('counts hidden evil correctly', () => {
    const config: RoleConfig = { mordred: true, oberon: 'chaos' };
    const result = getMerlinVisibility([], config);
    
    expect(result.hiddenEvilCount).toBe(2);
    expect(result.abilityNote).toContain('2 evil players are hidden');
  });

  it('has correct label', () => {
    const result = getMerlinVisibility([], {});
    expect(result.knownPlayersLabel).toBe('Evil Players Known to You');
  });
});

describe('getPercivalVisibility', () => {
  it('sees both Merlin and Morgana', () => {
    const assignments = createAssignments();
    const config: RoleConfig = { percival: true, morgana: true };
    
    const result = getPercivalVisibility(assignments, config);
    
    expect(result.knownPlayers).toHaveLength(2);
    expect(result.knownPlayers.map(p => p.name)).toContain('Alice'); // Merlin
    expect(result.knownPlayers.map(p => p.name)).toContain('Eve'); // Morgana
  });

  it('sees only Merlin when no Morgana', () => {
    const assignments: RoleAssignment[] = [
      { playerId: 'p1', playerName: 'Alice', role: 'good', specialRole: 'merlin' },
      { playerId: 'p2', playerName: 'Bob', role: 'good', specialRole: 'percival' },
      { playerId: 'p3', playerName: 'Carol', role: 'evil', specialRole: 'assassin' },
    ];
    const config: RoleConfig = { percival: true };
    
    const result = getPercivalVisibility(assignments, config);
    
    expect(result.knownPlayers).toHaveLength(1);
    expect(result.knownPlayers[0].name).toBe('Alice');
    expect(result.knownPlayersLabel).toBe('Merlin');
  });

  it('shows ambiguous label when multiple candidates', () => {
    const assignments = createAssignments();
    const config: RoleConfig = { percival: true, morgana: true };
    
    const result = getPercivalVisibility(assignments, config);
    
    expect(result.knownPlayersLabel).toBe('One of These is Merlin');
  });

  it('warns about Morgana when present', () => {
    const assignments = createAssignments();
    const config: RoleConfig = { morgana: true };
    
    const result = getPercivalVisibility(assignments, config);
    
    expect(result.abilityNote).toContain('Morgana appears the same');
  });
});

describe('getEvilVisibility', () => {
  it('assassin sees other evil except Oberon', () => {
    const assignments: RoleAssignment[] = [
      { playerId: 'p1', playerName: 'Alice', role: 'evil', specialRole: 'assassin' },
      { playerId: 'p2', playerName: 'Bob', role: 'evil', specialRole: 'morgana' },
      { playerId: 'p3', playerName: 'Carol', role: 'evil', specialRole: 'oberon_standard' },
    ];
    const config: RoleConfig = {};
    
    const result = getEvilVisibility('p1', 'assassin', assignments, config);
    
    expect(result.knownPlayers).toHaveLength(1); // Only Morgana
    expect(result.knownPlayers[0].name).toBe('Bob');
    expect(result.knownPlayers.map(p => p.name)).not.toContain('Carol'); // Oberon hidden
  });

  it('morgana shows disguise ability note when Percival present', () => {
    const config: RoleConfig = { percival: true, morgana: true };
    
    const result = getEvilVisibility('p1', 'morgana', [], config);
    
    expect(result.abilityNote).toContain('appear as Merlin to Percival');
  });

  it('morgana shows no effect note when no Percival', () => {
    const config: RoleConfig = { morgana: true };
    
    const result = getEvilVisibility('p1', 'morgana', [], config);
    
    expect(result.abilityNote).toContain('no effect');
  });

  it('mordred shows hidden from Merlin note', () => {
    const config: RoleConfig = { mordred: true };
    
    const result = getEvilVisibility('p1', 'mordred', [], config);
    
    expect(result.abilityNote).toContain('Merlin does not know you are evil');
  });

  it('assassin shows assassination ability note', () => {
    const result = getEvilVisibility('p1', 'assassin', [], {});
    
    expect(result.abilityNote).toContain('identify Merlin');
  });
});

describe('getOberonVisibility', () => {
  it('standard mode shows Merlin can see you', () => {
    const result = getOberonVisibility('standard', {});
    
    expect(result.knownPlayers).toHaveLength(0);
    expect(result.abilityNote).toContain('Merlin can see you');
  });

  it('chaos mode shows complete isolation', () => {
    const result = getOberonVisibility('chaos', {});
    
    expect(result.knownPlayers).toHaveLength(0);
    expect(result.abilityNote).toContain('not even Merlin');
  });
});

describe('getVisibilityForRole', () => {
  it('returns correct visibility for each role type', () => {
    const assignments = createAssignments();
    const config: RoleConfig = { percival: true, morgana: true };
    
    // Test Merlin
    const merlinResult = getVisibilityForRole('p1', 'merlin', assignments, config);
    expect(merlinResult.knownPlayersLabel).toBe('Evil Players Known to You');
    
    // Test Percival
    const percivalResult = getVisibilityForRole('p2', 'percival', assignments, config);
    expect(percivalResult.knownPlayersLabel).toBe('One of These is Merlin');
    
    // Test Servant
    const servantResult = getVisibilityForRole('p3', 'servant', assignments, config);
    expect(servantResult.knownPlayers).toHaveLength(0);
    
    // Test Assassin
    const assassinResult = getVisibilityForRole('p4', 'assassin', assignments, config);
    expect(assassinResult.knownPlayersLabel).toBe('Your Evil Teammates');
  });
});

describe('utility functions', () => {
  describe('getPlayersVisibleToMerlin', () => {
    it('excludes Mordred and Oberon Chaos', () => {
      const assignments: RoleAssignment[] = [
        { playerId: 'p1', playerName: 'A', role: 'evil', specialRole: 'assassin' },
        { playerId: 'p2', playerName: 'B', role: 'evil', specialRole: 'mordred' },
        { playerId: 'p3', playerName: 'C', role: 'evil', specialRole: 'oberon_chaos' },
        { playerId: 'p4', playerName: 'D', role: 'evil', specialRole: 'oberon_standard' },
      ];
      
      const visible = getPlayersVisibleToMerlin(assignments);
      
      expect(visible.map(p => p.name)).toEqual(['A', 'D']);
    });
  });

  describe('getMerlinCandidates', () => {
    it('returns Merlin and Morgana only', () => {
      const assignments: RoleAssignment[] = [
        { playerId: 'p1', playerName: 'Alice', role: 'good', specialRole: 'merlin' },
        { playerId: 'p2', playerName: 'Bob', role: 'good', specialRole: 'servant' },
        { playerId: 'p3', playerName: 'Carol', role: 'evil', specialRole: 'morgana' },
        { playerId: 'p4', playerName: 'Dave', role: 'evil', specialRole: 'assassin' },
      ];
      
      const candidates = getMerlinCandidates(assignments);
      
      expect(candidates.map(p => p.name)).toEqual(['Alice', 'Carol']);
    });
  });

  describe('getEvilTeammatesExcludingOberon', () => {
    it('excludes self and Oberon variants', () => {
      const assignments: RoleAssignment[] = [
        { playerId: 'p1', playerName: 'A', role: 'evil', specialRole: 'assassin' },
        { playerId: 'p2', playerName: 'B', role: 'evil', specialRole: 'morgana' },
        { playerId: 'p3', playerName: 'C', role: 'evil', specialRole: 'oberon_standard' },
        { playerId: 'p4', playerName: 'D', role: 'evil', specialRole: 'minion' },
      ];
      
      const teammates = getEvilTeammatesExcludingOberon(assignments, 'p1');
      
      expect(teammates.map(p => p.name)).toEqual(['B', 'D']);
    });
  });

  describe('countHiddenEvilFromMerlin', () => {
    it('counts Mordred as hidden', () => {
      expect(countHiddenEvilFromMerlin({ mordred: true })).toBe(1);
    });

    it('counts Oberon Chaos as hidden', () => {
      expect(countHiddenEvilFromMerlin({ oberon: 'chaos' })).toBe(1);
    });

    it('does not count Oberon Standard', () => {
      expect(countHiddenEvilFromMerlin({ oberon: 'standard' })).toBe(0);
    });

    it('counts both Mordred and Oberon Chaos', () => {
      expect(countHiddenEvilFromMerlin({ mordred: true, oberon: 'chaos' })).toBe(2);
    });
  });

  describe('canSeeEvilTeammates', () => {
    it('returns true for standard evil roles', () => {
      expect(canSeeEvilTeammates('assassin')).toBe(true);
      expect(canSeeEvilTeammates('morgana')).toBe(true);
      expect(canSeeEvilTeammates('mordred')).toBe(true);
      expect(canSeeEvilTeammates('minion')).toBe(true);
    });

    it('returns false for Oberon and good roles', () => {
      expect(canSeeEvilTeammates('oberon_standard')).toBe(false);
      expect(canSeeEvilTeammates('oberon_chaos')).toBe(false);
      expect(canSeeEvilTeammates('merlin')).toBe(false);
      expect(canSeeEvilTeammates('percival')).toBe(false);
      expect(canSeeEvilTeammates('servant')).toBe(false);
    });
  });

  describe('isVisibleToMerlin', () => {
    it('returns true for most evil roles', () => {
      expect(isVisibleToMerlin('assassin')).toBe(true);
      expect(isVisibleToMerlin('morgana')).toBe(true);
      expect(isVisibleToMerlin('oberon_standard')).toBe(true);
      expect(isVisibleToMerlin('minion')).toBe(true);
    });

    it('returns false for Mordred and Oberon Chaos', () => {
      expect(isVisibleToMerlin('mordred')).toBe(false);
      expect(isVisibleToMerlin('oberon_chaos')).toBe(false);
    });
  });

  describe('appearsAsMerlinToPercival', () => {
    it('returns true for Merlin and Morgana', () => {
      expect(appearsAsMerlinToPercival('merlin')).toBe(true);
      expect(appearsAsMerlinToPercival('morgana')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(appearsAsMerlinToPercival('percival')).toBe(false);
      expect(appearsAsMerlinToPercival('servant')).toBe(false);
      expect(appearsAsMerlinToPercival('assassin')).toBe(false);
      expect(appearsAsMerlinToPercival('mordred')).toBe(false);
    });
  });
});

