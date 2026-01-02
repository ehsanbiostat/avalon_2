# Data Model: Parallel Merlin Quiz

**Feature**: 021-parallel-merlin-quiz
**Date**: 2026-01-02

## Overview

This feature modifies the game state machine and quiz system to support parallel execution of the Merlin quiz and assassination phase. No new database tables are required; changes are to existing types and domain logic.

## Type Changes

### 1. GamePhase Enum Extension

**File**: `src/types/game.ts`

```typescript
export type GamePhase =
  | 'team_building'
  | 'voting'
  | 'quest'
  | 'quest_result'
  | 'lady_of_lake'
  | 'assassin'           // DEPRECATED: Keep for backward compatibility
  | 'parallel_quiz'      // NEW: Parallel quiz + assassination phase
  | 'game_over';
```

**Notes**:
- `assassin` phase kept for backward compatibility but new games use `parallel_quiz`
- Existing games in `assassin` phase continue to work normally

### 2. ParallelQuizState Type (NEW)

**File**: `src/types/game.ts`

```typescript
/**
 * Parallel quiz/assassination phase state
 * Feature 021: Tracks both quiz votes and assassination in parallel
 */
export interface ParallelQuizState {
  // Phase metadata
  outcome: 'good_win' | 'evil_win';         // What triggered this phase
  quiz_start_time: string;                   // ISO timestamp for 60s timeout

  // Assassination tracking (only for good_win)
  assassin_id: string | null;                // Assassin player ID (null if no assassin)
  assassin_submitted: boolean;               // Has assassin made their choice
  assassin_guess_id: string | null;          // Who assassin targeted

  // Quiz tracking
  eligible_player_ids: string[];             // Players who can/should take quiz
  quiz_votes_submitted: number;              // Count of votes submitted
  quiz_complete: boolean;                    // All votes in OR timeout

  // Completion status
  can_transition_to_game_over: boolean;      // Both conditions met
}
```

### 3. QuizEligibility Type (NEW)

**File**: `src/types/game.ts`

```typescript
/**
 * Quiz eligibility result for a single player
 * Feature 021: Determines what UI each player sees during parallel phase
 */
export interface QuizEligibility {
  canTakeQuiz: boolean;           // Player can submit a quiz vote
  showAssassination: boolean;     // Player sees assassination UI (Assassin only)
  showWaiting: boolean;           // Player sees waiting screen (ineligible for quiz)
  reason: QuizEligibilityReason;  // Why this eligibility was assigned
}

export type QuizEligibilityReason =
  | 'is_assassin'              // Good win: Assassin does assassination, not quiz
  | 'is_merlin'                // Evil win: Merlin knows themselves
  | 'is_percival_certain'      // Evil win, no Morgana: Percival knows Merlin
  | 'is_percival_uncertain'    // Evil win, with Morgana: Percival has 50/50
  | 'is_eligible'              // Can take quiz normally
  | 'no_assassin_good_win';    // Good win without Assassin: everyone takes quiz
```

### 4. Enhanced MerlinQuizResults Type

**File**: `src/types/game.ts`

```typescript
/**
 * Enhanced quiz results with individual vote breakdown
 * Feature 021: Shows who voted for whom
 */
export interface MerlinQuizResultsEnhanced extends MerlinQuizResults {
  // Individual vote breakdown
  individual_votes: IndividualQuizVote[];
}

export interface IndividualQuizVote {
  voter_id: string;
  voter_nickname: string;
  guessed_id: string | null;         // null = did not vote
  guessed_nickname: string | null;   // null = did not vote
  is_correct: boolean;
}
```

### 5. GameState Extension

**File**: `src/types/game.ts`

```typescript
export interface GameState {
  // ... existing fields ...

  // Feature 021: Parallel quiz state
  parallel_quiz: ParallelQuizState | null;
  quiz_eligibility: QuizEligibility | null;
}
```

## Domain Logic Types

### 1. Quiz Eligibility Function

**File**: `src/lib/domain/quiz-eligibility.ts`

```typescript
/**
 * Input for quiz eligibility calculation
 */
export interface QuizEligibilityInput {
  outcome: 'good_win' | 'evil_win';
  playerSpecialRole: string | null;
  hasMorgana: boolean;
  hasAssassin: boolean;
}

/**
 * Calculate quiz eligibility for a player
 */
export function getQuizEligibility(input: QuizEligibilityInput): QuizEligibility;

/**
 * Get list of eligible player IDs for quiz
 */
export function getEligibleQuizPlayers(
  outcome: 'good_win' | 'evil_win',
  players: Array<{ id: string; special_role: string | null }>,
  hasMorgana: boolean
): string[];
```

