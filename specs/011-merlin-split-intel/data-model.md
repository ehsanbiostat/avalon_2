# Data Model: Merlin Split Intel Mode

**Feature**: 011-merlin-split-intel
**Date**: 2025-12-22

## Schema Changes

### Migration: 014_merlin_split_intel.sql

```sql
-- ============================================
-- Migration: 014_merlin_split_intel.sql
-- Feature: 011-merlin-split-intel
-- Description: Add split intel group tracking to games table
-- ============================================

-- Add column to store the Certain Evil Group (array of 0-2 player IDs)
-- NULL when split intel mode is disabled or game not yet started
ALTER TABLE games
ADD COLUMN IF NOT EXISTS split_intel_certain_evil_ids UUID[];

-- Add column to store the evil player in Mixed Intel Group
-- NULL when split intel mode is disabled or game not yet started
ALTER TABLE games
ADD COLUMN IF NOT EXISTS split_intel_mixed_evil_id UUID REFERENCES players(id);

-- Add column to store the good player in Mixed Intel Group
-- NULL when split intel mode is disabled or game not yet started
ALTER TABLE games
ADD COLUMN IF NOT EXISTS split_intel_mixed_good_id UUID REFERENCES players(id);

-- Documentation: Lifecycle of split intel columns
-- 1. Set to NULL when game is created (regardless of role_config.merlin_split_intel_enabled)
-- 2. During role distribution, IF merlin_split_intel_enabled is true AND visible evil > 0:
--    a. split_intel_certain_evil_ids = array of 0-2 evil player IDs (guaranteed evil)
--    b. split_intel_mixed_evil_id = 1 evil player ID
--    c. split_intel_mixed_good_id = 1 good player ID (not Merlin)
-- 3. Once set, values persist for entire game duration
-- 4. Revealed to all players when phase = 'game_over'

COMMENT ON COLUMN games.split_intel_certain_evil_ids IS
  'Array of player IDs in the Certain Evil group (guaranteed evil to Merlin).
   NULL if split_intel_enabled is false or game not started.
   Can be empty array if only 1 visible evil player exists.
   Revealed to all players at game end.';

COMMENT ON COLUMN games.split_intel_mixed_evil_id IS
  'Player ID of evil player in Mixed Intel group.
   NULL if split_intel_enabled is false or game not started.
   Merlin knows this is one of the two mixed players but not which one.
   Revealed to all players at game end.';

COMMENT ON COLUMN games.split_intel_mixed_good_id IS
  'Player ID of good player (not Merlin) in Mixed Intel group.
   NULL if split_intel_enabled is false or game not started.
   Merlin knows this is one of the two mixed players but not which one.
   Revealed to all players at game end.';

-- Index for faster lookups on split intel fields
-- Only index non-null values since most games won't have split intel enabled
CREATE INDEX IF NOT EXISTS idx_games_split_intel_mixed_evil
ON games(split_intel_mixed_evil_id)
WHERE split_intel_mixed_evil_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_games_split_intel_mixed_good
ON games(split_intel_mixed_good_id)
WHERE split_intel_mixed_good_id IS NOT NULL;
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
  merlin_decoy_enabled?: boolean;

  // NEW: Merlin Split Intel Mode
  merlin_split_intel_enabled?: boolean;  // Default: false
}
```

**Validation Rules**:
- `merlin_split_intel_enabled` can be true for any player count (5-10)
- **Mutually exclusive** with `merlin_decoy_enabled` - cannot both be true
- If enabled with Mordred + Oberon Chaos (0 visible evil), game start is blocked

### Game (Extended)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| split_intel_certain_evil_ids | UUID[] | YES | Player IDs in Certain Evil group. NULL if disabled. |
| split_intel_mixed_evil_id | UUID | YES | Evil player ID in Mixed Intel group. NULL if disabled. |
| split_intel_mixed_good_id | UUID | YES | Good player ID in Mixed Intel group. NULL if disabled. |

