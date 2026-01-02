/**
 * Unit Tests: Lunatic & Brute Quest Action Validation
 * Feature 020: Big Box expansion roles
 */

import { describe, it, expect } from 'vitest';
import {
  validateQuestAction,
  getQuestActionConstraints,
} from '@/lib/domain/quest-resolver';
import { ERROR_CODES } from '@/lib/utils/constants';

describe('validateQuestAction', () => {
  describe('Lunatic constraints', () => {
    it('Lunatic cannot submit success action on any quest', () => {
      for (let questNumber = 1; questNumber <= 5; questNumber++) {
        const result = validateQuestAction('evil', 'success', 'lunatic', questNumber);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe(ERROR_CODES.LUNATIC_MUST_FAIL);
        expect(result.error).toBe('The Lunatic must play Fail on every quest');
      }
    });

    it('Lunatic can submit fail action on any quest', () => {
      for (let questNumber = 1; questNumber <= 5; questNumber++) {
        const result = validateQuestAction('evil', 'fail', 'lunatic', questNumber);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });
  });

  describe('Brute constraints', () => {
    it('Brute can submit fail action on quest 1', () => {
      const result = validateQuestAction('evil', 'fail', 'brute', 1);
      expect(result.valid).toBe(true);
    });

    it('Brute can submit fail action on quest 2', () => {
      const result = validateQuestAction('evil', 'fail', 'brute', 2);
      expect(result.valid).toBe(true);
    });

    it('Brute can submit fail action on quest 3', () => {
      const result = validateQuestAction('evil', 'fail', 'brute', 3);
      expect(result.valid).toBe(true);
    });

    it('Brute cannot submit fail action on quest 4', () => {
      const result = validateQuestAction('evil', 'fail', 'brute', 4);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.BRUTE_CANNOT_FAIL_LATE_QUEST);
      expect(result.error).toBe('The Brute cannot play Fail on Quest 4 or 5');
    });

    it('Brute cannot submit fail action on quest 5', () => {
      const result = validateQuestAction('evil', 'fail', 'brute', 5);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe(ERROR_CODES.BRUTE_CANNOT_FAIL_LATE_QUEST);
    });

    it('Brute can submit success action on any quest', () => {
      for (let questNumber = 1; questNumber <= 5; questNumber++) {
        const result = validateQuestAction('evil', 'success', 'brute', questNumber);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });
  });

  describe('Good player constraints (unchanged)', () => {
    it('Good players cannot submit fail action', () => {
      const result = validateQuestAction('good', 'fail', 'servant', 1);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Good players can only submit success');
    });

    it('Good players can submit success action', () => {
      const result = validateQuestAction('good', 'success', 'servant', 1);
      expect(result.valid).toBe(true);
    });
  });

  describe('Regular evil player constraints (unchanged)', () => {
    it('Regular evil players can submit fail action', () => {
      const result = validateQuestAction('evil', 'fail', 'minion', 1);
      expect(result.valid).toBe(true);
    });

    it('Regular evil players can submit success action', () => {
      const result = validateQuestAction('evil', 'success', 'assassin', 1);
      expect(result.valid).toBe(true);
    });
  });
});

describe('getQuestActionConstraints', () => {
  describe('Lunatic constraints', () => {
    it('returns canSuccess: false, canFail: true for Lunatic on any quest', () => {
      for (let questNumber = 1; questNumber <= 5; questNumber++) {
        const constraints = getQuestActionConstraints('evil', 'lunatic', questNumber);
        expect(constraints.canSuccess).toBe(false);
        expect(constraints.canFail).toBe(true);
        expect(constraints.constraintReason).toBe('As the Lunatic, you must play Fail');
      }
    });
  });

  describe('Brute constraints', () => {
    it('returns both options available for Brute on quests 1-3', () => {
      for (let questNumber = 1; questNumber <= 3; questNumber++) {
        const constraints = getQuestActionConstraints('evil', 'brute', questNumber);
        expect(constraints.canSuccess).toBe(true);
        expect(constraints.canFail).toBe(true);
        expect(constraints.constraintReason).toBeUndefined();
      }
    });

    it('returns canSuccess: true, canFail: false for Brute on quest 4', () => {
      const constraints = getQuestActionConstraints('evil', 'brute', 4);
      expect(constraints.canSuccess).toBe(true);
      expect(constraints.canFail).toBe(false);
      expect(constraints.constraintReason).toBe('As the Brute, you cannot Fail on Quest 4 or 5');
    });

    it('returns canSuccess: true, canFail: false for Brute on quest 5', () => {
      const constraints = getQuestActionConstraints('evil', 'brute', 5);
      expect(constraints.canSuccess).toBe(true);
      expect(constraints.canFail).toBe(false);
      expect(constraints.constraintReason).toBe('As the Brute, you cannot Fail on Quest 4 or 5');
    });
  });

  describe('Good player constraints', () => {
    it('returns canSuccess: true, canFail: false for good players', () => {
      const constraints = getQuestActionConstraints('good', 'servant', 1);
      expect(constraints.canSuccess).toBe(true);
      expect(constraints.canFail).toBe(false);
      expect(constraints.constraintReason).toBe('As a loyal servant of Arthur, you can only play Success');
    });
  });

  describe('Regular evil player constraints', () => {
    it('returns both options available for regular evil players', () => {
      const constraints = getQuestActionConstraints('evil', 'minion', 1);
      expect(constraints.canSuccess).toBe(true);
      expect(constraints.canFail).toBe(true);
      expect(constraints.constraintReason).toBeUndefined();
    });
  });
});
