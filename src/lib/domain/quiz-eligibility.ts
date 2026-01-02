/**
 * Quiz Eligibility domain logic
 * Feature 021: Parallel Merlin Quiz
 *
 * Determines which players can participate in the Merlin quiz during the
 * parallel quiz/assassination phase based on game outcome and player roles.
 */

import type {
  QuizEligibility,
  QuizEligibilityInput,
  QuizEligibilityReason,
} from '@/types/game';

/**
 * Calculate quiz eligibility for a single player
 *
 * Rules:
 * - Good win + Assassin: Assassin sees assassination UI, others take quiz
 * - Good win + no Assassin: Everyone takes quiz
 * - Evil win: Merlin skips (knows themselves)
 * - Evil win + no Morgana: Percival skips (knows Merlin with certainty)
 * - Evil win + Morgana: Percival takes quiz (has uncertainty)
 */
export function getQuizEligibility(input: QuizEligibilityInput): QuizEligibility {
  const { outcome, playerSpecialRole, hasMorgana, hasAssassin } = input;

  // Good win scenarios
  if (outcome === 'good_win') {
    // Assassin sees assassination UI, not quiz
    if (playerSpecialRole === 'assassin') {
      return {
        canTakeQuiz: false,
        showAssassination: true,
        showWaiting: false,
        reason: 'is_assassin',
      };
    }

    // Good win without Assassin: everyone takes quiz
    if (!hasAssassin) {
      return {
        canTakeQuiz: true,
        showAssassination: false,
        showWaiting: false,
        reason: 'no_assassin_good_win',
      };
    }

    // Everyone else takes quiz (including all Evil teammates)
    return {
      canTakeQuiz: true,
      showAssassination: false,
      showWaiting: false,
      reason: 'is_eligible',
    };
  }

  // Evil win scenarios
  if (outcome === 'evil_win') {
    // Merlin skips (knows who they are)
    if (playerSpecialRole === 'merlin') {
      return {
        canTakeQuiz: false,
        showAssassination: false,
        showWaiting: true,
        reason: 'is_merlin',
      };
    }

    // Percival: depends on Morgana presence
    if (playerSpecialRole === 'percival') {
      if (hasMorgana) {
        // Percival has uncertainty (50/50 between Merlin and Morgana)
        return {
          canTakeQuiz: true,
          showAssassination: false,
          showWaiting: false,
          reason: 'is_percival_uncertain',
        };
      } else {
        // Percival knows Merlin with certainty
        return {
          canTakeQuiz: false,
          showAssassination: false,
          showWaiting: true,
          reason: 'is_percival_certain',
        };
      }
    }

    // Everyone else takes quiz
    return {
      canTakeQuiz: true,
      showAssassination: false,
      showWaiting: false,
      reason: 'is_eligible',
    };
  }

  // Fallback: eligible (shouldn't reach here)
  return {
    canTakeQuiz: true,
    showAssassination: false,
    showWaiting: false,
    reason: 'is_eligible',
  };
}

/**
 * Get list of player IDs eligible for quiz
 *
 * @param outcome - Whether Good or Evil won
 * @param players - All players with their special roles
 * @param hasMorgana - Whether Morgana is in the game
 * @returns Array of player IDs who should take the quiz
 */
export function getEligibleQuizPlayers(
  outcome: 'good_win' | 'evil_win',
  players: Array<{ id: string; special_role: string | null }>,
  hasMorgana: boolean
): string[] {
  const hasAssassin = players.some(p => p.special_role === 'assassin');

  return players
    .filter(player => {
      const eligibility = getQuizEligibility({
        outcome,
        playerSpecialRole: player.special_role,
        hasMorgana,
        hasAssassin,
      });
      return eligibility.canTakeQuiz;
    })
    .map(player => player.id);
}

/**
 * Get a human-readable explanation for quiz eligibility
 */
export function getEligibilityExplanation(reason: QuizEligibilityReason): string {
  switch (reason) {
    case 'is_assassin':
      return 'You are the Assassin - choose your target!';
    case 'is_merlin':
      return "You're Merlin - you know who you are!";
    case 'is_percival_certain':
      return "You're Percival - you know who Merlin is!";
    case 'is_percival_uncertain':
      return 'You may participate - Morgana adds uncertainty.';
    case 'is_eligible':
      return 'Guess who Merlin was!';
    case 'no_assassin_good_win':
      return 'Good has won! Guess who Merlin was before seeing the results.';
    default:
      return 'Waiting for others...';
  }
}
