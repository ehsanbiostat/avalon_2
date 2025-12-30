/**
 * Unit Tests: Evil Ring Visibility Mode (Feature 019)
 *
 * Tests the ring formation algorithm and visibility functions
 */

import { describe, it, expect } from 'vitest';
import {
  canEnableEvilRingVisibility,
  calculateNonOberonEvilCount,
  formEvilRing,
  getKnownTeammate,
  calculateHiddenCount,
  getNonOberonEvilIds,
} from '@/lib/domain/evil-ring-visibility';

describe('canEnableEvilRingVisibility', () => {
  it('should allow ring with 7+ players without Oberon (3 evil)', () => {
    const result = canEnableEvilRingVisibility(7);
    expect(result.canEnable).toBe(true);
    expect(result.nonOberonEvilCount).toBe(3);
  });

  it('should allow ring with 8 players without Oberon (3 evil)', () => {
    const result = canEnableEvilRingVisibility(8);
    expect(result.canEnable).toBe(true);
    expect(result.nonOberonEvilCount).toBe(3);
  });

  it('should allow ring with 10 players without Oberon (4 evil)', () => {
    const result = canEnableEvilRingVisibility(10);
    expect(result.canEnable).toBe(true);
    expect(result.nonOberonEvilCount).toBe(4);
  });

  it('should allow ring with 10 players with Oberon (4 evil - 1 = 3)', () => {
    const result = canEnableEvilRingVisibility(10, 'standard');
    expect(result.canEnable).toBe(true);
    expect(result.nonOberonEvilCount).toBe(3);
  });

  it('should NOT allow ring with 5 players (only 2 evil)', () => {
    const result = canEnableEvilRingVisibility(5);
    expect(result.canEnable).toBe(false);
    expect(result.nonOberonEvilCount).toBe(2);
    expect(result.reason).toContain('Requires 3+');
  });

  it('should NOT allow ring with 6 players (only 2 evil)', () => {
    const result = canEnableEvilRingVisibility(6);
    expect(result.canEnable).toBe(false);
    expect(result.nonOberonEvilCount).toBe(2);
  });

  it('should NOT allow ring with 7 players with Oberon (3 evil - 1 = 2)', () => {
    const result = canEnableEvilRingVisibility(7, 'standard');
    expect(result.canEnable).toBe(false);
    expect(result.nonOberonEvilCount).toBe(2);
  });

  it('should NOT allow ring with 8 players with Oberon (3 evil - 1 = 2)', () => {
    const result = canEnableEvilRingVisibility(8, 'chaos');
    expect(result.canEnable).toBe(false);
    expect(result.nonOberonEvilCount).toBe(2);
  });

  it('should return 0 for invalid player count', () => {
    const result = canEnableEvilRingVisibility(4);
    expect(result.canEnable).toBe(false);
    expect(result.nonOberonEvilCount).toBe(0);
  });
});

describe('calculateNonOberonEvilCount', () => {
  it('should return full evil count without Oberon', () => {
    expect(calculateNonOberonEvilCount(5)).toBe(2);
    expect(calculateNonOberonEvilCount(6)).toBe(2);
    expect(calculateNonOberonEvilCount(7)).toBe(3);
    expect(calculateNonOberonEvilCount(8)).toBe(3);
    expect(calculateNonOberonEvilCount(9)).toBe(3);
    expect(calculateNonOberonEvilCount(10)).toBe(4);
  });

  it('should subtract 1 for Oberon standard', () => {
    expect(calculateNonOberonEvilCount(7, 'standard')).toBe(2);
    expect(calculateNonOberonEvilCount(10, 'standard')).toBe(3);
  });

  it('should subtract 1 for Oberon chaos', () => {
    expect(calculateNonOberonEvilCount(7, 'chaos')).toBe(2);
    expect(calculateNonOberonEvilCount(10, 'chaos')).toBe(3);
  });
});

