/**
 * Unit tests for room code generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateRoomCode,
  generateSecureRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  formatRoomCode,
  ROOM_CODE_LENGTH,
} from '@/lib/utils/room-code';

describe('room-code', () => {
  describe('generateRoomCode', () => {
    it('should generate a code of correct length', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
    });

    it('should only contain valid characters', () => {
      const validChars = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
      for (let i = 0; i < 100; i++) {
        const code = generateRoomCode();
        expect(code).toMatch(validChars);
      }
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      // With 30^6 possible combinations, 100 codes should be unique
      expect(codes.size).toBe(100);
    });
  });

  describe('generateSecureRoomCode', () => {
    it('should generate a code of correct length', () => {
      const code = generateSecureRoomCode();
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
    });

    it('should only contain valid characters', () => {
      const validChars = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
      for (let i = 0; i < 100; i++) {
        const code = generateSecureRoomCode();
        expect(code).toMatch(validChars);
      }
    });
  });

  describe('isValidRoomCode', () => {
    it('should return true for valid codes', () => {
      expect(isValidRoomCode('ABC234')).toBe(true);
      expect(isValidRoomCode('XYZWVU')).toBe(true);
      expect(isValidRoomCode('234567')).toBe(true);
    });

    it('should return false for codes with wrong length', () => {
      expect(isValidRoomCode('ABC12')).toBe(false);
      expect(isValidRoomCode('ABC1234')).toBe(false);
      expect(isValidRoomCode('')).toBe(false);
    });

    it('should return false for codes with invalid characters', () => {
      // Contains O (zero-like)
      expect(isValidRoomCode('ABCO23')).toBe(false);
      // Contains 0 (zero)
      expect(isValidRoomCode('ABC023')).toBe(false);
      // Contains 1 (one)
      expect(isValidRoomCode('ABC123')).toBe(false);
      // Contains I (eye)
      expect(isValidRoomCode('ABCI23')).toBe(false);
      // Contains L (ell)
      expect(isValidRoomCode('ABCL23')).toBe(false);
    });

    it('should handle lowercase input', () => {
      expect(isValidRoomCode('abc234')).toBe(true);
      expect(isValidRoomCode('Abc345')).toBe(true);
    });

    it('should return false for null/undefined', () => {
      expect(isValidRoomCode(null as unknown as string)).toBe(false);
      expect(isValidRoomCode(undefined as unknown as string)).toBe(false);
    });
  });

  describe('normalizeRoomCode', () => {
    it('should uppercase the code', () => {
      expect(normalizeRoomCode('abc234')).toBe('ABC234');
    });

    it('should trim whitespace', () => {
      expect(normalizeRoomCode('  ABC234  ')).toBe('ABC234');
    });

    it('should handle mixed case and whitespace', () => {
      expect(normalizeRoomCode(' aBc234 ')).toBe('ABC234');
    });
  });

  describe('formatRoomCode', () => {
    it('should format code with hyphen', () => {
      expect(formatRoomCode('ABC234')).toBe('ABC-234');
    });

    it('should normalize before formatting', () => {
      expect(formatRoomCode('abc234')).toBe('ABC-234');
      expect(formatRoomCode(' abc234 ')).toBe('ABC-234');
    });

    it('should return unchanged if not correct length', () => {
      expect(formatRoomCode('ABC')).toBe('ABC');
      expect(formatRoomCode('ABC23456')).toBe('ABC23456');
    });
  });
});
