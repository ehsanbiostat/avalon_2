# Data Model: Endgame Merlin Quiz

**Feature**: 010-endgame-merlin-quiz
**Date**: 2025-12-20

## Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────────┐
│      games       │         │   merlin_quiz_votes  │
├──────────────────┤         ├──────────────────────┤
│ id (PK)          │◄────────│ game_id (FK)         │
│ room_id          │         │ voter_player_id (FK) │───────┐
│ phase            │         │ suspected_player_id  │───────┤
│ winner           │         │ submitted_at         │       │
│ ...              │         │                      │       │
└──────────────────┘         │ UNIQUE(game_id,      │       │
                             │   voter_player_id)   │       │
                             └──────────────────────┘       │
                                                            │
┌──────────────────┐                                        │
│     players      │◄───────────────────────────────────────┘
├──────────────────┤
│ id (PK)          │
│ player_id        │
│ nickname         │
└──────────────────┘
```

## New Table: merlin_quiz_votes

### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique vote identifier |
| `game_id` | UUID | NOT NULL, REFERENCES games(id) ON DELETE CASCADE | Game this vote belongs to |
| `voter_player_id` | UUID | NOT NULL, REFERENCES players(id) | Player who submitted the vote |
| `suspected_player_id` | UUID | REFERENCES players(id), NULLABLE | Player voted as suspected Merlin (NULL = skipped) |
| `submitted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When the vote was submitted |

### Constraints

- **Primary Key**: `id`
- **Foreign Keys**:
  - `game_id` → `games(id)` with CASCADE delete
  - `voter_player_id` → `players(id)`
  - `suspected_player_id` → `players(id)` (nullable)
- **Unique**: `(game_id, voter_player_id)` - One vote per player per game

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_quiz_votes_game_id` | `game_id` | Fast lookup of all votes for a game |

### RLS Policies

| Policy | Operation | Condition |
|--------|-----------|-----------|
| "Room members can read quiz votes" | SELECT | Player is in the game's room via room_players |
| "Players can insert own vote" | INSERT | Voter matches current player AND game is in game_over phase |
| "Service role manages quiz" | ALL | Service role bypass |

## Migration SQL: 013_merlin_quiz.sql

```sql
-- ============================================
-- Migration: 013_merlin_quiz.sql
-- Feature: 010 - Endgame Merlin Quiz
-- Date: 2025-12-20
-- Description: Add table for storing Merlin quiz votes at game end
-- ============================================

-- ============================================
-- MERLIN QUIZ VOTES TABLE
-- Stores player guesses for who they think is Merlin
-- ============================================

CREATE TABLE merlin_quiz_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  voter_player_id UUID NOT NULL REFERENCES players(id),
  suspected_player_id UUID REFERENCES players(id),  -- NULL if player skipped
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One vote per player per game
  UNIQUE(game_id, voter_player_id)
);

-- Index for efficient game lookups
CREATE INDEX idx_quiz_votes_game_id ON merlin_quiz_votes(game_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE merlin_quiz_votes ENABLE ROW LEVEL SECURITY;

-- Room members can read quiz votes (after they exist)
CREATE POLICY "Room members can read quiz votes"
  ON merlin_quiz_votes FOR SELECT
  USING (
    game_id IN (
      SELECT g.id FROM games g
      JOIN room_players rp ON g.room_id = rp.room_id
      JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );

-- Players can insert their own vote (game must be in game_over phase)
CREATE POLICY "Players can insert own quiz vote"
  ON merlin_quiz_votes FOR INSERT
  WITH CHECK (
    voter_player_id IN (
      SELECT id FROM players
      WHERE player_id = current_setting('app.player_id', true)
    )
    AND game_id IN (
      SELECT id FROM games WHERE phase = 'game_over'
    )
  );

-- Service role can do everything (for API operations)
CREATE POLICY "Service role manages quiz votes"
  ON merlin_quiz_votes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE merlin_quiz_votes;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE merlin_quiz_votes IS 
  'Stores player guesses for the end-of-game Merlin quiz. One vote per player per game.';
COMMENT ON COLUMN merlin_quiz_votes.suspected_player_id IS 
  'Player voted as suspected Merlin. NULL if the voter chose to skip.';
COMMENT ON COLUMN merlin_quiz_votes.submitted_at IS 
  'Timestamp of vote submission. First vote timestamp serves as quiz start time.';

-- ============================================
-- END OF MIGRATION
-- ============================================
```

## TypeScript Types

### New Types (add to `src/types/game.ts`)

```typescript
// ============================================
// MERLIN QUIZ TYPES
// ============================================

/**
 * A single quiz vote record
 */
export interface MerlinQuizVote {
  id: string;
  game_id: string;
  voter_player_id: string;
  suspected_player_id: string | null;  // null = skipped
  submitted_at: string;
}

/**
 * Insert type for creating a quiz vote
 */
export interface MerlinQuizVoteInsert {
  game_id: string;
  voter_player_id: string;
  suspected_player_id: string | null;
}

/**
 * Quiz state for client display
 */
export interface MerlinQuizState {
  quiz_enabled: boolean;          // True if Merlin was in game
  quiz_active: boolean;           // True if quiz is in progress
  quiz_complete: boolean;         // True if all voted or timeout
  my_vote: string | null;         // Current player's vote (null if not voted, 'skipped' if skipped)
  has_voted: boolean;             // Whether current player has voted
  votes_submitted: number;        // Count of votes submitted
  total_players: number;          // Total players in game
  connected_players: number;      // Currently connected players
  quiz_started_at: string | null; // First vote timestamp for timeout calc
  timeout_seconds: number;        // Quiz timeout (60)
}

/**
 * Quiz results for display
 */
export interface MerlinQuizResults {
  results: MerlinQuizResultEntry[];
  actual_merlin_id: string;
  actual_merlin_nickname: string;
}

/**
 * Single entry in quiz results table
 */
export interface MerlinQuizResultEntry {
  player_id: string;
  nickname: string;
  vote_count: number;
  is_most_voted: boolean;
  is_actual_merlin: boolean;
}

/**
 * API request for submitting a quiz vote
 */
export interface MerlinQuizVoteRequest {
  suspected_player_id: string | null;  // null = skip
}

/**
 * API response for submitting a quiz vote
 */
export interface MerlinQuizVoteResponse {
  success: boolean;
  votes_submitted: number;
  total_players: number;
  quiz_complete: boolean;
}
```

## State Transitions

The quiz doesn't add new game phases, but tracks internal state:

```
Game Phase: game_over (fixed)
    │
    ├── hasMerlin = false → [No Quiz] → Role Reveal
    │
    └── hasMerlin = true
            │
            ▼
        ┌─────────────────┐
        │  Quiz Active    │
        │  - Voting open  │
        │  - Timer running│
        └────────┬────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
 All voted            Timeout (60s)
      │                     │
      └──────────┬──────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Quiz Complete  │
        │  - Show results │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Role Reveal    │
        │  - Show roles   │
        └─────────────────┘
```

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| Game must be in `game_over` phase | RLS policy + API check |
| Player can only vote once per game | UNIQUE constraint |
| Player cannot vote for themselves | API validation |
| Suspected player must be in game | API validation via seating_order |
| Vote must include valid player or null | API validation |

