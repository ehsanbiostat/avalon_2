# Research: Parallel Merlin Quiz

**Feature**: 021-parallel-merlin-quiz
**Date**: 2026-01-02

## Research Tasks

### 1. Game Phase State Machine Changes

**Question**: How to handle the new parallel quiz/assassination flow?

**Decision**: Introduce a new game phase `parallel_quiz` that triggers when Good wins 3 quests (with Merlin+Assassin) OR when Evil wins (with Merlin).

**Rationale**:
- Current flow: `quest_result` → `assassin` → `game_over`
- New flow (Good wins): `quest_result` → `parallel_quiz` → `game_over`
- New flow (Evil wins): `quest_result` → `parallel_quiz` → `game_over`
- The `assassin` phase is now handled WITHIN `parallel_quiz` for the Assassin player only

**Alternatives Considered**:
1. Keep `assassin` phase and add quiz as sub-state → Rejected: Too complex, breaks existing state machine
2. Add `quiz_in_progress` flag to `game_over` → Rejected: `game_over` should be terminal
3. **Selected**: New `parallel_quiz` phase that encapsulates both activities

### 2. Quiz Eligibility Logic

**Question**: How to determine which players see the quiz vs waiting screen vs assassination screen?

**Decision**: Create a pure function `getQuizEligibility()` that returns eligibility based on:
- Game outcome (Good win vs Evil win)
- Player's special role
- Presence of Morgana (for Percival edge case)

**Rationale**:
- Centralized eligibility logic is testable and reusable
- Keeps UI components simple (just render based on eligibility)
- Easy to extend for future role additions

**Eligibility Matrix**:

| Scenario | Merlin | Percival (no Morgana) | Percival (with Morgana) | Assassin | Other Evil | Other Good |
|----------|--------|----------------------|------------------------|----------|------------|------------|
| Good wins | Quiz | Quiz | Quiz | Assassination | Quiz | Quiz |
| Evil wins | Waiting | Waiting | Quiz | Quiz | Quiz | Quiz |

### 3. Parallel Phase Completion Logic

**Question**: When does the game transition from `parallel_quiz` to `game_over`?

**Decision**: Transition when BOTH conditions are met:
1. Assassin has submitted (Good win) OR no Assassin required (Evil win)
2. Quiz is complete (all eligible votes OR 60-second timeout)

**Rationale**:
- Assassin must always make a choice (no timeout) - core game mechanic
- Quiz timeout prevents indefinite waiting
- Both conditions ensure fair parallel execution

**Implementation**:
```typescript
function canTransitionToGameOver(
  outcome: 'good_win' | 'evil_win',
  assassinSubmitted: boolean,
  quizComplete: boolean
): boolean {
  if (outcome === 'evil_win') {
    // No assassination needed
    return quizComplete;
  }
  // Good win: need both
  return assassinSubmitted && quizComplete;
}
```

### 4. Real-time Vote Count Broadcasting

**Question**: How to show vote progress without revealing who voted?

**Decision**: Use existing Supabase Realtime broadcast pattern with anonymous count.

**Rationale**:
- Already have `broadcastActionSubmitted()` pattern for quest actions
- Just need vote count, not voter identity
- Privacy preserved while showing progress

**Broadcast Payload**:
```typescript
interface QuizVoteCountBroadcast {
  event: 'quiz_vote_count';
  payload: {
    votes_submitted: number;
    total_eligible: number;
    quiz_start_time: string;
  };
}
```

### 5. Results Display Enhancement

**Question**: How to show full vote breakdown intuitively?

**Decision**: Two-section results display:
1. **Summary Card**: "X of Y players guessed correctly" with Merlin reveal
2. **Vote Breakdown Table**: Each player's guess (or "did not vote")

**Rationale**:
- Summary provides quick insight
- Table shows detail for those interested
- Collapsible/expandable for mobile

**UI Structure**:
```
┌─────────────────────────────────────┐
│  🎯 MERLIN QUIZ RESULTS             │
│  ─────────────────────────────────  │
│  The real Merlin was: [Player X]    │
│  4 of 7 players guessed correctly!  │
├─────────────────────────────────────┤
│  Player      │ Guessed    │ Result  │
│  ─────────── │ ────────── │ ─────── │
│  Alice       │ Charlie ✗  │ ❌      │
│  Bob         │ Eva     ✓  │ ✅      │
│  Charlie     │ Eva     ✓  │ ✅      │
│  ...         │            │         │
└─────────────────────────────────────┘
```

### 6. Assassin Screen Isolation

**Question**: How to ensure Assassin doesn't see quiz activity?

**Decision**: Assassin's UI is unchanged - they see existing `AssassinPhase` component with no modifications.

**Rationale**:
- Existing component already works perfectly
- No "parallel quiz happening" indicator needed (per spec)
- Simpler implementation, less risk

**Implementation**:
- `GameBoard.tsx` routes Assassin to `AssassinPhase` component
- Non-Assassin players route to `MerlinQuiz` component
- Both submit to different API endpoints
- Server tracks completion of both activities

### 7. No-Assassin Edge Case

**Question**: What happens when Good wins but there's no Assassin role?

**Decision**: Skip assassination entirely, show quiz to all players, Good wins immediately.

**Rationale**:
- No assassination means Good win is instant
- Quiz still provides engagement value
- Transition to `game_over` when quiz completes

**Flow**:
1. Good wins 3 quests
2. No Assassin detected
3. Phase → `parallel_quiz` (quiz only, no assassination)
4. All players see quiz
5. Quiz completes → Phase → `game_over` with Good as winner

## Existing Code Patterns to Follow

### 1. Broadcast Pattern (Feature 016)
```typescript
// From src/lib/broadcast/game-events.ts
export async function broadcastQuizVoteCount(
  gameId: string,
  votesSubmitted: number,
  totalEligible: number
) {
  await broadcastGameEvent(gameId, {
    event: 'quiz_vote_count',
    payload: { votes_submitted: votesSubmitted, total_eligible: totalEligible }
  });
}
```

### 2. Phase Transition Pattern
```typescript
// From src/lib/domain/game-state-machine.ts
export const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  // ... existing transitions
  quest_result: ['team_building', 'lady_of_lake', 'parallel_quiz', 'game_over'],
  parallel_quiz: ['game_over'],  // NEW
  // assassin phase removed from direct transitions
};
```

### 3. Eligibility Pure Function Pattern
```typescript
// Similar to visibility.ts pattern
export function getQuizEligibility(
  outcome: 'good_win' | 'evil_win',
  playerSpecialRole: string | null,
  hasMorgana: boolean
): QuizEligibility {
  // Pure function, no side effects
  return { canTakeQuiz, showAssassination, showWaiting };
}
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Real-time sync issues | Medium | Medium | Use existing broadcast patterns, add retry logic |
| Race condition: quiz/assassination complete at same time | Low | Low | Server-side atomic transition check |
| Timeout precision drift | Low | Low | Use server timestamp for timeout calculation |
| Mobile UX regression | Medium | Low | Test on mobile, keep UI simple |

## Dependencies

No new external dependencies required. Uses existing:
- Supabase Realtime for broadcasts
- Existing `merlin_quiz_votes` table
- Existing `games` table with new `phase` value
