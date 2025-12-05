# Data Model: Real-Time Team Selection Visibility

**Feature**: 007-realtime-team-selection  
**Date**: 2025-12-05

## Overview

This document defines the database schema changes and TypeScript type updates required to store and broadcast the leader's draft team selection state.

---

## Database Schema Changes

### Modified Table: `games`

#### New Column: `draft_team`

**Purpose**: Store the leader's tentative team selection during the team_building phase, before the proposal is officially submitted.

**Type**: `text[]` (PostgreSQL array of text)  
**Nullable**: Yes (NULL when no draft in progress)  
**Default**: `NULL`

#### Migration Script

**File**: `supabase/migrations/011_draft_team_selection.sql`

```sql
-- Migration: 011_draft_team_selection.sql
-- Feature: 007-realtime-team-selection
-- Description: Add draft_team column to games table for real-time selection visibility

-- Add draft_team column to games table
ALTER TABLE games
ADD COLUMN IF NOT EXISTS draft_team text[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN games.draft_team IS 'Leader''s current draft team selection (array of player database IDs); NULL if no draft in progress or proposal already submitted';

-- Create index for faster lookups (optional, but recommended if we query by draft_team)
-- For now, NOT creating an index since draft_team is only read as part of full game state fetch
-- If we later add queries like "find all games with active drafts", add:
-- CREATE INDEX idx_games_draft_team ON games USING GIN (draft_team) WHERE draft_team IS NOT NULL;
```

#### Column Details

| Property | Value | Notes |
|----------|-------|-------|
| **Column Name** | `draft_team` | |
| **Type** | `text[]` | Array of player database IDs (UUIDs stored as text) |
| **Nullable** | `YES` | NULL indicates no draft in progress |
| **Default** | `NULL` | Games start with no draft |
| **Indexed** | No | Not queried independently; always fetched with full game state |
| **Foreign Key** | No | Player IDs are validated in application logic against `game.seating_order` |

#### Lifecycle

```text
Game Phase: waiting → (roles_confirmed)
                ↓
          [game starts]
                ↓
        team_building ←──────┐
                ↓            │
    draft_team = [...]       │ (if proposal rejected)
                ↓            │
       [leader submits]      │
                ↓            │
    draft_team = NULL        │
                ↓            │
           voting ───────────┘ (if rejected, back to team_building)
                ↓ (if approved)
           quest
                ↓
         quest_result
                ↓
     (repeat for next quest)
```

**Key State Transitions**:
1. **Set**: When leader calls `PUT /api/games/{gameId}/draft-team` (during team_building)
2. **Clear**: When leader calls `POST /api/games/{gameId}/propose` (submits proposal)
3. **Clear**: When quest advances (game.current_quest increments)
4. **Clear**: When game ends (game.phase = 'game_over')

#### Validation Rules (Application Layer)

These validations are enforced in `src/lib/domain/team-selection.ts` and `src/app/api/games/[gameId]/draft-team/route.ts`:

1. **Phase Check**: draft_team can only be updated when `game.phase = 'team_building'`
2. **Leader Check**: Only `game.current_leader_id` can update draft_team
3. **Player IDs Valid**: All IDs in draft_team must exist in `game.seating_order`
4. **Size Limit**: `draft_team.length <= quest_requirement.size`
5. **No Duplicates**: Array should not contain duplicate player IDs (enforced via set operations)

**Example Valid State**:
```json
{
  "id": "game-uuid",
  "phase": "team_building",
  "current_quest": 2,
  "current_leader_id": "player-a-id",
  "draft_team": ["player-b-id", "player-c-id", "player-d-id"],
  "seating_order": ["player-a-id", "player-b-id", "player-c-id", "player-d-id", "player-e-id"]
}
```

**Example Invalid States**:
```json
// Invalid: draft_team length exceeds quest requirement
{
  "current_quest": 1,  // Quest 1 requires 2 players
  "draft_team": ["p1", "p2", "p3"]  // ❌ Too many players
}

// Invalid: player ID not in game
{
  "seating_order": ["p1", "p2", "p3"],
  "draft_team": ["p1", "p99"]  // ❌ p99 not in seating_order
}

// Invalid: draft during wrong phase
{
  "phase": "voting",  // ❌ Not team_building
  "draft_team": ["p1", "p2"]
}
```

---

## TypeScript Type Updates

### File: `src/types/game.ts`

#### Modified: `Game` Interface

```typescript
export interface Game {
  id: string;
  room_id: string;
  phase: GamePhase;
  current_quest: number;
  current_leader_id: string;
  vote_track: number;
  seating_order: string[]; // Array of player database IDs
  player_count: number;
  quest_results: QuestResult[];
  winner: 'good' | 'evil' | null;
  win_reason: string | null;
  assassin_guess_id: string | null;
  lady_enabled: boolean;
  lady_holder_id: string | null;
  created_at: string;
  updated_at: string;
  
  // NEW: Draft team selection
  draft_team: string[] | null;
}
```

