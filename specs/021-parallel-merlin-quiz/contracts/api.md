# API Contracts: Parallel Merlin Quiz

**Feature**: 021-parallel-merlin-quiz
**Date**: 2026-01-02

## Overview

This document defines the API contract changes for the parallel Merlin quiz feature. Most endpoints receive minor modifications; the core logic changes are in the response payloads and phase handling.

---

## Modified Endpoints

### 1. GET /api/games/[gameId]

**Purpose**: Get game state (modified to include parallel quiz state)

**Response Changes**:

```typescript
// GameStateResponse (enhanced)
{
  game: Game,
  players: GamePlayer[],
  // ... existing fields ...

  // NEW: Parallel quiz state (when phase === 'parallel_quiz')
  parallel_quiz: ParallelQuizState | null,

  // NEW: Current player's quiz eligibility
  quiz_eligibility: QuizEligibility | null
}
```

**Parallel Quiz State Structure**:

```typescript
{
  outcome: 'good_win' | 'evil_win',
  quiz_start_time: string,              // ISO timestamp
  assassin_id: string | null,           // null if no assassin
  assassin_submitted: boolean,
  assassin_guess_id: string | null,
  eligible_player_ids: string[],
  quiz_votes_submitted: number,
  quiz_complete: boolean,
  can_transition_to_game_over: boolean
}
```

**Quiz Eligibility Structure**:

```typescript
{
  canTakeQuiz: boolean,
  showAssassination: boolean,           // true only for Assassin on Good win
  showWaiting: boolean,                 // true for Merlin, Percival (no Morgana)
  reason: 'is_assassin' | 'is_merlin' | 'is_percival_certain' | 'is_percival_uncertain' | 'is_eligible' | 'no_assassin_good_win'
}
```

---

### 2. GET /api/games/[gameId]/merlin-quiz

**Purpose**: Get quiz state for current player (modified for parallel phase)

**Request Headers** (unchanged):
```
x-player-id: string  // Player's localStorage ID
```

**Response Changes**:

```typescript
{
  data: {
    // Existing fields
    quiz_enabled: boolean,
    quiz_active: boolean,
    quiz_complete: boolean,
    my_vote: string | null,
    has_voted: boolean,
    has_skipped: boolean,
    votes_submitted: number,
    total_players: number,
    connected_players: number,
    quiz_started_at: string | null,
    timeout_seconds: number,

    // NEW: Parallel phase context
    is_parallel_phase: boolean,         // true when in parallel_quiz phase
    outcome: 'good_win' | 'evil_win' | null,
    eligible_player_ids: string[],      // Who can take the quiz
    total_eligible: number,             // For "X of Y voted" display

    // NEW: Eligibility for current player
    can_take_quiz: boolean,
    show_waiting: boolean,
    eligibility_reason: string
  }
}
```

---

### 3. POST /api/games/[gameId]/merlin-quiz

**Purpose**: Submit quiz vote (modified validation for parallel phase)

**Request Body** (unchanged):
```typescript
{
  suspected_player_id: string | null  // null = skip
}
```

**New Validation Rules**:
1. Game must be in `parallel_quiz` OR `game_over` phase
2. Player must be in `eligible_player_ids` list (parallel phase)
3. Existing validations (not self, valid player, etc.)

**Response Changes**:

```typescript
{
  success: boolean,
  votes_submitted: number,
  total_players: number,           // Deprecated: use total_eligible
  total_eligible: number,          // NEW: Count of eligible players
  quiz_complete: boolean,

  // NEW: Phase transition info
  phase_complete: boolean,         // Did this vote trigger phase transition?
  new_phase: GamePhase | null      // 'game_over' if transitioned
}
```

**Error Codes** (new):
- `NOT_ELIGIBLE`: Player is not in eligible_player_ids
- `WRONG_PHASE`: Game is not in parallel_quiz phase

---

### 4. POST /api/games/[gameId]/assassin-guess

**Purpose**: Submit assassination guess (modified for parallel phase)

**Request Body** (unchanged):
```typescript
{
  player_id: string,           // Assassin's player ID
  guessed_player_id: string    // Assassination target
}
```

**New Validation Rules**:
1. Game must be in `parallel_quiz` phase (or legacy `assassin` phase)
2. Assassin has not already submitted
3. Existing validations (is assassin, valid target, etc.)

**Response Changes**:

```typescript
{
  success: boolean,
  winner: GameWinner | null,           // null if quiz not complete yet
  win_reason: string | null,
  assassin_found_merlin: boolean,
  merlin_id: string,

  // NEW: Phase state
  phase_complete: boolean,             // Did this trigger phase transition?
  waiting_for_quiz: boolean,           // true if quiz still in progress
  quiz_votes_submitted: number,        // Current quiz progress
  quiz_total_eligible: number          // Total eligible for quiz
}
```

**New Behavior**:
- If quiz is not complete, response includes `waiting_for_quiz: true`
- Game does NOT transition to `game_over` until quiz completes
- Winner/win_reason are determined but not persisted until both complete

---

### 5. GET /api/games/[gameId]/merlin-quiz/results

**Purpose**: Get quiz results (enhanced with individual votes)

**Request Headers**:
```
x-player-id: string
```

**Response** (enhanced):

