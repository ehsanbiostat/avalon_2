/**
 * Win Conditions
 * Detect game end states
 *
 * Feature 021: Added parallel_quiz phase support
 */

import type { QuestResult, GameWinner, WinReason, GameScore } from '@/types/game';

/**
 * Win condition check result
 */
export interface WinConditionResult {
  gameOver: boolean;
  assassinPhase: boolean; // DEPRECATED: Use parallelQuizPhase instead
  parallelQuizPhase: boolean; // Feature 021: True if parallel quiz/assassination phase should start
  parallelQuizOutcome: 'good_win' | 'evil_win' | null; // Feature 021: What triggered the parallel phase
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
 * Feature 021: Now triggers parallel_quiz phase instead of just assassin phase
 *
 * @param questResults Array of completed quest results
 * @param voteTrack Current consecutive rejection count
 * @param hasMerlin Whether the game has a Merlin role (enables parallel quiz phase)
 * @param useParallelQuiz Whether to use new parallel quiz flow (default: true)
 */
export function checkWinConditions(
  questResults: QuestResult[],
  voteTrack: number,
  hasMerlin: boolean = true,
  useParallelQuiz: boolean = true
): WinConditionResult {
  // Check 5 rejections first (Evil win)
  // Feature 021: If Merlin exists, trigger parallel quiz for engagement
  if (voteTrack >= 5) {
    if (hasMerlin && useParallelQuiz) {
      return {
        gameOver: false,
        assassinPhase: false,
        parallelQuizPhase: true,
        parallelQuizOutcome: 'evil_win',
        winner: 'evil',
        reason: '5_rejections',
      };
    }
    return {
      gameOver: true,
      assassinPhase: false,
      parallelQuizPhase: false,
      parallelQuizOutcome: null,
      winner: 'evil',
      reason: '5_rejections',
    };
  }

  const score = countQuestResults(questResults);

  // Good wins with 3 successful quests
  // If Merlin exists, trigger parallel quiz phase
  if (score.good >= 3) {
    if (hasMerlin) {
      if (useParallelQuiz) {
        // Feature 021: Parallel quiz + assassination
        return {
          gameOver: false,
          assassinPhase: false,
          parallelQuizPhase: true,
          parallelQuizOutcome: 'good_win',
          winner: null,
          reason: null,
        };
      }
      // Legacy: Assassin-only phase
      return {
        gameOver: false,
        assassinPhase: true,
        parallelQuizPhase: false,
        parallelQuizOutcome: null,
        winner: null,
        reason: null,
      };
    }
    // No Merlin = immediate Good win
    return {
      gameOver: true,
      assassinPhase: false,
      parallelQuizPhase: false,
      parallelQuizOutcome: null,
      winner: 'good',
      reason: '3_quest_successes',
    };
  }

  // Evil wins with 3 failed quests
  // Feature 021: Trigger parallel quiz for engagement
  if (score.evil >= 3) {
    if (hasMerlin && useParallelQuiz) {
      return {
        gameOver: false,
        assassinPhase: false,
        parallelQuizPhase: true,
        parallelQuizOutcome: 'evil_win',
        winner: 'evil',
        reason: '3_quest_failures',
      };
    }
    return {
      gameOver: true,
      assassinPhase: false,
      parallelQuizPhase: false,
      parallelQuizOutcome: null,
      winner: 'evil',
      reason: '3_quest_failures',
    };
  }

  // Game continues
  return {
    gameOver: false,
    assassinPhase: false,
    parallelQuizPhase: false,
    parallelQuizOutcome: null,
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
      return 'Good completed 3 successful quests! The Assassin failed to find Merlin.';
    case '3_quest_failures':
      return 'Evil sabotaged 3 quests!';
    case '5_rejections':
      return '5 consecutive team rejections - chaos reigns!';
    case 'assassin_found_merlin':
      return 'The Assassin found Merlin! Evil snatches victory from defeat!';
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

  if (reason === 'assassin_found_merlin') {
    return '🗡️ The Assassin found Merlin! Evil wins!';
  }

  return '😈 The Minions of Mordred have corrupted Camelot!';
}

/**
 * Determine final winner after Assassin's guess
 */
export function checkAssassinGuess(
  guessedPlayerId: string,
  merlinPlayerId: string
): WinConditionResult {
  const assassinFoundMerlin = guessedPlayerId === merlinPlayerId;

  return {
    gameOver: true,
    assassinPhase: false,
    parallelQuizPhase: false,
    parallelQuizOutcome: null,
    winner: assassinFoundMerlin ? 'evil' : 'good',
    reason: assassinFoundMerlin ? 'assassin_found_merlin' : '3_quest_successes',
  };
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
