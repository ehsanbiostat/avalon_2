# Implementation Plan: Endgame Merlin Quiz

**Branch**: `010-endgame-merlin-quiz` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-endgame-merlin-quiz/spec.md`
**Depends On**: Special Roles (002), Quest System (003), Assassin Phase (008) ✅ Complete

## Summary

Add a "Guess the Merlin" quiz at game end where all players vote on who they think was Merlin before the actual roles are revealed. The quiz is purely social/fun and has **zero impact on game outcome**. Critical requirement: Quiz must only appear **after** the `game_over` phase is reached (meaning Assassin phase, if applicable, has already completed).

## Technical Context

**Existing Stack** (from previous phases):
- TypeScript 5.x, Node.js 20.x
- Next.js 14+ (App Router), React 18+, Supabase JS Client v2, Tailwind CSS 3.x
- Supabase Postgres with RLS, Browser localStorage for player ID
- Vitest for unit tests, Playwright for E2E
- Existing `game_over` phase handling in GameOver component
- Existing votes table pattern from team proposal voting

**New for This Feature**:
- New `merlin_quiz_votes` table for storing player guesses
- New sub-phase in game_over: `quiz_active` vs `quiz_complete` (tracked client-side or via votes count)
- New API endpoints for quiz vote submission and results
- Updated GameOver component with quiz panel and results table
- Real-time subscription for quiz vote updates

**Performance Goals**: Quiz results display within 2s of completion
**Constraints**: Quiz must NEVER appear before game_over phase; 60s timeout maximum

## Constitution Check

*GATE: Must pass before proceeding. All principles inherited from previous implementations.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Purpose & Vision | ✅ PASS | Social feature; incremental delivery |
| II. Tech Stack | ✅ PASS | Same stack; follows existing patterns |
| III. Data & Security | ✅ PASS | RLS policies follow existing patterns; server-side validation |
| IV. Code Quality | ✅ PASS | Pure functions for quiz logic; typed interfaces |
| V. Testing | ✅ PASS | Unit tests for quiz state; integration tests for flow |
| VI. UX Principles | ✅ PASS | Clear UI; timeout prevents blocking; results are fun |
| VII. Workflow | ✅ PASS | Spec-driven; extends branch pattern |

**Result**: All gates passed. Proceeding with implementation plan.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  EXISTING GAME FLOW (UNCHANGED)                          │
│                                                                          │
│   [Game Phases] → quest → assassin (if applicable) → game_over          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  NEW: QUIZ LAYER (AT game_over ONLY)                     │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    GameOver Component                            │   │
│   │  ┌───────────────────────────────────────────────────────────┐  │   │
│   │  │  1. Winner Banner (unchanged)                              │  │   │
│   │  ├───────────────────────────────────────────────────────────┤  │   │
│   │  │  2. NEW: MerlinQuiz Panel (only if Merlin was in game)    │  │   │
│   │  │     - Shows player selection grid                          │  │   │
│   │  │     - "Submit Guess" / "Skip" buttons                      │  │   │
│   │  │     - Vote counter and timeout                             │  │   │
│   │  ├───────────────────────────────────────────────────────────┤  │   │
│   │  │  3. NEW: MerlinQuizResults (after all votes/timeout)      │  │   │
│   │  │     - Table with player names and vote counts              │  │   │
│   │  │     - Highlight most-voted player(s)                       │  │   │
│   │  ├───────────────────────────────────────────────────────────┤  │   │
│   │  │  4. Role Reveal (existing, shown AFTER quiz complete)     │  │   │
│   │  └───────────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ NEW TABLE: merlin_quiz_votes                                     │   │
│   │   - game_id, voter_player_id, suspected_player_id, submitted_at │   │
│   │   - RLS: Room members can read after quiz complete               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Project Structure (Changes Only)

### New/Modified Files

```text
src/
├── components/
│   └── game/
│       ├── GameOver.tsx           # MODIFY: Add quiz panel orchestration
│       ├── MerlinQuiz.tsx         # NEW: Quiz voting panel
│       └── MerlinQuizResults.tsx  # NEW: Results table display
├── lib/
│   ├── domain/
│   │   └── merlin-quiz.ts         # NEW: Quiz state logic
│   └── supabase/
│       └── merlin-quiz.ts         # NEW: Quiz database operations
├── types/
│   └── game.ts                    # MODIFY: Add quiz types
└── app/
    └── api/
        └── games/
            └── [gameId]/
                └── merlin-quiz/
                    ├── route.ts   # NEW: GET quiz state, POST vote
                    └── results/
                        └── route.ts # NEW: GET quiz results

supabase/migrations/
└── 013_merlin_quiz.sql            # NEW: Quiz votes table

tests/
└── unit/
    └── domain/
        └── merlin-quiz.test.ts    # NEW: Quiz logic tests
```

## Database Schema

See [data-model.md](./data-model.md) for complete schema details.

### Migration: 013_merlin_quiz.sql

```sql
-- Store player guesses for the Merlin quiz
CREATE TABLE merlin_quiz_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  voter_player_id UUID NOT NULL REFERENCES players(id),
  suspected_player_id UUID REFERENCES players(id),  -- NULL if skipped
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One vote per player per game
  UNIQUE(game_id, voter_player_id)
);

-- Indexes
CREATE INDEX idx_quiz_votes_game_id ON merlin_quiz_votes(game_id);

