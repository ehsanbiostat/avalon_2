/**
 * Quiz Eligibility unit tests
 * Feature 021: Parallel Merlin Quiz
 */

import { describe, it, expect } from 'vitest';
import {
  getQuizEligibility,
  getEligibleQuizPlayers,
  getEligibilityExplanation,
} from '@/lib/domain/quiz-eligibility';

describe('getQuizEligibility', () => {
  describe('Good win scenarios', () => {
    it('should make Assassin see assassination UI, not quiz', () => {
      const result = getQuizEligibility({
        outcome: 'good_win',
        playerSpecialRole: 'assassin',
        hasMorgana: false,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(false);
      expect(result.showAssassination).toBe(true);
      expect(result.showWaiting).toBe(false);
      expect(result.reason).toBe('is_assassin');
    });

    it('should let all players take quiz when no Assassin in game', () => {
      const result = getQuizEligibility({
        outcome: 'good_win',
        playerSpecialRole: 'merlin',
        hasMorgana: false,
        hasAssassin: false,
      });

      expect(result.canTakeQuiz).toBe(true);
      expect(result.showAssassination).toBe(false);
      expect(result.showWaiting).toBe(false);
      expect(result.reason).toBe('no_assassin_good_win');
    });

    it('should let non-Assassin Evil players take quiz', () => {
      const result = getQuizEligibility({
        outcome: 'good_win',
        playerSpecialRole: 'morgana',
        hasMorgana: true,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(true);
      expect(result.showAssassination).toBe(false);
      expect(result.reason).toBe('is_eligible');
    });

    it('should let Merlin take quiz on Good win', () => {
      const result = getQuizEligibility({
        outcome: 'good_win',
        playerSpecialRole: 'merlin',
        hasMorgana: false,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(true);
      expect(result.showAssassination).toBe(false);
      expect(result.reason).toBe('is_eligible');
    });

    it('should let Percival take quiz on Good win', () => {
      const result = getQuizEligibility({
        outcome: 'good_win',
        playerSpecialRole: 'percival',
        hasMorgana: true,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(true);
      expect(result.reason).toBe('is_eligible');
    });
  });

  describe('Evil win scenarios', () => {
    it('should exclude Merlin from quiz (knows themselves)', () => {
      const result = getQuizEligibility({
        outcome: 'evil_win',
        playerSpecialRole: 'merlin',
        hasMorgana: false,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(false);
      expect(result.showAssassination).toBe(false);
      expect(result.showWaiting).toBe(true);
      expect(result.reason).toBe('is_merlin');
    });

    it('should exclude Percival without Morgana (has certainty)', () => {
      const result = getQuizEligibility({
        outcome: 'evil_win',
        playerSpecialRole: 'percival',
        hasMorgana: false,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(false);
      expect(result.showWaiting).toBe(true);
      expect(result.reason).toBe('is_percival_certain');
    });

    it('should include Percival with Morgana (has uncertainty)', () => {
      const result = getQuizEligibility({
        outcome: 'evil_win',
        playerSpecialRole: 'percival',
        hasMorgana: true,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(true);
      expect(result.showWaiting).toBe(false);
      expect(result.reason).toBe('is_percival_uncertain');
    });

    it('should let Evil players take quiz on Evil win', () => {
      const result = getQuizEligibility({
        outcome: 'evil_win',
        playerSpecialRole: 'assassin',
        hasMorgana: false,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(true);
      expect(result.showAssassination).toBe(false);
      expect(result.reason).toBe('is_eligible');
    });

    it('should let regular Good players take quiz on Evil win', () => {
      const result = getQuizEligibility({
        outcome: 'evil_win',
        playerSpecialRole: 'servant',
        hasMorgana: false,
        hasAssassin: true,
      });

      expect(result.canTakeQuiz).toBe(true);
      expect(result.reason).toBe('is_eligible');
    });
  });
});

describe('getEligibleQuizPlayers', () => {
  const mockPlayers = [
    { id: 'p1', special_role: 'merlin' },
    { id: 'p2', special_role: 'percival' },
    { id: 'p3', special_role: 'servant' },
    { id: 'p4', special_role: 'assassin' },
    { id: 'p5', special_role: 'morgana' },
  ];

  it('should exclude only Assassin on Good win with Assassin', () => {
    const eligible = getEligibleQuizPlayers('good_win', mockPlayers, true);

    expect(eligible).toContain('p1'); // Merlin
    expect(eligible).toContain('p2'); // Percival
    expect(eligible).toContain('p3'); // Servant
    expect(eligible).not.toContain('p4'); // Assassin excluded
    expect(eligible).toContain('p5'); // Morgana
    expect(eligible).toHaveLength(4);
  });

  it('should include everyone on Good win without Assassin', () => {
    const playersNoAssassin = [
      { id: 'p1', special_role: 'merlin' },
      { id: 'p2', special_role: 'percival' },
      { id: 'p3', special_role: 'servant' },
      { id: 'p5', special_role: 'mordred' },
    ];

    const eligible = getEligibleQuizPlayers('good_win', playersNoAssassin, false);

    expect(eligible).toHaveLength(4);
    expect(eligible).toContain('p1');
    expect(eligible).toContain('p2');
    expect(eligible).toContain('p3');
    expect(eligible).toContain('p5');
  });

  it('should exclude Merlin and Percival (no Morgana) on Evil win', () => {
    const playersNoMorgana = [
      { id: 'p1', special_role: 'merlin' },
      { id: 'p2', special_role: 'percival' },
      { id: 'p3', special_role: 'servant' },
      { id: 'p4', special_role: 'assassin' },
      { id: 'p5', special_role: 'minion' },
    ];

    const eligible = getEligibleQuizPlayers('evil_win', playersNoMorgana, false);

    expect(eligible).not.toContain('p1'); // Merlin excluded
    expect(eligible).not.toContain('p2'); // Percival excluded (no Morgana)
    expect(eligible).toContain('p3'); // Servant
    expect(eligible).toContain('p4'); // Assassin
    expect(eligible).toContain('p5'); // Minion
    expect(eligible).toHaveLength(3);
  });

  it('should exclude only Merlin on Evil win with Morgana', () => {
    const eligible = getEligibleQuizPlayers('evil_win', mockPlayers, true);

    expect(eligible).not.toContain('p1'); // Merlin excluded
    expect(eligible).toContain('p2'); // Percival included (has uncertainty)
    expect(eligible).toContain('p3'); // Servant
    expect(eligible).toContain('p4'); // Assassin
    expect(eligible).toContain('p5'); // Morgana
    expect(eligible).toHaveLength(4);
  });
});

describe('getEligibilityExplanation', () => {
  it('should return correct explanation for Assassin', () => {
    expect(getEligibilityExplanation('is_assassin')).toContain('Assassin');
  });

  it('should return correct explanation for Merlin', () => {
    expect(getEligibilityExplanation('is_merlin')).toContain('Merlin');
  });

  it('should return correct explanation for Percival with certainty', () => {
    expect(getEligibilityExplanation('is_percival_certain')).toContain('Percival');
    expect(getEligibilityExplanation('is_percival_certain')).toContain('know');
  });

  it('should return correct explanation for Percival with uncertainty', () => {
    expect(getEligibilityExplanation('is_percival_uncertain')).toContain('Morgana');
  });

  it('should return correct explanation for eligible player', () => {
    expect(getEligibilityExplanation('is_eligible')).toContain('Merlin');
  });

  it('should return correct explanation for no-Assassin Good win', () => {
    expect(getEligibilityExplanation('no_assassin_good_win')).toContain('Good');
    expect(getEligibilityExplanation('no_assassin_good_win')).toContain('won');
  });
});
