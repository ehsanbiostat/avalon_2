/**
 * Quest Resolver
 * Calculates quest outcomes from submitted actions
 * Feature 020: Extended with Lunatic/Brute quest action constraints
 */

import type { QuestResultDisplay, QuestActionType } from '@/types/game';
import type { SpecialRole } from '@/types/database';
import { ERROR_CODES } from '@/lib/utils/constants';

/**
 * Quest outcome calculation result
 */
export interface QuestOutcome {
  successCount: number;
  failCount: number;
  outcome: 'success' | 'fail';
  failsRequired: number;
}

/**
 * Calculate quest result from submitted actions
 *
 * @param actions Array of actions ('success' | 'fail')
 * @param failsRequired Number of fails needed for quest to fail (usually 1, sometimes 2)
 */
export function calculateQuestOutcome(
  actions: QuestActionType[],
  failsRequired: number
): QuestOutcome {
  const successCount = actions.filter((a) => a === 'success').length;
  const failCount = actions.filter((a) => a === 'fail').length;

  // Quest fails if fail count meets or exceeds requirement
  const outcome = failCount >= failsRequired ? 'fail' : 'success';

  return {
    successCount,
    failCount,
    outcome,
    failsRequired,
  };
}

/**
 * Shuffle actions for anonymous display
 * Returns array of 'success' and 'fail' in random order
 */
export function shuffleActionsForDisplay(
  actions: QuestActionType[]
): QuestActionType[] {
  const shuffled = [...actions];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Check if all team members have submitted actions
 */
export function allActionsSubmitted(
  submittedCount: number,
  teamSize: number
): boolean {
  return submittedCount === teamSize;
}

/**
 * Create quest result display object
 */
export function createQuestResultDisplay(
  questNumber: number,
  teamSize: number,
  outcome: QuestOutcome
): QuestResultDisplay {
  return {
    quest_number: questNumber,
    team_size: teamSize,
    success_count: outcome.successCount,
    fail_count: outcome.failCount,
    outcome: outcome.outcome,
    fails_required: outcome.failsRequired,
  };
}

/**
 * Quest action validation result
 */
export interface QuestActionValidation {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Validate quest action based on player role and special role constraints
 * Feature 020: Extended with Lunatic/Brute quest action constraints
 *
 * @param playerRole Player's alignment ('good' | 'evil')
 * @param action Attempted action
 * @param specialRole Player's special role (optional)
 * @param questNumber Current quest number (1-5)
 * @returns Validation result with error details if invalid
 */
export function validateQuestAction(
  playerRole: 'good' | 'evil',
  action: QuestActionType,
  specialRole?: SpecialRole,
  questNumber?: number
): QuestActionValidation {
  // Good players can only submit success
  if (playerRole === 'good' && action === 'fail') {
    return {
      valid: false,
      error: 'Good players can only submit success',
      errorCode: 'INVALID_ACTION',
    };
  }

  // Feature 020: Lunatic MUST fail
  if (specialRole === 'lunatic' && action === 'success') {
    return {
      valid: false,
      error: 'The Lunatic must play Fail on every quest',
      errorCode: ERROR_CODES.LUNATIC_MUST_FAIL,
    };
  }

  // Feature 020: Brute cannot fail on quests 4-5
  if (specialRole === 'brute' && action === 'fail' && questNumber !== undefined && questNumber >= 4) {
    return {
      valid: false,
      error: 'The Brute cannot play Fail on Quest 4 or 5',
      errorCode: ERROR_CODES.BRUTE_CANNOT_FAIL_LATE_QUEST,
    };
  }

  return { valid: true };
}

/**
 * Get quest action constraints for UI display
 * Feature 020: Returns which actions are available for a player
 *
 * @param playerRole Player's alignment ('good' | 'evil')
 * @param specialRole Player's special role (optional)
 * @param questNumber Current quest number (1-5)
 * @returns Object indicating which actions are available
 */
export interface QuestActionConstraints {
  canSuccess: boolean;
  canFail: boolean;
  constraintReason?: string;
}

export function getQuestActionConstraints(
  playerRole: 'good' | 'evil',
  specialRole?: SpecialRole,
  questNumber?: number
): QuestActionConstraints {
  // Good players can only submit success
  if (playerRole === 'good') {
    return {
      canSuccess: true,
      canFail: false,
      constraintReason: 'As a loyal servant of Arthur, you can only play Success',
    };
  }

  // Feature 020: Lunatic MUST fail (can't choose success)
  if (specialRole === 'lunatic') {
    return {
      canSuccess: false,
      canFail: true,
      constraintReason: 'As the Lunatic, you must play Fail',
    };
  }

  // Feature 020: Brute can fail on quests 1-3, must success on quests 4-5
  if (specialRole === 'brute' && questNumber !== undefined && questNumber >= 4) {
    return {
      canSuccess: true,
      canFail: false,
      constraintReason: 'As the Brute, you cannot Fail on Quest 4 or 5',
    };
  }

  // Default: Evil players can choose either
  return {
    canSuccess: true,
    canFail: true,
  };
}

/**
 * Check if player is on the quest team
 */
export function isOnQuestTeam(
  teamMemberIds: string[],
  playerId: string
): boolean {
  return teamMemberIds.includes(playerId);
}

/**
 * Get quest outcome description for display
 */
export function getQuestOutcomeDescription(outcome: QuestOutcome): string {
  if (outcome.outcome === 'success') {
    return 'Quest Succeeded! All cards were Success.';
  }

  if (outcome.failsRequired === 1) {
    return `Quest Failed! ${outcome.failCount} Fail card${outcome.failCount > 1 ? 's' : ''} played.`;
  }

  return `Quest Failed! ${outcome.failCount} Fail cards played (${outcome.failsRequired} required).`;
}