**Relationships**:
- `split_intel_mixed_evil_id` → `players(id)` (foreign key)
- `split_intel_mixed_good_id` → `players(id)` (foreign key)
- `split_intel_certain_evil_ids` → array of player IDs (no FK on array elements)

**Constraints**:
- All referenced players must be in the same game
- `split_intel_certain_evil_ids` must contain only evil players (validated in code)
- `split_intel_mixed_evil_id` must be an evil player (validated in code)
- `split_intel_mixed_good_id` must be a good player, not Merlin (validated in code)

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
  merlin_decoy_enabled?: boolean;

  // NEW
  merlin_split_intel_enabled?: boolean;
}

export const DEFAULT_ROLE_CONFIG: RoleConfig = {
  merlin_decoy_enabled: false,
  merlin_split_intel_enabled: false,  // NEW
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
  merlin_decoy_player_id: string | null;
  created_at: string;

  // NEW: Split Intel fields
  split_intel_certain_evil_ids: string[] | null;
  split_intel_mixed_evil_id: string | null;
  split_intel_mixed_good_id: string | null;
}
```

### New: SplitIntelGroups

```typescript
// src/types/game.ts

export interface SplitIntelGroups {
  certainEvilIds: string[];   // 0-2 guaranteed evil players
  mixedEvilId: string;        // 1 evil player in mixed group
  mixedGoodId: string;        // 1 good player in mixed group
}
```

### New: SplitIntelVisibility

```typescript
// src/types/game.ts

export interface SplitIntelVisibility {
  enabled: true;
  certainEvil: Array<{ id: string; name: string }>;  // Guaranteed evil
  mixedIntel: Array<{ id: string; name: string }>;   // 1 evil + 1 good (shuffled)
  hiddenCount: number;  // Mordred + Oberon Chaos count
  certainLabel: string;  // "🎯 Certain Evil - These players are definitely evil"
  mixedLabel: string;    // "❓ Mixed Intel - One is evil, one is good"
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
  was_decoy?: boolean;  // Existing from Feature 009

  // NEW: For game-over display
  was_mixed_group?: boolean;  // True if in mixed intel group
}
```

## Data Flow

### During Room Configuration

```
1. Room manager enables "Merlin Split Intel Mode"
2. If "Merlin Decoy Mode" is already enabled:
   a. UI automatically disables Decoy (mutual exclusivity)
   b. OR shows error preventing enabling Split Intel
3. Configuration saved to room.role_config JSONB
```

### During Role Distribution

```
1. Room manager clicks "Distribute Roles"
2. API checks role_config.merlin_split_intel_enabled
3. If enabled:
   a. Count visible evil (exclude Mordred, Oberon Chaos)
   b. If visible evil count = 0:
      - Return 400 error: "Cannot use Split Intel Mode with current roles. Disable Split Intel or change role configuration."
   c. If visible evil count >= 1:
      i.   Shuffle visible evil players
      ii.  Assign to Certain group (0-2 based on count)
      iii. Assign 1 to Mixed group
      iv.  Select random good player (not Merlin) for Mixed group
      v.   Store all IDs in games table columns
4. Return success (group selections not revealed in response)
```

### During Merlin's Role Reveal

```
1. Merlin requests their role info
2. API checks for split intel data in games table
3. If split_intel columns are populated:
   a. Build Certain Evil group from split_intel_certain_evil_ids
   b. Build Mixed Intel group from split_intel_mixed_evil_id + split_intel_mixed_good_id
   c. Shuffle Mixed Intel group (hide order)
   d. Calculate hidden count (Mordred + Oberon Chaos)
   e. Return SplitIntelVisibility in response
4. Client renders two-group display
```

### During Game Over

```
1. Game ends (any win condition)
2. Client requests game state
3. API includes split intel fields in response:
   - split_intel_certain_evil_ids
   - split_intel_mixed_evil_id
   - split_intel_mixed_good_id
