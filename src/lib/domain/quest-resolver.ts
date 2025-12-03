/**
 * Quest Resolver
 * Calculates quest outcomes from submitted actions
 */

import type { QuestResultDisplay, QuestActionType } from '@/types/game';

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
 * Validate that Good players can only submit success
 * @param playerRole Player's alignment ('good' | 'evil')
 * @param action Attempted action
 * @returns Error message if invalid, null if valid
 */
export function validateQuestAction(
  playerRole: 'good' | 'evil',
  action: QuestActionType
): string | null {
  if (playerRole === 'good' && action === 'fail') {
    return 'Good players can only submit success';
  }
  return null;
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

