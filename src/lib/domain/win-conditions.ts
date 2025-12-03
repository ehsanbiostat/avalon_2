/**
 * Win Conditions
 * Detect game end states
 */

import type { QuestResult, GameWinner, WinReason, GameScore } from '@/types/game';

/**
 * Win condition check result
 */
export interface WinConditionResult {
  gameOver: boolean;
  winner: GameWinner | null;
  reason: WinReason | null;
}

/**
 * Count quest results by outcome
 */
export function countQuestResults(
  questResults: QuestResult[]
): GameScore {
  return {
    good: questResults.filter((r) => r.result === 'success').length,
    evil: questResults.filter((r) => r.result === 'fail').length,
  };
}

/**
 * Check win conditions based on quest results
 * 
 * @param questResults Array of completed quest results
 * @param voteTrack Current consecutive rejection count
 */
export function checkWinConditions(
  questResults: QuestResult[],
  voteTrack: number
): WinConditionResult {
  // Check 5 rejections first (immediate Evil win)
  if (voteTrack >= 5) {
    return {
      gameOver: true,
      winner: 'evil',
      reason: '5_rejections',
    };
  }
  
  const score = countQuestResults(questResults);
  
  // Good wins with 3 successful quests
  // Note: In Phase 3, this is final win (Assassin phase in Phase 4)
  if (score.good >= 3) {
    return {
      gameOver: true,
      winner: 'good',
      reason: '3_quest_successes',
    };
  }
  
  // Evil wins with 3 failed quests
  if (score.evil >= 3) {
    return {
      gameOver: true,
      winner: 'evil',
      reason: '3_quest_failures',
    };
  }
  
  // Game continues
  return {
    gameOver: false,
    winner: null,
    reason: null,
  };
}

/**
 * Check if 5 rejections has been reached
 */
export function checkFiveRejections(voteTrack: number): boolean {
  return voteTrack >= 5;
}

/**
 * Check if Good has won 3 quests
 */
export function checkGoodWins(questResults: QuestResult[]): boolean {
  const score = countQuestResults(questResults);
  return score.good >= 3;
}

/**
 * Check if Evil has won 3 quests
 */
export function checkEvilWins(questResults: QuestResult[]): boolean {
  const score = countQuestResults(questResults);
  return score.evil >= 3;
}

/**
 * Get win reason display text
 */
export function getWinReasonText(reason: WinReason): string {
  switch (reason) {
    case '3_quest_successes':
      return 'Good completed 3 successful quests!';
    case '3_quest_failures':
      return 'Evil sabotaged 3 quests!';
    case '5_rejections':
      return '5 consecutive team rejections - chaos reigns!';
    default:
      return 'Game over';
  }
}

/**
 * Get winner announcement text
 */
export function getWinnerAnnouncement(
  winner: GameWinner,
  reason: WinReason
): string {
  if (winner === 'good') {
    return '🎉 The Loyal Servants of Arthur have triumphed!';
  }
  
  if (reason === '5_rejections') {
    return '😈 Evil wins through chaos and indecision!';
  }
  
  return '😈 The Minions of Mordred have corrupted Camelot!';
}

/**
 * Check if game should continue to next quest
 */
export function shouldContinueToNextQuest(
  questResults: QuestResult[],
  voteTrack: number
): boolean {
  const result = checkWinConditions(questResults, voteTrack);
  return !result.gameOver;
}

/**
 * Get remaining quests needed to win
 */
export function getQuestsToWin(questResults: QuestResult[]): {
  goodNeeds: number;
  evilNeeds: number;
} {
  const score = countQuestResults(questResults);
  return {
    goodNeeds: Math.max(0, 3 - score.good),
    evilNeeds: Math.max(0, 3 - score.evil),
  };
}