-- RLS policies (room members can read/write their own votes)
```

## API Contracts

See [contracts/api.md](./contracts/api.md) for complete API documentation.

### New: POST `/api/games/[gameId]/merlin-quiz`

Submit a quiz vote.

**Request**:
```typescript
{ suspected_player_id: string | null }  // null = skip
```

**Response**:
```typescript
{
  success: true,
  votes_submitted: number,
  total_players: number
}
```

### New: GET `/api/games/[gameId]/merlin-quiz/results`

Get quiz results (only after quiz complete).

**Response**:
```typescript
{
  quiz_complete: boolean,
  results: Array<{
    player_id: string,
    nickname: string,
    vote_count: number,
    is_most_voted: boolean
  }>,
  actual_merlin_id: string  // Revealed after quiz
}
```

## Implementation Phases

### Phase 1: Database & Types (Foundation)

**Goal**: Schema ready, types defined

1. Create migration `013_merlin_quiz.sql`
2. Run migration on Supabase
3. Add quiz types to `src/types/game.ts`:
   - `MerlinQuizVote`
   - `MerlinQuizState`
   - `MerlinQuizResults`
4. Update database types

**Checkpoint**: Database accepts quiz votes, TypeScript compiles

### Phase 2: Domain Logic

**Goal**: Quiz state management implemented

1. Create `src/lib/domain/merlin-quiz.ts`:
   - `canShowQuiz(game, roleAssignments)` - Check if Merlin was in game
   - `isQuizComplete(votes, expectedPlayers, connectedPlayers)` - Check completion
   - `calculateQuizResults(votes, players)` - Aggregate vote counts
   - `hasPlayerVoted(votes, playerId)` - Check individual status
2. Create `src/lib/supabase/merlin-quiz.ts`:
   - `submitQuizVote(client, gameId, voterId, suspectedId)`
   - `getQuizVotes(client, gameId)`
   - `getQuizVoteCount(client, gameId)`
3. Unit tests for all domain logic

**Checkpoint**: Domain logic validated with tests

### Phase 3: API Endpoints

**Goal**: Endpoints support quiz operations

1. Create `POST /api/games/[gameId]/merlin-quiz`:
   - Validate game is in `game_over` phase
   - Validate player hasn't already voted
   - Validate suspected player is not self
   - Validate suspected player is in game
   - Insert vote
   - Return updated vote count
2. Create `GET /api/games/[gameId]/merlin-quiz/results`:
   - Validate game is in `game_over` phase
   - Get all votes
   - Calculate results
   - Include actual Merlin ID for reveal

**Checkpoint**: APIs return correct data

### Phase 4: Quiz UI Components

**Goal**: Quiz panel and results display

1. Create `src/components/game/MerlinQuiz.tsx`:
   - Player selection grid (exclude self)
   - Submit button (disabled until selection)
   - Skip button
   - Vote count progress
   - Timeout countdown (60s)
   - "Waiting for others" state after voting
2. Create `src/components/game/MerlinQuizResults.tsx`:
   - Results table with vote counts
   - Highlight most-voted player(s)
   - "Proceed to Role Reveal" button
3. Wire up real-time subscription for vote updates

**Checkpoint**: UI components render correctly

### Phase 5: GameOver Integration

**Goal**: Quiz integrated into game over flow

1. Update `src/components/game/GameOver.tsx`:
   - Check if Merlin was in game (`hasMerlin`)
   - Track quiz state: `quiz_active` | `quiz_complete` | `no_quiz`
   - Show MerlinQuiz when active
   - Show MerlinQuizResults when complete
   - Show Role Reveal only after quiz complete (or no quiz)
2. Handle timeout:
   - After 60s, auto-complete quiz with current votes
   - Show results even if not all voted
3. Update `GET /api/games/[gameId]`:
   - Include `has_merlin` flag in response
   - Include quiz vote count for real-time display

**Checkpoint**: Full flow works end-to-end

### Phase 6: Polish & Edge Cases

**Goal**: Feature complete and robust

1. Handle disconnected players:
   - Count only connected players for completion
   - Disconnected players' pending votes become "no vote"
2. Handle late joiners:
   - If player reconnects during quiz, they can still vote
3. Mobile responsiveness
4. Error handling for edge cases
5. Integration tests:
   - Game ends → Quiz appears (if Merlin) → All vote → Results → Role reveal
   - Game ends → Quiz appears → Timeout → Results → Role reveal
   - Game ends without Merlin → No quiz → Direct role reveal

**Checkpoint**: Feature complete

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Quiz appears before Assassin phase | Hard check: quiz only at `game_over` phase |
| Quiz blocks role reveal indefinitely | 60s timeout with auto-complete |
| Race condition on vote submission | Unique constraint + optimistic locking |
| Confusion about quiz vs Assassin | Different UI, clear messaging |
| Performance with many votes | Single table query, indexed by game_id |

## Complexity Tracking

| Decision | Justification |
|----------|---------------|
| Separate table (not JSONB in games) | Enables real-time subscription; cleaner queries |
| Client-side timeout | Simpler than server-side timer; 60s is short enough |
| Show results before role reveal | Preserves the "guess" experience before knowing truth |

## Dependencies

- Quest System (003) must be complete for game_over phase
- Assassin Phase (008) must be complete to ensure correct sequencing
- All existing game_over logic must remain unchanged

## Success Metrics

- Quiz appears only when Merlin was in game
- Quiz NEVER appears before game_over phase
- All players can vote within 60s
- Results display within 2s of completion
- Role reveal not delayed more than 90s total