### 2. Parallel Phase Completion Logic

**File**: `src/lib/domain/merlin-quiz.ts`

```typescript
/**
 * Check if parallel phase can transition to game_over
 */
export function canCompleteParallelPhase(
  outcome: 'good_win' | 'evil_win',
  hasAssassin: boolean,
  assassinSubmitted: boolean,
  quizComplete: boolean
): boolean;

/**
 * Check if quiz is complete (all votes or timeout)
 */
export function isParallelQuizComplete(
  votesSubmitted: number,
  eligiblePlayers: number,
  quizStartTime: string
): boolean;
```

## State Transitions

### New State Machine Transitions

```
VALID_TRANSITIONS = {
  // ... existing ...
  quest_result: [
    'team_building',      // Next quest
    'lady_of_lake',       // Lady phase
    'parallel_quiz',      // NEW: Good wins 3 OR Evil wins 3/5 (with Merlin)
    'game_over'           // Evil wins 3/5 (no Merlin)
  ],
  parallel_quiz: [
    'game_over'           // Quiz + assassination complete
  ],
  // Keep assassin for backward compatibility
  assassin: ['game_over']
}
```

### Transition Triggers

| Current Phase | Condition | Next Phase |
|---------------|-----------|------------|
| quest_result | Good wins 3, has Merlin | parallel_quiz |
| quest_result | Evil wins (3 failures OR 5 rejections), has Merlin | parallel_quiz |
| quest_result | Evil wins, no Merlin | game_over |
| quest_result | Good wins, no Merlin, no Assassin | parallel_quiz (quiz only) |
| parallel_quiz | Assassin submitted + quiz complete | game_over |
| parallel_quiz | No Assassin + quiz complete | game_over |

## Database Considerations

### No Schema Changes Required

The existing `merlin_quiz_votes` table and `games` table are sufficient:

```sql
-- Existing table (no changes)
CREATE TABLE merlin_quiz_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  voter_player_id UUID REFERENCES players(id),
  suspected_player_id UUID REFERENCES players(id),  -- NULL = skipped
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table: phase column already supports string values
-- Just need to use 'parallel_quiz' as a valid phase value
```

### Game Table Phase Values

The `games.phase` column is a text field validated by application logic. Add `parallel_quiz` to:

1. TypeScript `GamePhase` type
2. `VALID_TRANSITIONS` state machine
3. API route phase validation

## Validation Rules

### Quiz Vote Validation (Enhanced)

```typescript
// Existing rules (unchanged)
- Voter must be in game (seating_order)
- Cannot vote for self
- Suspected player must be in game
- Null vote (skip) is valid

// New rule for parallel phase
- Voter must be in eligible_player_ids list
```

### Phase Transition Validation

```typescript
// New validation for parallel_quiz entry
- Game must have Merlin role
- Must be Good win (3 quests) OR Evil win (3 failures / 5 rejections)

// New validation for parallel_quiz exit
- If Good win with Assassin: assassin_submitted must be true
- Quiz must be complete (votes == eligible OR timeout elapsed)
```

## Real-time Broadcast Events

### New Event: Quiz Vote Count

```typescript
// Broadcast when a quiz vote is submitted
{
  event: 'parallel_quiz_vote',
  payload: {
    game_id: string;
    votes_submitted: number;
    total_eligible: number;
    quiz_start_time: string;
  }
}
```

### New Event: Parallel Phase Complete

```typescript
// Broadcast when parallel phase transitions to game_over
{
  event: 'parallel_phase_complete',
  payload: {
    game_id: string;
    winner: 'good' | 'evil';
    win_reason: string;
    assassin_found_merlin?: boolean;  // Only for Good wins
  }
}
```

## Migration Notes

### Backward Compatibility

- Existing games in `assassin` phase continue to work
- New games use `parallel_quiz` phase
- No database migration needed (phase is a string column)

### Deployment Strategy

1. Deploy code with both `assassin` and `parallel_quiz` support
2. New games automatically use `parallel_quiz`
3. Old games complete with `assassin` phase
4. Eventually deprecate `assassin` phase handling (future cleanup)
