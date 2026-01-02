'use client';

/**
 * ParallelQuizWaiting Component
 * Feature 021: Waiting screen for players who cannot take the quiz
 *
 * Shows vote count progress without revealing who has voted.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPlayerId } from '@/lib/utils/player-id';
import type { ParallelQuizState, QuizEligibility } from '@/types/game';
import { getEligibilityExplanation } from '@/lib/domain/quiz-eligibility';

interface ParallelQuizWaitingProps {
  gameId: string;
  parallelQuizState: ParallelQuizState;
  quizEligibility: QuizEligibility;
  hasSubmittedVote?: boolean;
  onPhaseComplete?: () => void;
}

export function ParallelQuizWaiting({
  gameId,
  parallelQuizState,
  quizEligibility,
  hasSubmittedVote = false,
  onPhaseComplete,
}: ParallelQuizWaitingProps) {
  const [timeRemaining, setTimeRemaining] = useState(60);
  const completionTriggeredRef = useRef(false);

  // Trigger phase completion when conditions are met
  const triggerCompletion = useCallback(async () => {
    if (completionTriggeredRef.current) return;
    completionTriggeredRef.current = true;

    try {
      const localStoragePlayerId = getPlayerId();
      const response = await fetch(`/api/games/${gameId}/complete-parallel-phase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-player-id': localStoragePlayerId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.phase_completed && onPhaseComplete) {
          onPhaseComplete();
        }
      }
    } catch (err) {
      console.error('Failed to trigger phase completion:', err);
    } finally {
      // Reset so we can retry if needed
      completionTriggeredRef.current = false;
    }
  }, [gameId, onPhaseComplete]);

  // Calculate time remaining from quiz start
  useEffect(() => {
    const calculateRemaining = () => {
      const startTime = new Date(parallelQuizState.quiz_start_time).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setTimeRemaining(remaining);

      // Trigger completion check when conditions are met:
      // 1. Timer expired (remaining === 0) OR quiz is already complete (all votes in)
      // 2. AND assassin has submitted
      const shouldComplete = (remaining === 0 || parallelQuizState.quiz_complete) && parallelQuizState.assassin_submitted;
      if (shouldComplete) {
        triggerCompletion();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [parallelQuizState.quiz_start_time, parallelQuizState.assassin_submitted, parallelQuizState.quiz_complete, triggerCompletion]);

  const { quiz_votes_submitted, eligible_player_ids, outcome, assassin_submitted } = parallelQuizState;
  const totalEligible = eligible_player_ids.length;
  const progressPercent = totalEligible > 0 ? (quiz_votes_submitted / totalEligible) * 100 : 0;

  // Determine the waiting message based on eligibility reason
  const explanationText = getEligibilityExplanation(quizEligibility.reason);

  // Different header based on whether player has voted or is ineligible
  const headerText = hasSubmittedVote
    ? 'Vote Recorded!'
    : quizEligibility.showWaiting
      ? 'Waiting for Others'
      : 'Merlin Quiz';

  const subHeaderText = hasSubmittedVote
    ? 'Waiting for others to complete their guesses...'
    : explanationText;

  return (
    <div className="text-center space-y-6 py-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-4xl mb-4">
          {hasSubmittedVote ? '✅' : quizEligibility.showWaiting ? '⏳' : '🔮'}
        </div>
        <h2 className="text-2xl font-bold text-avalon-gold">{headerText}</h2>
        <p className="text-avalon-silver/80">{subHeaderText}</p>
      </div>

      {/* Vote Progress */}
      <div className="bg-avalon-dark-blue/50 rounded-xl p-6 border border-avalon-silver/20 max-w-sm mx-auto">
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="relative h-3 bg-avalon-dark rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-avalon-gold to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Vote Count */}
          <p className="text-lg font-medium text-avalon-text-primary">
            <span className="text-avalon-gold">{quiz_votes_submitted}</span>
            <span className="text-avalon-silver/60"> of </span>
            <span className="text-avalon-gold">{totalEligible}</span>
            <span className="text-avalon-silver/60"> players have voted</span>
          </p>

          {/* Time Remaining */}
          {!parallelQuizState.quiz_complete && (
            <p className="text-sm text-avalon-silver/60">
              ⏱️ {timeRemaining} seconds remaining
            </p>
          )}
        </div>
      </div>

      {/* Status Indicators for Good Win */}
      {outcome === 'good_win' && (
        <div className="bg-avalon-dark-blue/30 rounded-lg p-4 max-w-sm mx-auto space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-avalon-silver/80">Quiz Progress</span>
            <span className={parallelQuizState.quiz_complete ? 'text-emerald-400' : 'text-amber-400'}>
              {parallelQuizState.quiz_complete ? '✓ Complete' : '⏳ In Progress'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-avalon-silver/80">Assassin Decision</span>
            <span className={assassin_submitted ? 'text-emerald-400' : 'text-amber-400'}>
              {assassin_submitted ? '✓ Submitted' : '⏳ Deciding...'}
            </span>
          </div>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-avalon-silver/50 max-w-xs mx-auto">
        {outcome === 'good_win'
          ? 'The game will reveal results once the quiz completes and the Assassin makes their choice.'
          : 'The game will reveal results once the quiz completes or times out.'}
      </p>
    </div>
  );
}