describe('formEvilRing', () => {
  it('should create a valid circular chain for 3 players', () => {
    const ids = ['A', 'B', 'C'];
    const ring = formEvilRing(ids);

    // Each player should know exactly one other
    expect(Object.keys(ring)).toHaveLength(3);

    // Follow the chain - should eventually return to start
    const visited = new Set<string>();
    let current = Object.keys(ring)[0];
    while (!visited.has(current)) {
      visited.add(current);
      current = ring[current];
    }

    // All 3 players should be visited
    expect(visited.size).toBe(3);
  });

  it('should create a valid circular chain for 4 players', () => {
    const ids = ['A', 'B', 'C', 'D'];
    const ring = formEvilRing(ids);

    // Each player should know exactly one other
    expect(Object.keys(ring)).toHaveLength(4);

    // Follow the chain
    const visited = new Set<string>();
    let current = Object.keys(ring)[0];
    while (!visited.has(current)) {
      visited.add(current);
      current = ring[current];
    }

    // All 4 players should be visited
    expect(visited.size).toBe(4);
  });

  it('should throw for less than 3 players', () => {
    expect(() => formEvilRing(['A', 'B'])).toThrow('at least 3');
    expect(() => formEvilRing(['A'])).toThrow('at least 3');
    expect(() => formEvilRing([])).toThrow('at least 3');
  });

  it('should never have a player know themselves', () => {
    const ids = ['A', 'B', 'C', 'D'];
    // Run multiple times to account for randomness
    for (let i = 0; i < 10; i++) {
      const ring = formEvilRing(ids);
      for (const [player, known] of Object.entries(ring)) {
        expect(player).not.toBe(known);
      }
    }
  });
});

describe('getKnownTeammate', () => {
  it('should return the known teammate ID', () => {
    const ring = { A: 'B', B: 'C', C: 'A' };
    expect(getKnownTeammate('A', ring)).toBe('B');
    expect(getKnownTeammate('B', ring)).toBe('C');
    expect(getKnownTeammate('C', ring)).toBe('A');
  });

  it('should return null for player not in ring', () => {
    const ring = { A: 'B', B: 'C', C: 'A' };
    expect(getKnownTeammate('D', ring)).toBeNull();
  });

  it('should return null for null ring assignments', () => {
    expect(getKnownTeammate('A', null)).toBeNull();
  });
});

describe('calculateHiddenCount', () => {
  it('should calculate hidden count for ring of 3 without Oberon', () => {
    // Ring of 3: you know yourself and 1 other, so 1 is hidden
    expect(calculateHiddenCount(3, false)).toBe(1);
  });

  it('should calculate hidden count for ring of 4 without Oberon', () => {
    // Ring of 4: you know yourself and 1 other, so 2 are hidden
    expect(calculateHiddenCount(4, false)).toBe(2);
  });

  it('should include Oberon in hidden count', () => {
    // Ring of 3 + Oberon: 1 hidden ring member + 1 Oberon = 2
    expect(calculateHiddenCount(3, true)).toBe(2);
    // Ring of 4 + Oberon: 2 hidden ring members + 1 Oberon = 3
    expect(calculateHiddenCount(4, true)).toBe(3);
  });
});

describe('getNonOberonEvilIds', () => {
  it('should return all IDs when no Oberon', () => {
    const ids = ['A', 'B', 'C'];
    expect(getNonOberonEvilIds(ids, null)).toEqual(ids);
  });

  it('should filter out Oberon ID', () => {
    const ids = ['A', 'B', 'C', 'D'];
    const result = getNonOberonEvilIds(ids, 'C');
    expect(result).toEqual(['A', 'B', 'D']);
    expect(result).not.toContain('C');
  });

  it('should handle Oberon not in the list', () => {
    const ids = ['A', 'B', 'C'];
    const result = getNonOberonEvilIds(ids, 'X');
    expect(result).toEqual(ids);
  });
});