#### Modified: `GameUpdate` Interface

```typescript
export interface GameUpdate {
  phase?: GamePhase;
  current_quest?: number;
  current_leader_id?: string;
  vote_track?: number;
  quest_results?: QuestResult[];
  winner?: 'good' | 'evil' | null;
  win_reason?: string | null;
  assassin_guess_id?: string | null;
  lady_holder_id?: string | null;
  
  // NEW: Draft team selection update
  draft_team?: string[] | null;
}
```

#### Modified: `GameState` Interface

```typescript
export interface GameState {
  game: Game;
  players: GamePlayer[];
  current_proposal: TeamProposal | null;
  current_player_id: string | null;
  player_role: 'good' | 'evil' | null;
  special_role: string | null;
  am_leader: boolean;
  am_team_member: boolean;
  can_submit_action: boolean;
  has_submitted_action: boolean;
  actions_submitted: number;
  total_team_members: number;
  quest_requirement: QuestRequirement;
  voted_player_ids: string[];
  my_vote: 'approve' | 'reject' | null;
  lady_of_lake_state: LadyOfLakeState | null;
  last_vote_result: VoteResult | null;
  last_lady_investigation: LadyInvestigationResult | null;
  roomCode: string | null;
  
  // NEW: Draft selection state
  draft_team: string[] | null;
  is_draft_in_progress: boolean;  // Derived: draft_team !== null
}
```

#### New: Validation Types

```typescript
/**
 * Result of validating a draft team selection
 */
export interface DraftValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * API Request: Update draft team
 */
export interface UpdateDraftTeamRequest {
  team_member_ids: string[];  // Array of player database IDs (0 to quest_size)
}

/**
 * API Response: Update draft team
 */
export interface UpdateDraftTeamResponse {
  draft_team: string[];
  quest_number: number;
  required_size: number;
  updated_at: string;
}
```

---

## Entity Relationships

### Existing Entities

```text
┌──────────┐
│  games   │
│          │
│ id       │◄─────┐
│ phase    │      │
│ ...      │      │
│ draft_team│ NEW  │
└──────────┘      │
                  │
      ┌───────────┴──────────┐
      │                      │
┌─────▼──────┐      ┌────────▼─────┐
│  players   │      │team_proposals│
│            │      │              │
│ id         │      │ id           │
│ nickname   │      │ team_member_ │
│            │      │   ids        │
└────────────┘      └──────────────┘
```

### `draft_team` Relationship

- **Type**: One-to-many (game → players)
- **Implementation**: Array of player IDs stored as `text[]`
- **Validation**: All IDs in `draft_team` must exist in `games.seating_order`
- **No Foreign Key**: Validation is application-level, not database constraint (allows flexible querying)

---

## State Diagram

```text
┌─────────────────┐
│  team_building  │
│  draft_team =   │
│     NULL        │
└────────┬────────┘
         │
         │ Leader clicks player
         ▼
┌─────────────────┐
│  team_building  │
│  draft_team =   │
│   [player1]     │
└────────┬────────┘
         │
         │ Leader clicks another
         ▼
┌─────────────────┐
│  team_building  │
│  draft_team =   │
│ [player1,       │
│  player2]       │
└────────┬────────┘
         │
         │ Leader clicks same player (deselect)
         ▼
┌─────────────────┐
│  team_building  │
│  draft_team =   │
│   [player2]     │
└────────┬────────┘
         │
         │ Leader submits proposal
         ▼
┌─────────────────┐
│     voting      │
│  draft_team =   │
│     NULL        │◄──┐
└────────┬────────┘   │
         │            │
         │ Voting     │ Rejected
         │ complete   │
         ▼            │
    [approved?] ──────┘
         │ Yes
         ▼
┌─────────────────┐
│      quest      │
│  draft_team =   │
│     NULL        │
└─────────────────┘
```

---

## Query Patterns

### Read: Get Game with Draft Team

**Context**: Fetching game state for all players (existing GET /api/games/{gameId})

```typescript
// src/lib/supabase/games.ts
const { data: game, error } = await supabase
  .from('games')
  .select('*')  // Includes draft_team
  .eq('id', gameId)
  .single();
```

**Result**:
```json
{
  "id": "game-uuid",
  "phase": "team_building",
  "draft_team": ["player1-id", "player2-id"],
  // ... other fields
}
```

### Write: Update Draft Team

**Context**: Leader selects/deselects players (new PUT /api/games/{gameId}/draft-team)

