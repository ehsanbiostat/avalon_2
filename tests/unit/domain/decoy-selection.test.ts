/**
 * Unit Tests: Decoy Selection Logic
 * Feature 009: Merlin Decoy Mode
 */

import { describe, it, expect, vi } from 'vitest';
import {
  isEligibleForDecoy,
  getEligibleDecoyPlayers,
  selectDecoyPlayer,
  validateDecoySelection,
  getEligibleDecoyCount,
  shuffleArray,
} from '@/lib/domain/decoy-selection';
import type { RoleAssignment } from '@/lib/domain/visibility';

// Test data: 7-player game
const createTestAssignments = (): RoleAssignment[] => [
  { playerId: 'p1', playerName: 'Alice', role: 'good', specialRole: 'merlin' },
  { playerId: 'p2', playerName: 'Bob', role: 'good', specialRole: 'percival' },
  { playerId: 'p3', playerName: 'Charlie', role: 'good', specialRole: 'servant' },
  { playerId: 'p4', playerName: 'Diana', role: 'good', specialRole: 'servant' },
  { playerId: 'p5', playerName: 'Eve', role: 'evil', specialRole: 'assassin' },
  { playerId: 'p6', playerName: 'Frank', role: 'evil', specialRole: 'morgana' },
  { playerId: 'p7', playerName: 'Grace', role: 'evil', specialRole: 'minion' },
];

describe('isEligibleForDecoy', () => {
  it('returns true for good servant', () => {
    const assignment: RoleAssignment = {
      playerId: 'p1',
      playerName: 'Test',
      role: 'good',
      specialRole: 'servant',
    };
    expect(isEligibleForDecoy(assignment)).toBe(true);
  });

  it('returns true for good percival', () => {
    const assignment: RoleAssignment = {
      playerId: 'p1',
      playerName: 'Test',
      role: 'good',
      specialRole: 'percival',
    };
    expect(isEligibleForDecoy(assignment)).toBe(true);
  });

  // T050: Decoy selection excludes Merlin
  it('returns false for Merlin', () => {
    const assignment: RoleAssignment = {
      playerId: 'p1',
      playerName: 'Test',
      role: 'good',
      specialRole: 'merlin',
    };
    expect(isEligibleForDecoy(assignment)).toBe(false);
  });

  it('returns false for evil players', () => {
    const evilRoles: RoleAssignment['specialRole'][] = [
      'assassin',
      'morgana',
      'mordred',
      'minion',
      'oberon_standard',
      'oberon_chaos',
    ];

    for (const role of evilRoles) {
      const assignment: RoleAssignment = {
        playerId: 'p1',
        playerName: 'Test',
        role: 'evil',
        specialRole: role,
      };
      expect(isEligibleForDecoy(assignment)).toBe(false);
    }
  });
});

describe('getEligibleDecoyPlayers', () => {
  it('returns only good players excluding Merlin', () => {
    const assignments = createTestAssignments();
    const eligible = getEligibleDecoyPlayers(assignments);

    expect(eligible).toHaveLength(3); // Bob (Percival), Charlie (Servant), Diana (Servant)
    expect(eligible.map(e => e.playerId)).toEqual(['p2', 'p3', 'p4']);
  });

  it('returns empty array if only Merlin on good team', () => {
    const assignments: RoleAssignment[] = [
      { playerId: 'p1', playerName: 'Merlin', role: 'good', specialRole: 'merlin' },
      { playerId: 'p2', playerName: 'Evil1', role: 'evil', specialRole: 'assassin' },
    ];
    const eligible = getEligibleDecoyPlayers(assignments);
    expect(eligible).toHaveLength(0);
  });
});

describe('selectDecoyPlayer', () => {
  it('selects a player from eligible pool', () => {
    const assignments = createTestAssignments();
    const result = selectDecoyPlayer(assignments);

    // Should be one of the eligible players
    const eligibleIds = ['p2', 'p3', 'p4'];
    expect(eligibleIds).toContain(result.playerId);
  });

  it('throws error if no eligible players', () => {
    const assignments: RoleAssignment[] = [
      { playerId: 'p1', playerName: 'Merlin', role: 'good', specialRole: 'merlin' },
      { playerId: 'p2', playerName: 'Evil1', role: 'evil', specialRole: 'assassin' },
    ];

    expect(() => selectDecoyPlayer(assignments)).toThrow(
      'No eligible players for decoy selection'
    );
  });

  // T051: Uniform distribution check (statistical)
  it('selects with approximately uniform distribution', () => {
    const assignments = createTestAssignments();
    const selections: Record<string, number> = { p2: 0, p3: 0, p4: 0 };
    const iterations = 3000;

    for (let i = 0; i < iterations; i++) {
      const result = selectDecoyPlayer(assignments);
      selections[result.playerId]++;
    }

    // Each player should be selected approximately 1/3 of the time
    // Allow 15% variance for randomness
    const expected = iterations / 3;
    const tolerance = expected * 0.15;

    for (const count of Object.values(selections)) {
      expect(count).toBeGreaterThan(expected - tolerance);
      expect(count).toBeLessThan(expected + tolerance);
    }
  });
});

describe('validateDecoySelection', () => {
  it('returns true for valid decoy selection', () => {
    const assignments = createTestAssignments();
    expect(validateDecoySelection('p2', assignments)).toBe(true); // Percival
    expect(validateDecoySelection('p3', assignments)).toBe(true); // Servant
  });

  it('returns false for Merlin', () => {
    const assignments = createTestAssignments();
    expect(validateDecoySelection('p1', assignments)).toBe(false); // Merlin
  });

  it('returns false for evil players', () => {
    const assignments = createTestAssignments();
    expect(validateDecoySelection('p5', assignments)).toBe(false); // Assassin
    expect(validateDecoySelection('p6', assignments)).toBe(false); // Morgana
  });

  it('returns false for unknown player', () => {
    const assignments = createTestAssignments();
    expect(validateDecoySelection('unknown', assignments)).toBe(false);
  });
});

describe('getEligibleDecoyCount', () => {
  it('returns correct count for each player count', () => {
    expect(getEligibleDecoyCount(5)).toBe(2);  // 3 good - 1 Merlin
    expect(getEligibleDecoyCount(6)).toBe(3);  // 4 good - 1 Merlin
    expect(getEligibleDecoyCount(7)).toBe(3);  // 4 good - 1 Merlin
    expect(getEligibleDecoyCount(8)).toBe(4);  // 5 good - 1 Merlin
    expect(getEligibleDecoyCount(9)).toBe(5);  // 6 good - 1 Merlin
    expect(getEligibleDecoyCount(10)).toBe(5); // 6 good - 1 Merlin
  });

  it('returns 0 for invalid player count', () => {
    expect(getEligibleDecoyCount(4)).toBe(0);
    expect(getEligibleDecoyCount(11)).toBe(0);
  });
});

describe('shuffleArray', () => {
  it('returns array with same elements', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);

    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it('does not modify original array', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffleArray(original);

    expect(original).toEqual(copy);
  });

  it('produces different orderings over multiple calls', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const orderings = new Set<string>();

    for (let i = 0; i < 100; i++) {
      orderings.add(shuffleArray(original).join(','));
    }

    // Should have multiple unique orderings
    expect(orderings.size).toBeGreaterThan(10);
  });
});
