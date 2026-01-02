# Quickstart: Parallel Merlin Quiz

**Feature**: 021-parallel-merlin-quiz
**Date**: 2026-01-02

## Overview

This feature changes when and how the Merlin quiz is presented to players at game end. Instead of showing the quiz after the Assassin makes their choice, the quiz now runs **in parallel** with assassination (or on its own for Evil wins).

## Key Concepts

### 1. New Game Phase: `parallel_quiz`

A new game phase that combines quiz voting and assassination into a single parallel activity:

```typescript
// Phase flow comparison:

// OLD (Good wins):
quest_result → assassin → game_over → quiz

// NEW (Good wins):
quest_result → parallel_quiz → game_over
                ├── Assassin: sees assassination UI
                └── Others: see quiz UI

// NEW (Evil wins):
quest_result → parallel_quiz → game_over
                ├── Merlin: sees waiting screen
                ├── Percival (no Morgana): sees waiting screen
                └── Others: see quiz UI
```

### 2. Quiz Eligibility

Not all players see the quiz. Use the eligibility helper:

```typescript
import { getQuizEligibility } from '@/lib/domain/quiz-eligibility';

const eligibility = getQuizEligibility({
  outcome: 'good_win',
  playerSpecialRole: 'assassin',
  hasMorgana: true,
  hasAssassin: true
});

// Result: { canTakeQuiz: false, showAssassination: true, showWaiting: false }
```

### 3. Completion Conditions

The parallel phase completes when:

```typescript
// For Good wins:
assassinSubmitted && quizComplete

// For Evil wins:
quizComplete  // (no assassination needed)

// Quiz is complete when:
(votesSubmitted === eligibleCount) || (timeout60SecondsElapsed)
```

## Quick Implementation Guide

### Step 1: Add the New Domain Module

Create `src/lib/domain/quiz-eligibility.ts`:

```typescript
import type { QuizEligibility, QuizEligibilityInput } from '@/types/game';

export function getQuizEligibility(input: QuizEligibilityInput): QuizEligibility {
  const { outcome, playerSpecialRole, hasMorgana, hasAssassin } = input;

  // Good win: Assassin does assassination, not quiz
  if (outcome === 'good_win' && playerSpecialRole === 'assassin') {
    return { canTakeQuiz: false, showAssassination: true, showWaiting: false, reason: 'is_assassin' };
  }

  // Good win without Assassin: everyone takes quiz
  if (outcome === 'good_win' && !hasAssassin) {
    return { canTakeQuiz: true, showAssassination: false, showWaiting: false, reason: 'no_assassin_good_win' };
  }

  // Evil win: Merlin skips (knows themselves)
  if (outcome === 'evil_win' && playerSpecialRole === 'merlin') {
    return { canTakeQuiz: false, showAssassination: false, showWaiting: true, reason: 'is_merlin' };
  }

  // Evil win: Percival skips if no Morgana (has certainty)
  if (outcome === 'evil_win' && playerSpecialRole === 'percival' && !hasMorgana) {
    return { canTakeQuiz: false, showAssassination: false, showWaiting: true, reason: 'is_percival_certain' };
  }

  // Default: can take quiz
  return { canTakeQuiz: true, showAssassination: false, showWaiting: false, reason: 'is_eligible' };
}
```

### Step 2: Update GameBoard Routing

In `src/components/game/GameBoard.tsx`:

```typescript
// Handle parallel_quiz phase
if (game.phase === 'parallel_quiz' && gameState.parallel_quiz) {
  const eligibility = gameState.quiz_eligibility;

  if (eligibility?.showAssassination) {
    // Assassin sees unchanged assassination UI
    return <AssassinPhase {...assassinProps} />;
  }

  if (eligibility?.canTakeQuiz) {
    // Eligible players see quiz
    return <MerlinQuiz {...quizProps} isParallelMode={true} />;
  }

  // Ineligible players see waiting screen
  return <ParallelQuizWaiting {...waitingProps} />;
}
```

### Step 3: Create Waiting Component

New component `src/components/game/ParallelQuizWaiting.tsx`:

```typescript
interface ParallelQuizWaitingProps {
  votesSubmitted: number;
  totalEligible: number;
  quizStartTime: string;
  reason: string;
}

export function ParallelQuizWaiting({
  votesSubmitted,
  totalEligible,
  quizStartTime,
  reason
}: ParallelQuizWaitingProps) {
  const remaining = useCountdown(quizStartTime, 60);

  return (
    <div className="text-center p-6">
      <div className="text-4xl mb-4">⏳</div>
      <h2 className="text-xl font-bold mb-2">Waiting for Quiz</h2>
      <p className="text-slate-400 mb-4">
        {reason === 'is_merlin' && "You're Merlin - you know who you are!"}
        {reason === 'is_percival_certain' && "You're Percival - you know who Merlin is!"}
      </p>
      <div className="text-lg">
        {votesSubmitted} of {totalEligible} players have voted
      </div>
      <div className="text-sm text-slate-500 mt-2">
        {remaining > 0 ? `${remaining}s remaining` : 'Waiting for timeout...'}
      </div>
    </div>
  );
}
```

### Step 4: Update API Route

In `src/app/api/games/[gameId]/route.ts`, add parallel quiz state:

