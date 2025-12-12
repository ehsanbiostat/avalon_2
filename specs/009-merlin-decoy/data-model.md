# Data Model: Merlin Decoy Configuration

**Feature**: 009-merlin-decoy
**Date**: 2025-12-12

## Schema Changes

### Migration: 012_merlin_decoy.sql

```sql
-- ============================================
-- Migration: 012_merlin_decoy.sql
-- Feature: 009-merlin-decoy
-- Description: Add decoy player tracking to games table
-- ============================================

-- Add column to store the selected decoy player
-- NULL when decoy mode is disabled or game not yet started
ALTER TABLE games
ADD COLUMN merlin_decoy_player_id UUID REFERENCES players(id);

-- Documentation
COMMENT ON COLUMN games.merlin_decoy_player_id IS
  'Player ID of the good player randomly selected as decoy for Merlin.
   NULL if merlin_decoy_enabled is false in role_config or game not started.
   Revealed to all players at game end.';

-- Index for faster lookups (optional, low cardinality)
CREATE INDEX IF NOT EXISTS idx_games_merlin_decoy
ON games(merlin_decoy_player_id)
WHERE merlin_decoy_player_id IS NOT NULL;
```

## Entity Changes

### Room (Existing - role_config Extension)

The `role_config` JSONB column in the `rooms` table is extended with a new field:

```typescript
interface RoleConfig {
  // Existing fields
  percival?: boolean;
  morgana?: boolean;
  mordred?: boolean;
  oberon?: 'standard' | 'chaos' | false;
  ladyOfLake?: boolean;

  // NEW: Merlin Decoy Mode
  merlin_decoy_enabled?: boolean;  // Default: false
}
```

**Validation Rules**:
- `merlin_decoy_enabled` can be true for any player count (5-10)
- No dependency on other role selections
- Can combine with any other optional roles

### Game (Extended)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| merlin_decoy_player_id | UUID | YES | Player ID of selected decoy. NULL if disabled. |

**Relationships**:
- `merlin_decoy_player_id` → `players(id)` (foreign key)

**Constraints**:
- Must reference a player who is in the same game
- Must be a good player (not enforced in DB, validated in code)
- Must not be Merlin (not enforced in DB, validated in code)

## TypeScript Types

### Updated: RoleConfig

```typescript
// src/types/role-config.ts

export interface RoleConfig {
  // Existing fields
  percival?: boolean;
  morgana?: boolean;
  mordred?: boolean;
  oberon?: 'standard' | 'chaos' | false;
  ladyOfLake?: boolean;

  // NEW
  merlin_decoy_enabled?: boolean;
}

export const DEFAULT_ROLE_CONFIG: RoleConfig = {
  percival: false,
  morgana: false,
  mordred: false,
  oberon: false,
  ladyOfLake: false,
  merlin_decoy_enabled: false,  // NEW
};
```

### Updated: Game

```typescript
// src/types/game.ts

export interface Game {
  id: string;
  room_id: string;
  phase: GamePhase;
  current_quest: number;
  current_leader_index: number;
  vote_track: number;
  quest_results: QuestResult[];
  seating_order: string[];
  winner: GameWinner | null;
  win_reason: string | null;
  lady_holder_id: string | null;
  lady_enabled: boolean;
  draft_team: string[] | null;
  created_at: string;

  // NEW
  merlin_decoy_player_id: string | null;
}
```

### Updated: GameState (Client)

```typescript
// src/types/game.ts

export interface GameState {
  // ... existing fields ...

  // NEW: For game-over reveal
  merlin_decoy_player_id: string | null;
}
```

### New: DecoyInfo

```typescript
// src/types/game.ts

export interface DecoyInfo {
  enabled: boolean;
  player_id: string | null;  // Only populated at game end
}
```

### Updated: GamePlayer (for game-over)

```typescript
// src/types/game.ts

export interface GamePlayer {
  id: string;
  nickname: string;
  seat_position: number;
  is_leader: boolean;
  is_connected: boolean;
  revealed_role?: 'good' | 'evil';
  revealed_special_role?: string;

  // NEW: For game-over display
  was_decoy?: boolean;
}
```

## Data Flow

### During Role Distribution

```
1. Room manager clicks "Distribute Roles"
2. API checks role_config.merlin_decoy_enabled
3. If enabled:
   a. Get all role assignments
   b. Filter to good players (role === 'good')
   c. Exclude Merlin (special_role !== 'merlin')
   d. Randomly select one as decoy
   e. Store player_id in games.merlin_decoy_player_id
4. Return success (decoy not revealed)
```

### During Merlin's Role Reveal

```
1. Merlin requests their role info
2. API calls getMerlinVisibility()
3. If merlin_decoy_enabled:
   a. Add decoy_player_id to visible players list
   b. Shuffle the list
   c. Generate warning message
4. Return enhanced role data
```

### During Game Over

```
1. Game ends (any win condition)
2. Client requests game state
3. API includes merlin_decoy_player_id in response
4. Client marks that player with "was_decoy: true"
5. UI shows decoy indicator on that player
```

## Validation Rules

### Decoy Selection Validation

```typescript
function validateDecoySelection(
  decoyPlayerId: string,
  assignments: RoleAssignment[]
): boolean {
  const assignment = assignments.find(a => a.player_id === decoyPlayerId);

  if (!assignment) return false;  // Player not in game
  if (assignment.role !== 'good') return false;  // Must be good
  if (assignment.special_role === 'merlin') return false;  // Can't be Merlin

  return true;
}
```

### Minimum Candidates Check

```typescript
function getEligibleDecoyCount(playerCount: number): number {
  // Good count for each player count
  const goodCounts: Record<number, number> = {
    5: 3,   // 3 good, 2 eligible (excluding Merlin)
    6: 4,   // 4 good, 3 eligible
    7: 4,   // 4 good, 3 eligible
    8: 5,   // 5 good, 4 eligible
    9: 6,   // 6 good, 5 eligible
    10: 6,  // 6 good, 5 eligible
  };

  return goodCounts[playerCount] - 1;  // -1 for Merlin
}
```

**Result**: Always at least 2 eligible candidates. Feature always works.

## Backward Compatibility

- Existing games without `merlin_decoy_player_id` will have NULL
- Existing role configs without `merlin_decoy_enabled` default to false
- No migration of existing data required
- Feature is opt-in only
