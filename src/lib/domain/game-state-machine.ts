/**
 * Game State Machine
 * Manages game phase transitions
 */

import type { GamePhase } from '@/types/game';

/**
 * Valid state transitions
 * Maps current phase to allowed next phases
 *
 * Feature 021: Added parallel_quiz phase for parallel quiz/assassination
 */
export const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  team_building: ['voting'],
  voting: ['team_building', 'quest', 'game_over'], // rejected -> team_building, approved -> quest, 5 rejections -> game_over
  quest: ['quest_result', 'assassin', 'parallel_quiz'], // quest -> result OR assassin (legacy) OR parallel_quiz (new)
  quest_result: ['team_building', 'lady_of_lake', 'assassin', 'parallel_quiz', 'game_over'], // next quest, lady phase, assassin/parallel phase, or game ends
  lady_of_lake: ['team_building'], // Lady phase leads to next team building
  assassin: ['game_over'], // Assassin phase always leads to game_over (legacy support)
  parallel_quiz: ['game_over'], // Feature 021: Parallel phase leads to game_over when both conditions met
  game_over: [], // Terminal state
};

/**
 * Check if a phase transition is valid
 */
export function isValidTransition(
  fromPhase: GamePhase,
  toPhase: GamePhase
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[fromPhase];
  return allowedTransitions.includes(toPhase);
}

/**
 * Get allowed next phases from current phase
 */
export function getAllowedTransitions(currentPhase: GamePhase): GamePhase[] {
  return VALID_TRANSITIONS[currentPhase];
}

/**
 * Check if game is in a terminal state
 */
export function isTerminalPhase(phase: GamePhase): boolean {
  return phase === 'game_over';
}

/**
 * Check if game allows team proposals
 */
export function canProposeTeam(phase: GamePhase): boolean {
  return phase === 'team_building';
}

/**
 * Check if game is in voting phase
 */
export function canVote(phase: GamePhase): boolean {
  return phase === 'voting';
}

/**
 * Check if game allows quest actions
 */
export function canSubmitQuestAction(phase: GamePhase): boolean {
  return phase === 'quest';
}

/**
 * Check if game is showing quest results
 */
export function isShowingResults(phase: GamePhase): boolean {
  return phase === 'quest_result';
}

/**
 * Get next phase after team proposal
 */
export function getPhaseAfterProposal(): GamePhase {
  return 'voting';
}

/**
 * Get next phase after vote result
 * @param approved Whether team was approved
 * @param isFifthRejection Whether this was the 5th consecutive rejection
 */
export function getPhaseAfterVote(
  approved: boolean,
  isFifthRejection: boolean
): GamePhase {
  if (isFifthRejection) {
    return 'game_over';
  }
  return approved ? 'quest' : 'team_building';
}

/**
 * Get next phase after quest completion
 * @param gameOver Whether the game has ended (3 wins for either team)
 */
export function getPhaseAfterQuest(gameOver: boolean): GamePhase {
  return gameOver ? 'game_over' : 'quest_result';
}

/**
 * Get next phase after viewing quest result
 * @param gameOver Whether the game has ended
 */
export function getPhaseAfterResult(gameOver: boolean): GamePhase {
  return gameOver ? 'game_over' : 'team_building';
}

/**
 * Get human-readable phase name
 */
export function getPhaseName(phase: GamePhase): string {
  switch (phase) {
    case 'team_building':
      return 'Team Building';
    case 'voting':
      return 'Voting';
    case 'quest':
      return 'Quest';
    case 'quest_result':
      return 'Quest Result';
    case 'lady_of_lake':
      return 'Lady of the Lake';
    case 'assassin':
      return 'Assassin\'s Gambit';
    case 'parallel_quiz':
      return 'Final Reckoning';
    case 'game_over':
      return 'Game Over';
    default:
      return 'Unknown';
  }
}

/**
 * Get phase description for UI
 */
export function getPhaseDescription(phase: GamePhase): string {
  switch (phase) {
    case 'team_building':
      return 'The leader is selecting a team for the quest';
    case 'voting':
      return 'Vote to approve or reject the proposed team';
    case 'quest':
      return 'The team is on a quest';
    case 'quest_result':
      return 'Reviewing the quest results';
    case 'lady_of_lake':
      return 'The Lady of the Lake holder is investigating a player';
    case 'assassin':
      return 'The Assassin has one chance to find Merlin';
    case 'parallel_quiz':
      return 'Guess who Merlin was while the Assassin makes their choice';
    case 'game_over':
      return 'The game has ended';
    default:
      return '';
  }
}

/**
 * Check if game is in Lady of the Lake phase
 */
export function isLadyPhase(phase: GamePhase): boolean {
  return phase === 'lady_of_lake';
}
