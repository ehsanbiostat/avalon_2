/**
 * Unit tests for validation module
 */

import { describe, it, expect } from 'vitest';
import {
  validateNickname,
  validatePlayerCount,
  validateUUID,
  validateRoomCode,
  isRoomFull,
  canJoinRoom,
  canDistributeRoles,
  canStartGame,
} from '@/lib/domain/validation';

describe('validation', () => {
  describe('validateNickname', () => {
    it('should accept valid nicknames', () => {
      expect(validateNickname('John').valid).toBe(true);
      expect(validateNickname('Player 1').valid).toBe(true);
      expect(validateNickname('Cool-Name_123').valid).toBe(true);
      expect(validateNickname('ABC').valid).toBe(true); // Min length
      expect(validateNickname('A'.repeat(20)).valid).toBe(true); // Max length
    });

    it('should reject empty or whitespace-only nicknames', () => {
      expect(validateNickname('').valid).toBe(false);
      expect(validateNickname('   ').valid).toBe(false);
    });

    it('should reject too short nicknames', () => {
      expect(validateNickname('AB').valid).toBe(false);
      expect(validateNickname('A').valid).toBe(false);
    });

    it('should reject too long nicknames', () => {
      expect(validateNickname('A'.repeat(21)).valid).toBe(false);
    });

    it('should reject nicknames with special characters', () => {
      expect(validateNickname('Name@123').valid).toBe(false);
      expect(validateNickname('Name!').valid).toBe(false);
      expect(validateNickname('Name#$%').valid).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(validateNickname(null as unknown as string).valid).toBe(false);
      expect(validateNickname(undefined as unknown as string).valid).toBe(false);
      expect(validateNickname(123 as unknown as string).valid).toBe(false);
    });
  });

  describe('validatePlayerCount', () => {
    it('should accept valid player counts', () => {
      for (let count = 5; count <= 10; count++) {
        expect(validatePlayerCount(count).valid).toBe(true);
      }
    });

    it('should reject counts below minimum', () => {
      expect(validatePlayerCount(4).valid).toBe(false);
      expect(validatePlayerCount(0).valid).toBe(false);
      expect(validatePlayerCount(-1).valid).toBe(false);
    });

    it('should reject counts above maximum', () => {
      expect(validatePlayerCount(11).valid).toBe(false);
      expect(validatePlayerCount(100).valid).toBe(false);
    });

    it('should reject non-integer counts', () => {
      expect(validatePlayerCount(5.5).valid).toBe(false);
      expect(validatePlayerCount(7.9).valid).toBe(false);
    });

    it('should reject non-number input', () => {
      expect(validatePlayerCount(NaN).valid).toBe(false);
      expect(validatePlayerCount('5' as unknown as number).valid).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-446655440000').valid).toBe(true);
      expect(validateUUID('6ba7b810-9dad-41d4-80b4-00c04fd430c8').valid).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(validateUUID('not-a-uuid').valid).toBe(false);
      expect(validateUUID('12345678-1234-1234-1234-123456789012').valid).toBe(false); // Wrong version
      expect(validateUUID('').valid).toBe(false);
    });

    it('should accept UUIDs case-insensitively', () => {
      expect(validateUUID('550E8400-E29B-41D4-A716-446655440000').valid).toBe(true);
    });
  });

  describe('validateRoomCode', () => {
    it('should accept valid room codes', () => {
      expect(validateRoomCode('ABC234').valid).toBe(true);
      expect(validateRoomCode('XYZWVU').valid).toBe(true);
    });

    it('should reject codes with wrong length', () => {
      expect(validateRoomCode('ABC').valid).toBe(false);
      expect(validateRoomCode('ABC23456').valid).toBe(false);
    });

    it('should reject codes with invalid characters', () => {
      expect(validateRoomCode('ABCO12').valid).toBe(false); // O
      expect(validateRoomCode('ABC012').valid).toBe(false); // 0
    });
  });

  describe('isRoomFull', () => {
    it('should return true when room is at capacity', () => {
      expect(isRoomFull(5, 5)).toBe(true);
      expect(isRoomFull(10, 10)).toBe(true);
    });

    it('should return true when room is over capacity', () => {
      expect(isRoomFull(6, 5)).toBe(true);
    });

    it('should return false when room has space', () => {
      expect(isRoomFull(4, 5)).toBe(false);
      expect(isRoomFull(0, 10)).toBe(false);
    });
  });

  describe('canJoinRoom', () => {
    it('should allow joining waiting rooms with space', () => {
      expect(canJoinRoom('waiting', 4, 5).valid).toBe(true);
    });

    it('should not allow joining full rooms', () => {
      expect(canJoinRoom('waiting', 5, 5).valid).toBe(false);
    });

    it('should not allow joining non-waiting rooms', () => {
      expect(canJoinRoom('roles_distributed', 4, 5).valid).toBe(false);
      expect(canJoinRoom('started', 4, 5).valid).toBe(false);
    });
  });

  describe('canDistributeRoles', () => {
    it('should allow manager to distribute when room is full', () => {
      expect(canDistributeRoles('waiting', 5, 5, true).valid).toBe(true);
    });

    it('should not allow non-manager to distribute', () => {
      expect(canDistributeRoles('waiting', 5, 5, false).valid).toBe(false);
    });

    it('should not allow distribution when room is not full', () => {
      expect(canDistributeRoles('waiting', 4, 5, true).valid).toBe(false);
    });

    it('should not allow distribution after already distributed', () => {
      expect(canDistributeRoles('roles_distributed', 5, 5, true).valid).toBe(false);
    });
  });

  describe('canStartGame', () => {
    it('should allow manager to start when all confirmed', () => {
      expect(canStartGame('roles_distributed', true, true).valid).toBe(true);
    });

    it('should not allow non-manager to start', () => {
      expect(canStartGame('roles_distributed', true, false).valid).toBe(false);
    });

    it('should not allow starting when not all confirmed', () => {
      expect(canStartGame('roles_distributed', false, true).valid).toBe(false);
    });

    it('should not allow starting from wrong state', () => {
      expect(canStartGame('waiting', true, true).valid).toBe(false);
      expect(canStartGame('started', true, true).valid).toBe(false);
    });
  });
});