```typescript
// src/lib/supabase/games.ts
const { data, error } = await supabase
  .from('games')
  .update({ draft_team: playerIds })
  .eq('id', gameId)
  .select()
  .single();
```

### Write: Clear Draft Team

**Context**: Proposal submitted or quest advances

```typescript
// src/lib/supabase/games.ts
const { data, error } = await supabase
  .from('games')
  .update({ draft_team: null })
  .eq('id', gameId)
  .select()
  .single();
```

---

## Indexes

### Current Indexes on `games`

```sql
-- Primary key (already exists)
PRIMARY KEY (id)

-- Foreign key index (already exists)
CREATE INDEX idx_games_room_id ON games(room_id);
```

### New Indexes (Not Required for V1)

**Not creating** a GIN index on `draft_team` because:
- `draft_team` is always fetched as part of the full game state (SELECT * WHERE id = ...)
- We don't query "find all games with active drafts"
- Avoiding index overhead for a frequently updated field

**If future analytics require finding games with active drafts:**
```sql
CREATE INDEX idx_games_draft_team 
ON games USING GIN (draft_team) 
WHERE draft_team IS NOT NULL;
```

---

## Backward Compatibility

### Handling Missing Column

**Scenario**: Code deployed before migration 011 is applied.

**Frontend Handling** (`src/hooks/useGameState.ts`):
```typescript
const draftTeam = game.draft_team ?? null;  // Treat undefined as null
const isDraftInProgress = draftTeam !== null && draftTeam.length > 0;
```

**API Handling** (`src/app/api/games/[gameId]/draft-team/route.ts`):
```typescript
// If draft_team column doesn't exist yet, UPDATE will fail gracefully
try {
  await updateDraftTeam(supabase, gameId, playerIds);
} catch (error) {
  // Log error, return 500, but don't crash
  console.error('Failed to update draft_team:', error);
  return NextResponse.json(
    { error: { code: 'SERVER_ERROR', message: 'Unable to update selection' } },
    { status: 500 }
  );
}
```

### Rollback Plan

If migration 011 needs to be rolled back:

```sql
-- Rollback migration
ALTER TABLE games DROP COLUMN IF EXISTS draft_team;
```

**Impact**:
- Existing games lose draft selection state (acceptable, transient data)
- Frontend gracefully handles `draft_team === undefined` (treats as null)
- No data loss for critical game state (proposals, votes, quest results)

---

## Testing Scenarios

### Scenario 1: Normal Selection Flow

```text
1. Game in team_building, quest requires 3 players
2. Leader selects player1 → draft_team = [player1]
3. Leader selects player2 → draft_team = [player1, player2]
4. Leader selects player3 → draft_team = [player1, player2, player3]
5. Leader submits proposal → draft_team = NULL, phase = 'voting'
```

### Scenario 2: Selection + Deselection

```text
1. Leader selects player1 → draft_team = [player1]
2. Leader selects player2 → draft_team = [player1, player2]
3. Leader deselects player1 → draft_team = [player2]
4. Leader selects player3 → draft_team = [player2, player3]
```

### Scenario 3: Leader Navigation

```text
1. Leader selects player1, player2 → draft_team = [player1, player2]
2. Leader opens "View My Role" modal (navigates away)
3. Leader closes modal (returns to game)
4. draft_team still = [player1, player2] (persisted in DB)
```

### Scenario 4: Proposal Rejected, New Round

```text
1. Leader1 proposes team → draft_team = NULL, phase = 'voting'
2. Voting fails → phase = 'team_building', current_leader rotates to Leader2
3. Leader2 starts new selection → draft_team = [new selections]
4. Leader2's draft is independent of Leader1's previous draft
```

### Scenario 5: Edge Case - Rapid Toggles

```text
1. Leader rapidly clicks player1: select, deselect, select, deselect, select
2. Debounced API calls (200ms) → Only last state sent to server
3. Final draft_team = [player1] or [] depending on final click
4. All players see final state within 3 seconds (next poll)
```

---

## Performance Considerations

### Write Operations

- **Frequency**: ~1-10 updates per team_building phase (depending on leader behavior)
- **Debouncing**: 200ms → Max ~5 writes/second (realistic: 1-2/second)
- **Size**: Small arrays (2-5 elements), minimal storage overhead

### Read Operations

- **No change**: draft_team included in existing SELECT * query
- **Payload increase**: ~50-100 bytes per game state response (negligible)

### Database Load

- **Negligible impact**: games table already handles frequent updates (vote_track, phase transitions, quest_results)
- **No new indexes**: No additional index maintenance overhead

---

## Conclusion

Schema changes are minimal (1 column), backward compatible, and follow existing patterns. All validation is application-level, maintaining flexibility. Ready to proceed to API contract definition (contracts/api.md).

