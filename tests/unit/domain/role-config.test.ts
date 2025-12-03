/**
 * Unit tests for role configuration domain logic
 * T011: Tests for validateRoleConfig, getRolesForConfig, computeRolesInPlay
 */

import { describe, it, expect } from 'vitest';
import {
  getDefaultConfig,
  validateRoleConfig,
  getRolesForConfig,
  computeRolesInPlay,
  getRoleDetails,
  isDefaultConfig,
  designateLadyOfLakeHolder,
} from '@/lib/domain/role-config';
import type { RoleConfig } from '@/types/role-config';

describe('getDefaultConfig', () => {
  it('returns empty config object', () => {
    const config = getDefaultConfig();
    expect(config).toEqual({});
  });
});

describe('validateRoleConfig', () => {
  describe('player count validation', () => {
    it('rejects player count below 5', () => {
      const result = validateRoleConfig({}, 4);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid player count: 4. Must be between 5 and 10.');
    });

    it('rejects player count above 10', () => {
      const result = validateRoleConfig({}, 11);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid player count: 11. Must be between 5 and 10.');
    });

    it('accepts valid player counts 5-10', () => {
      for (let count = 5; count <= 10; count++) {
        const result = validateRoleConfig({}, count);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  describe('good team slot validation', () => {
    it('accepts Percival in 5-player game (3 good slots)', () => {
      const result = validateRoleConfig({ percival: true }, 5);
      expect(result.valid).toBe(true);
    });

    it('accepts Percival in 10-player game (6 good slots)', () => {
      const result = validateRoleConfig({ percival: true }, 10);
      expect(result.valid).toBe(true);
    });
  });

  describe('evil team slot validation', () => {
    it('accepts Morgana in 5-player game (2 evil slots)', () => {
      const result = validateRoleConfig({ morgana: true }, 5);
      expect(result.valid).toBe(true);
    });

    it('rejects Morgana + Mordred + Oberon in 5-player game (only 2 evil slots)', () => {
      const result = validateRoleConfig(
        { morgana: true, mordred: true, oberon: 'standard' },
        5
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Too many Evil special roles'))).toBe(true);
    });

    it('accepts Morgana + Mordred + Oberon in 10-player game (4 evil slots)', () => {
      const result = validateRoleConfig(
        { morgana: true, mordred: true, oberon: 'standard' },
        10
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('balance warnings', () => {
    it('warns when Percival without Morgana', () => {
      const result = validateRoleConfig({ percival: true }, 5);
      expect(result.warnings).toContain('Percival works best with Morgana for balance.');
    });

    it('warns when Morgana without Percival', () => {
      const result = validateRoleConfig({ morgana: true }, 5);
      expect(result.warnings).toContain(
        "Morgana's disguise ability has no effect without Percival."
      );
    });

    it('no warnings when both Percival and Morgana', () => {
      const result = validateRoleConfig({ percival: true, morgana: true }, 5);
      expect(result.warnings).not.toContain('Percival works best with Morgana for balance.');
      expect(result.warnings).not.toContain(
        "Morgana's disguise ability has no effect without Percival."
      );
    });
  });

  describe('Lady of Lake warnings', () => {
    it('warns when Lady of Lake in small game', () => {
      const result = validateRoleConfig({ ladyOfLake: true }, 5);
      expect(result.warnings.some(w => w.includes('Lady of the Lake is recommended'))).toBe(true);
    });

    it('no warning when Lady of Lake in 7+ player game', () => {
      const result = validateRoleConfig({ ladyOfLake: true }, 7);
      expect(result.warnings.some(w => w.includes('Lady of the Lake is recommended'))).toBe(false);
    });
  });

  describe('hidden evil warnings', () => {
    it('warns when multiple evil hidden from Merlin', () => {
      const result = validateRoleConfig({ mordred: true, oberon: 'chaos' }, 7);
      expect(result.warnings.some(w => w.includes('hidden from Merlin'))).toBe(true);
    });

    it('no warning for single hidden evil', () => {
      const result = validateRoleConfig({ mordred: true }, 7);
      expect(result.warnings.some(w => w.includes('Multiple evil'))).toBe(false);
    });
  });
});

describe('getRolesForConfig', () => {
  it('returns Merlin + servants for empty config', () => {
    const roles = getRolesForConfig({}, 5);
    expect(roles.good).toContain('merlin');
    expect(roles.good.filter(r => r === 'servant')).toHaveLength(2);
    expect(roles.good).toHaveLength(3);
  });

  it('returns Assassin + minions for empty config', () => {
    const roles = getRolesForConfig({}, 5);
    expect(roles.evil).toContain('assassin');
    expect(roles.evil.filter(r => r === 'minion')).toHaveLength(1);
    expect(roles.evil).toHaveLength(2);
  });

  it('includes Percival when configured', () => {
    const roles = getRolesForConfig({ percival: true }, 5);
    expect(roles.good).toContain('percival');
  });

  it('includes Morgana when configured', () => {
    const roles = getRolesForConfig({ morgana: true }, 5);
    expect(roles.evil).toContain('morgana');
  });

  it('includes Mordred when configured', () => {
    const roles = getRolesForConfig({ mordred: true }, 7);
    expect(roles.evil).toContain('mordred');
  });

  it('includes oberon_standard when configured', () => {
    const roles = getRolesForConfig({ oberon: 'standard' }, 7);
    expect(roles.evil).toContain('oberon_standard');
    expect(roles.evil).not.toContain('oberon_chaos');
  });

  it('includes oberon_chaos when configured', () => {
    const roles = getRolesForConfig({ oberon: 'chaos' }, 7);
    expect(roles.evil).toContain('oberon_chaos');
    expect(roles.evil).not.toContain('oberon_standard');
  });

  it('produces correct counts for 5 players', () => {
    const roles = getRolesForConfig({}, 5);
    expect(roles.good).toHaveLength(3);
    expect(roles.evil).toHaveLength(2);
  });

  it('produces correct counts for 10 players', () => {
    const roles = getRolesForConfig({}, 10);
    expect(roles.good).toHaveLength(6);
    expect(roles.evil).toHaveLength(4);
  });

  it('throws for invalid player count', () => {
    expect(() => getRolesForConfig({}, 4)).toThrow('Invalid player count');
  });
});

describe('computeRolesInPlay', () => {
  it('always includes Merlin and Assassin', () => {
    const roles = computeRolesInPlay({});
    expect(roles).toContain('Merlin');
    expect(roles).toContain('Assassin');
  });

  it('includes Percival when configured', () => {
    const roles = computeRolesInPlay({ percival: true });
    expect(roles).toContain('Percival');
  });

  it('includes Morgana when configured', () => {
    const roles = computeRolesInPlay({ morgana: true });
    expect(roles).toContain('Morgana');
  });

  it('includes Mordred when configured', () => {
    const roles = computeRolesInPlay({ mordred: true });
    expect(roles).toContain('Mordred');
  });

  it('includes Oberon for standard mode', () => {
    const roles = computeRolesInPlay({ oberon: 'standard' });
    expect(roles).toContain('Oberon');
    expect(roles).not.toContain('Oberon (Chaos)');
  });

  it('includes Oberon (Chaos) for chaos mode', () => {
    const roles = computeRolesInPlay({ oberon: 'chaos' });
    expect(roles).toContain('Oberon (Chaos)');
    expect(roles).not.toContain('Oberon');
  });

  it('does not include servant/minion (filler roles)', () => {
    const roles = computeRolesInPlay({});
    expect(roles).not.toContain('Servant');
    expect(roles).not.toContain('Loyal Servant');
    expect(roles).not.toContain('Minion');
  });
});

describe('getRoleDetails', () => {
  it('returns correct counts for 5-player default config', () => {
    const details = getRoleDetails({}, 5);
    expect(details.goodCount).toBe(3);
    expect(details.evilCount).toBe(2);
    expect(details.goodSpecialCount).toBe(1); // Merlin only
    expect(details.evilSpecialCount).toBe(1); // Assassin only
    expect(details.servantCount).toBe(2);
    expect(details.minionCount).toBe(1);
  });

  it('returns correct counts with Percival + Morgana', () => {
    const details = getRoleDetails({ percival: true, morgana: true }, 5);
    expect(details.goodSpecialCount).toBe(2); // Merlin + Percival
    expect(details.evilSpecialCount).toBe(2); // Assassin + Morgana
    expect(details.servantCount).toBe(1);
    expect(details.minionCount).toBe(0);
  });

  it('returns correct counts for 10-player full config', () => {
    const details = getRoleDetails(
      { percival: true, morgana: true, mordred: true, oberon: 'standard' },
      10
    );
    expect(details.goodCount).toBe(6);
    expect(details.evilCount).toBe(4);
    expect(details.goodSpecialCount).toBe(2); // Merlin + Percival
    expect(details.evilSpecialCount).toBe(4); // Assassin + Morgana + Mordred + Oberon
    expect(details.servantCount).toBe(4);
    expect(details.minionCount).toBe(0);
  });
});

describe('isDefaultConfig', () => {
  it('returns true for empty config', () => {
    expect(isDefaultConfig({})).toBe(true);
  });

  it('returns false when Percival enabled', () => {
    expect(isDefaultConfig({ percival: true })).toBe(false);
  });

  it('returns false when Morgana enabled', () => {
    expect(isDefaultConfig({ morgana: true })).toBe(false);
  });

  it('returns false when Mordred enabled', () => {
    expect(isDefaultConfig({ mordred: true })).toBe(false);
  });

  it('returns false when Oberon enabled', () => {
    expect(isDefaultConfig({ oberon: 'standard' })).toBe(false);
  });

  it('returns false when Lady of Lake enabled', () => {
    expect(isDefaultConfig({ ladyOfLake: true })).toBe(false);
  });
});

describe('designateLadyOfLakeHolder', () => {
  it('returns player after manager in order', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const holder = designateLadyOfLakeHolder(players, 'p1');
    expect(holder).toBe('p2'); // Next after p1
  });

  it('wraps around to first player if manager is last', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const holder = designateLadyOfLakeHolder(players, 'p5');
    expect(holder).toBe('p1'); // Wraps to first
  });

  it('returns first player if manager not in list', () => {
    const players = ['p1', 'p2', 'p3'];
    const holder = designateLadyOfLakeHolder(players, 'unknown');
    expect(holder).toBe('p1');
  });

  it('throws if player list is empty', () => {
    expect(() => designateLadyOfLakeHolder([], 'p1')).toThrow();
  });

  it('handles manager in middle of list', () => {
    const players = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const holder = designateLadyOfLakeHolder(players, 'p3');
    expect(holder).toBe('p4');
  });
});