4. Client marks mixed group player with "was_mixed_group: true"
5. UI shows "🔀 Mixed Group" indicator on that player
```

## Validation Rules

### Mutual Exclusivity Validation

```typescript
function validateRoleConfig(config: RoleConfig): RoleConfigValidation {
  const errors: string[] = [];

  // NEW: Check mutual exclusivity
  if (config.merlin_decoy_enabled && config.merlin_split_intel_enabled) {
    errors.push('Cannot enable both Merlin Decoy Mode and Split Intel Mode. Choose one.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}
```

### Split Intel Viability Check

```typescript
function canUseSplitIntelMode(
  assignments: RoleAssignment[],
  roleConfig: RoleConfig
): { viable: boolean; visibleEvilCount: number; reason?: string } {
  // Count visible evil (exclude Mordred, Oberon Chaos)
  const visibleEvil = assignments.filter(a =>
    a.role === 'evil' &&
    a.specialRole !== 'mordred' &&
    a.specialRole !== 'oberon_chaos'
  );

  if (visibleEvil.length === 0) {
    return {
      viable: false,
      visibleEvilCount: 0,
      reason: 'No visible evil players. Mordred and/or Oberon Chaos hide all evil from Merlin.',
    };
  }

  return { viable: true, visibleEvilCount: visibleEvil.length };
}
```

### Group Assignment Validation

```typescript
function validateSplitIntelGroups(
  groups: SplitIntelGroups,
  assignments: RoleAssignment[]
): boolean {
  // Validate Certain Evil group
  for (const id of groups.certainEvilIds) {
    const assignment = assignments.find(a => a.playerId === id);
    if (!assignment || assignment.role !== 'evil') return false;
    if (assignment.specialRole === 'mordred' || assignment.specialRole === 'oberon_chaos') return false;
  }

  // Validate Mixed Evil player
  const mixedEvil = assignments.find(a => a.playerId === groups.mixedEvilId);
  if (!mixedEvil || mixedEvil.role !== 'evil') return false;
  if (mixedEvil.specialRole === 'mordred' || mixedEvil.specialRole === 'oberon_chaos') return false;

  // Validate Mixed Good player
  const mixedGood = assignments.find(a => a.playerId === groups.mixedGoodId);
  if (!mixedGood || mixedGood.role !== 'good') return false;
  if (mixedGood.specialRole === 'merlin') return false;  // Merlin can't be in mixed group

  return true;
}
```

## Player Count Impact

### Eligible Good Players for Mixed Group

| Players | Good | Eligible (Good - Merlin) |
|---------|------|--------------------------|
| 5 | 3 | 2 |
| 6 | 4 | 3 |
| 7 | 4 | 3 |
| 8 | 5 | 4 |
| 9 | 6 | 5 |
| 10 | 6 | 5 |

**Result**: Always at least 2 eligible candidates. Feature always works for good player selection.

### Visible Evil by Configuration (7-player example)

| Mordred | Oberon Chaos | Visible Evil | Certain | Mixed | Viable |
|---------|--------------|--------------|---------|-------|--------|
| ❌ | ❌ | 3 | 2 | 1 | ✅ |
| ✅ | ❌ | 2 | 1 | 1 | ✅ |
| ❌ | ✅ | 2 | 1 | 1 | ✅ |
| ✅ | ✅ | 1 | 0 | 1 | ✅ |

### Blocked Configuration (5-player example with 2 evil)

| Mordred | Oberon Chaos | Visible Evil | Result |
|---------|--------------|--------------|--------|
| ✅ | ✅ | 0 | ❌ BLOCKED |

## Backward Compatibility

- Existing games without split intel columns will have NULL values
- Existing role configs without `merlin_split_intel_enabled` default to false
- No migration of existing data required
- Feature is opt-in only
- Does not affect existing Merlin Decoy functionality (when that mode is used instead)