```typescript
// Build parallel quiz state if in that phase
let parallel_quiz: ParallelQuizState | null = null;
let quiz_eligibility: QuizEligibility | null = null;

if (game.phase === 'parallel_quiz') {
  const quizVotes = await getQuizVotes(supabase, gameId);
  const eligibleIds = getEligibleQuizPlayers(outcome, playerRoles, hasMorgana);

  parallel_quiz = {
    outcome,
    quiz_start_time: game.updated_at, // Or dedicated field
    assassin_id: assassin?.player_id ?? null,
    assassin_submitted: !!game.assassin_guess_id,
    assassin_guess_id: game.assassin_guess_id,
    eligible_player_ids: eligibleIds,
    quiz_votes_submitted: quizVotes.length,
    quiz_complete: isParallelQuizComplete(quizVotes.length, eligibleIds.length, game.updated_at),
    can_transition_to_game_over: canCompleteParallelPhase(...)
  };

  quiz_eligibility = getQuizEligibility({
    outcome,
    playerSpecialRole: currentPlayerRole?.special_role ?? null,
    hasMorgana,
    hasAssassin: !!assassin
  });
}

return { game, players, ..., parallel_quiz, quiz_eligibility };
```

## Testing Checklist

### Unit Tests

```typescript
// quiz-eligibility.test.ts

describe('getQuizEligibility', () => {
  it('Assassin sees assassination on Good win', () => {
    const result = getQuizEligibility({
      outcome: 'good_win',
      playerSpecialRole: 'assassin',
      hasMorgana: false,
      hasAssassin: true
    });
    expect(result.showAssassination).toBe(true);
    expect(result.canTakeQuiz).toBe(false);
  });

  it('Merlin sees waiting on Evil win', () => {
    const result = getQuizEligibility({
      outcome: 'evil_win',
      playerSpecialRole: 'merlin',
      hasMorgana: false,
      hasAssassin: true
    });
    expect(result.showWaiting).toBe(true);
    expect(result.canTakeQuiz).toBe(false);
  });

  it('Percival takes quiz on Evil win WITH Morgana', () => {
    const result = getQuizEligibility({
      outcome: 'evil_win',
      playerSpecialRole: 'percival',
      hasMorgana: true,
      hasAssassin: true
    });
    expect(result.canTakeQuiz).toBe(true);
  });

  it('Percival waits on Evil win WITHOUT Morgana', () => {
    const result = getQuizEligibility({
      outcome: 'evil_win',
      playerSpecialRole: 'percival',
      hasMorgana: false,
      hasAssassin: true
    });
    expect(result.showWaiting).toBe(true);
    expect(result.canTakeQuiz).toBe(false);
  });
});
```

### Manual Testing Scenarios

1. **Good Win with Assassin**:
   - Complete 3 successful quests
   - Verify Assassin sees assassination UI
   - Verify others see quiz immediately
   - Submit quiz votes, verify count updates
   - Assassin submits guess
   - Verify all transition to results together

2. **Evil Win (3 failures)**:
   - Complete 3 failed quests
   - Verify Merlin sees waiting screen
   - Verify others see quiz
   - Verify Percival behavior (with/without Morgana)

3. **Evil Win (5 rejections)**:
   - Reject 5 team proposals
   - Verify quiz appears (not just game over)

4. **Good Win without Assassin**:
   - Configure game without Assassin role
   - Complete 3 successful quests
   - Verify all players see quiz
   - Verify Good wins when quiz completes

## Common Pitfalls

### 1. Forgetting to Check Phase

```typescript
// BAD: Only checking for game_over
if (game.phase === 'game_over') {
  return <GameOver />;
}

// GOOD: Check parallel_quiz first
if (game.phase === 'parallel_quiz') {
  // Handle parallel phase...
}
if (game.phase === 'game_over') {
  return <GameOver />;
}
```

### 2. Not Handling No-Assassin Case

```typescript
// BAD: Assuming Assassin always exists
const assassin = playerRoles.find(r => r.special_role === 'assassin')!;

// GOOD: Handle missing Assassin
const assassin = playerRoles.find(r => r.special_role === 'assassin');
if (!assassin && outcome === 'good_win') {
  // No assassination needed, just quiz
}
```

### 3. Using Wrong Count for Progress

```typescript
// BAD: Using total_players for progress
<div>{votesSubmitted} of {totalPlayers} voted</div>

// GOOD: Using eligible count
<div>{votesSubmitted} of {eligibleCount} voted</div>
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/types/game.ts` | Modify | Add `parallel_quiz` phase, new types |
| `src/lib/domain/quiz-eligibility.ts` | New | Eligibility calculation logic |
| `src/lib/domain/merlin-quiz.ts` | Modify | Add parallel completion logic |
| `src/lib/domain/game-state-machine.ts` | Modify | Add `parallel_quiz` transitions |
| `src/lib/domain/win-conditions.ts` | Modify | Trigger parallel phase |
| `src/components/game/GameBoard.tsx` | Modify | Route to correct component |
| `src/components/game/ParallelQuizWaiting.tsx` | New | Waiting screen component |
| `src/components/game/MerlinQuiz.tsx` | Modify | Parallel mode support |
| `src/components/game/MerlinQuizResults.tsx` | Modify | Individual vote display |
| `src/app/api/games/[gameId]/route.ts` | Modify | Include parallel state |
| `src/app/api/games/[gameId]/merlin-quiz/route.ts` | Modify | Parallel phase validation |
| `src/app/api/games/[gameId]/assassin-guess/route.ts` | Modify | Wait for quiz completion |