```typescript
{
  data: {
    // Existing fields
    quiz_complete: boolean,
    actual_merlin_id: string,
    actual_merlin_nickname: string,
    total_votes: number,
    skipped_count: number,

    // Existing: Aggregated results by suspect
    results: [
      {
        player_id: string,
        nickname: string,
        vote_count: number,
        is_most_voted: boolean,
        is_actual_merlin: boolean
      }
    ],

    // NEW: Individual vote breakdown (Feature 021)
    individual_votes: [
      {
        voter_id: string,
        voter_nickname: string,
        guessed_id: string | null,        // null = did not vote
        guessed_nickname: string | null,
        is_correct: boolean
      }
    ],

    // NEW: Summary statistics
    correct_count: number,                // Players who guessed correctly
    eligible_count: number,               // Total eligible voters
    correct_percentage: number            // 0-100
  }
}
```

---

## New Real-time Events

### Event: parallel_quiz_vote

**Trigger**: When a quiz vote is submitted during parallel phase

**Payload**:
```typescript
{
  event: 'parallel_quiz_vote',
  payload: {
    game_id: string,
    votes_submitted: number,
    total_eligible: number,
    quiz_start_time: string,
    quiz_complete: boolean
  }
}
```

**Subscribers**: All players in the game

---

### Event: parallel_phase_complete

**Trigger**: When both quiz and assassination (if applicable) are complete

**Payload**:
```typescript
{
  event: 'parallel_phase_complete',
  payload: {
    game_id: string,
    winner: 'good' | 'evil',
    win_reason: string,
    assassin_found_merlin: boolean | null,  // null if no assassin
    new_phase: 'game_over'
  }
}
```

**Subscribers**: All players in the game

---

### Event: assassin_submitted (modified)

**Trigger**: When Assassin submits guess (parallel phase)

**Payload** (new fields):
```typescript
{
  event: 'assassin_submitted',
  payload: {
    game_id: string,
    assassin_id: string,
    // NEW: Phase state
    waiting_for_quiz: boolean,
    quiz_votes_submitted: number,
    quiz_total_eligible: number
  }
}
```

**Note**: Does NOT reveal who was targeted until phase completes

---

## Error Responses

### Standard Error Format (unchanged)

```typescript
{
  error: {
    code: string,
    message: string
  }
}
```

### New Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_ELIGIBLE` | 403 | Player is not eligible to take quiz |
| `WRONG_PHASE` | 400 | Game is not in expected phase |
| `QUIZ_NOT_COMPLETE` | 400 | Cannot get results; quiz in progress |
| `ASSASSIN_ALREADY_SUBMITTED` | 400 | Assassin already made their guess |

---

## Sequence Diagrams

### Good Win: Parallel Quiz + Assassination

```
Player A (Assassin)          Server           Player B (Good)
    |                          |                    |
    |  [Quest 3 succeeds]      |                    |
    |------------------------->|                    |
    |                          |--[parallel_quiz]-->|
    |                          |                    |
    |  GET /games/X            |  GET /games/X      |
    |------------------------->|<-------------------|
    |  {showAssassination}     |  {canTakeQuiz}     |
    |<-------------------------|-------------------->|
    |                          |                    |
    |                          |  POST /merlin-quiz |
    |                          |<-------------------|
    |                          |  {success}         |
    |                          |-------------------->|
    |                          |                    |
    |  POST /assassin-guess    |                    |
    |------------------------->|                    |
    |  {waiting_for_quiz}      |                    |
    |<-------------------------|                    |
    |                          |                    |
    |        [Quiz timeout or all votes]           |
    |                          |                    |
    |  {parallel_phase_complete}                   |
    |<-------------------------|-------------------->|
    |                          |                    |
    |  GET /merlin-quiz/results                    |
    |<-------------------------|-------------------->|
```

### Evil Win: Quiz for Eligible Players

```
Merlin                       Server           Other Player
    |                          |                    |
    |  [Quest 3 fails]         |                    |
    |------------------------->|                    |
    |                          |--[parallel_quiz]-->|
    |                          |                    |
    |  GET /games/X            |  GET /games/X      |
    |------------------------->|<-------------------|
    |  {showWaiting}           |  {canTakeQuiz}     |
    |<-------------------------|-------------------->|
    |                          |                    |
    |                          |  POST /merlin-quiz |
    |                          |<-------------------|
    |  {quiz_vote broadcast}   |  {success}         |
    |<-------------------------|-------------------->|
    |                          |                    |
    |        [Quiz timeout or all votes]           |
    |                          |                    |
    |  {parallel_phase_complete}                   |
    |<-------------------------|-------------------->|
```

---

## Backward Compatibility

### Legacy `assassin` Phase Support

Games already in `assassin` phase will continue to work:

1. `GET /api/games/[gameId]` returns `phase: 'assassin'`
2. `POST /api/games/[gameId]/assassin-guess` works normally
3. Transitions directly to `game_over` (no parallel quiz)

### Client Detection

Clients can detect parallel vs legacy mode:

```typescript
if (game.phase === 'parallel_quiz') {
  // New parallel flow
  if (quiz_eligibility.showAssassination) {
    // Show AssassinPhase component
  } else if (quiz_eligibility.canTakeQuiz) {
    // Show MerlinQuiz component
  } else {
    // Show ParallelQuizWaiting component
  }
} else if (game.phase === 'assassin') {
  // Legacy flow - show AssassinPhase for all
}
```
