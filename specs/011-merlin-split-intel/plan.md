# Implementation Plan: Merlin Split Intel Mode

**Branch**: `011-merlin-split-intel` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-merlin-split-intel/spec.md`
**Depends On**: Special Roles (002), Merlin Decoy (009) ✅ Complete

## Summary

Add a new room configuration option "Merlin Split Intel Mode" where Merlin sees two distinct groups of players: a "Certain Evil" group (1-2 players guaranteed evil) and a "Mixed Intel" group (exactly 1 evil + 1 good player, Merlin doesn't know which is which). This creates strategic gameplay where Merlin has some certain information and some uncertain information. The feature is mutually exclusive with Merlin Decoy Mode.

## Technical Context

**Existing Stack** (from previous phases):
- TypeScript 5.x, Node.js 20.x
- Next.js 14+ (App Router), React 18+, Supabase JS Client v2, Tailwind CSS 3.x
- Supabase Postgres with RLS, Browser localStorage for player ID
- Vitest for unit tests, Playwright for E2E
- Existing `role_config` JSONB structure in rooms table
- Existing visibility logic in `lib/domain/visibility.ts`
- Existing Merlin Decoy Mode implementation (009-merlin-decoy)

**New for This Feature**:
- New `merlin_split_intel_enabled` field in `role_config` JSONB
- New columns in `games` table: `split_intel_certain_evil_ids`, `split_intel_mixed_evil_id`, `split_intel_mixed_good_id`
- Extended visibility logic with new `getSplitIntelVisibility()` function
- Two-group display UI for Merlin's role reveal
- Mutual exclusivity logic with Merlin Decoy Mode
- Game start blocking when 0 visible evil players

**Performance Goals**: Same as existing (<2s updates, <5s operations)
**Constraints**: Must integrate correctly with all visibility combinations (Mordred/Oberon hidden)

## Constitution Check

*GATE: Must pass before proceeding. All principles inherited from previous implementations.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Purpose & Vision | ✅ PASS | Incremental delivery; extends existing role config |
| II. Tech Stack | ✅ PASS | Same stack; extends existing JSONB config and visibility system |
| III. Data & Security | ✅ PASS | RLS policies extend existing patterns; group selection server-side |
| IV. Code Quality | ✅ PASS | Pure functions for group selection logic; typed configs |
| V. Testing | ✅ PASS | Unit tests for all visibility combinations with split intel |
| VI. UX Principles | ✅ PASS | Clear toggle UI; distinct group display; game-end reveal |
| VII. Workflow | ✅ PASS | Spec-driven; extends branch pattern |

**Result**: All gates passed. Proceeding with implementation plan.

## High-Level Architecture

This feature extends the existing role configuration and visibility system:

```
┌─────────────────────────────────────────────────────────────────────┐
│                  EXISTING AVALON ARCHITECTURE                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Next.js App (App Router)                   │  │
│  │                                                                │  │
│  │  MERLIN SPLIT INTEL CHANGES:                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ • RoleConfigPanel → Add "Split Intel Mode" toggle       │  │  │
│  │  │ • RoleConfigPanel → Mutual exclusivity with Decoy      │  │  │
│  │  │ • RolesInPlay → Show split intel mode indicator        │  │  │
│  │  │ • RoleRevealModal → Two-group display for Merlin       │  │  │
│  │  │ • GameOver → Show mixed group player with indicator    │  │  │
│  │  │ • /api/rooms/[code]/distribute → Select groups         │  │  │
│  │  │ • /api/rooms/[code]/role → Return group data           │  │  │
│  │  │ • lib/domain/split-intel.ts → Group selection logic    │  │  │
│  │  │ • lib/domain/visibility.ts → getSplitIntelVisibility   │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ MERLIN SPLIT INTEL SCHEMA CHANGES:                          │   │
│  │ • rooms.role_config: +merlin_split_intel_enabled (JSONB)   │   │
│  │ • games: +split_intel_certain_evil_ids (UUID[])            │   │
│  │ • games: +split_intel_mixed_evil_id (UUID)                 │   │
│  │ • games: +split_intel_mixed_good_id (UUID)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure (Changes Only)

### New/Modified Files

```text
src/
├── components/
│   ├── RoleConfigPanel.tsx       # MODIFY: Add Split Intel toggle + mutual exclusivity
│   ├── RolesInPlay.tsx           # MODIFY: Show split intel mode indicator
│   ├── RoleRevealModal.tsx       # MODIFY: Two-group display for Merlin
│   └── game/
│       └── GameOver.tsx          # MODIFY: Show mixed group player at game end
├── lib/
│   ├── domain/
│   │   ├── visibility.ts         # MODIFY: Add getSplitIntelVisibility()
│   │   ├── role-config.ts        # MODIFY: Validate split intel config + mutual exclusivity
│   │   └── split-intel.ts        # NEW: Group selection and distribution logic
│   └── supabase/
│       ├── games.ts              # MODIFY: Include split intel fields
│       └── roles.ts              # MODIFY: Select and persist groups
├── types/
│   ├── role-config.ts            # MODIFY: Add merlin_split_intel_enabled
│   └── game.ts                   # MODIFY: Add split intel fields
└── app/
    └── api/
        └── rooms/
            └── [code]/
                ├── distribute/
                │   └── route.ts  # MODIFY: Select groups, block if 0 visible evil
                └── role/
                    └── route.ts  # MODIFY: Return group data for Merlin

supabase/migrations/
└── 014_merlin_split_intel.sql    # NEW: Add split intel columns to games

tests/
└── unit/
    └── domain/
        ├── visibility.test.ts       # MODIFY: Add split intel visibility tests
        └── split-intel.test.ts      # NEW: Group selection tests
```

## Database Schema Changes

See [data-model.md](./data-model.md) for complete schema details.

### Migration: 014_merlin_split_intel.sql

**games table changes:**
```sql
-- Store the Certain Evil Group (1-2 players guaranteed evil)
ALTER TABLE games ADD COLUMN split_intel_certain_evil_ids UUID[];

-- Store the Mixed Intel Group evil player
ALTER TABLE games ADD COLUMN split_intel_mixed_evil_id UUID REFERENCES players(id);

-- Store the Mixed Intel Group good player
ALTER TABLE games ADD COLUMN split_intel_mixed_good_id UUID REFERENCES players(id);

-- Comments for documentation
COMMENT ON COLUMN games.split_intel_certain_evil_ids IS
  'Array of player IDs in the Certain Evil group. NULL if split intel disabled.';
COMMENT ON COLUMN games.split_intel_mixed_evil_id IS
  'Player ID of evil player in Mixed Intel group. NULL if split intel disabled.';
COMMENT ON COLUMN games.split_intel_mixed_good_id IS
  'Player ID of good player in Mixed Intel group. NULL if split intel disabled.';
```

**role_config JSONB extension:**
```typescript
interface RoleConfig {
  // ... existing fields ...
  merlin_split_intel_enabled?: boolean;  // NEW: Enable split intel mode
}
```

## API Contract Changes

See [contracts/api.md](./contracts/api.md) for complete API documentation.

### Updated: POST `/api/rooms`

**Request Body** (extended role_config):
```typescript
{
  expected_players: number;
  role_config?: {
    // ... existing fields ...
    merlin_split_intel_enabled?: boolean;  // NEW
  }
}
```

**Validation**: Returns 400 if both `merlin_decoy_enabled` and `merlin_split_intel_enabled` are true.

### Updated: POST `/api/rooms/[code]/distribute`

**New Behavior**:
1. Check if `role_config.merlin_split_intel_enabled` is true
2. Count visible evil players (exclude Mordred and Oberon Chaos)
3. If visible evil count is 0: Return 400 error with message to disable Split Intel or change roles
4. If enabled and viable:
   a. Distribute evil players: some to Certain, 1 to Mixed
   b. Select 1 good player (excluding Merlin) for Mixed group
   c. Store all IDs in games table
5. Return success (group selections are not revealed in response)

### Updated: GET `/api/rooms/[code]/role`

**Response for Merlin with Split Intel** (extended):
```typescript
{
  data: {
    // ... existing fields ...
    split_intel?: {
      enabled: true;
      certain_evil: Array<{ id: string; name: string }>;  // 🎯 Guaranteed evil
      mixed_intel: Array<{ id: string; name: string }>;   // ❓ 1 evil + 1 good
      hidden_count: number;  // Mordred/Oberon Chaos count
    }
  }
}
```

### Updated: GET `/api/games/[gameId]` (Game Over)

**Response** (extended):
```typescript
{
  data: {
    // ... existing fields ...
    split_intel_certain_evil_ids: string[] | null;
    split_intel_mixed_evil_id: string | null;
    split_intel_mixed_good_id: string | null;  // Revealed at game end
    players: [
      {
        // ... existing fields ...
        was_mixed_group?: boolean;  // True if this player was in mixed group
      }
    ]
  }
}
```

## Group Distribution Algorithm

### Core Logic in `lib/domain/split-intel.ts`

```typescript
interface SplitIntelGroups {
  certainEvilIds: string[];      // 1-2 evil players
  mixedEvilId: string;           // 1 evil player
  mixedGoodId: string;           // 1 good player (not Merlin)
}

function distributeSplitIntelGroups(
  assignments: RoleAssignment[],
  roleConfig: RoleConfig
): SplitIntelGroups | null {
  // 1. Get visible evil players (exclude Mordred, Oberon Chaos)
  const visibleEvil = assignments.filter(a =>
    a.role === 'evil' &&
    a.specialRole !== 'mordred' &&
    a.specialRole !== 'oberon_chaos'
  );

  // 2. Check minimum requirement
  if (visibleEvil.length === 0) {
    return null;  // Cannot form groups - block game start
  }

  // 3. Shuffle for random distribution
  const shuffledEvil = shuffleArray([...visibleEvil]);

  // 4. Assign to groups based on count
  let certainEvilIds: string[];
  let mixedEvilId: string;

  if (shuffledEvil.length === 1) {
    // Only 1 visible evil: goes to Mixed (no Certain group)
    certainEvilIds = [];
    mixedEvilId = shuffledEvil[0].playerId;
  } else if (shuffledEvil.length === 2) {
    // 2 visible evil: 1 Certain, 1 Mixed
    certainEvilIds = [shuffledEvil[0].playerId];
    mixedEvilId = shuffledEvil[1].playerId;
  } else {
    // 3+ visible evil: 2 Certain, 1 Mixed
    certainEvilIds = [shuffledEvil[0].playerId, shuffledEvil[1].playerId];
    mixedEvilId = shuffledEvil[2].playerId;
  }

  // 5. Select good player for Mixed group (not Merlin)
  const eligibleGood = assignments.filter(a =>
    a.role === 'good' && a.specialRole !== 'merlin'
  );
  const shuffledGood = shuffleArray([...eligibleGood]);
  const mixedGoodId = shuffledGood[0].playerId;

  return { certainEvilIds, mixedEvilId, mixedGoodId };
}
```

### Visibility Logic in `lib/domain/visibility.ts`

```typescript
interface SplitIntelVisibilityResult {
  certainEvil: Array<{ id: string; name: string }>;
  mixedIntel: Array<{ id: string; name: string }>;
  hiddenCount: number;
  certainLabel: string;
  mixedLabel: string;
}

function getSplitIntelVisibility(
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig,
  certainEvilIds: string[],
  mixedEvilId: string,
  mixedGoodId: string
): SplitIntelVisibilityResult {
  // Build Certain Evil group
  const certainEvil = certainEvilIds.map(id => {
    const player = allAssignments.find(a => a.playerId === id);
    return { id, name: player?.playerName || 'Unknown' };
  });

  // Build Mixed Intel group (shuffle to hide order)
  const mixedPlayers = [mixedEvilId, mixedGoodId].map(id => {
    const player = allAssignments.find(a => a.playerId === id);
    return { id, name: player?.playerName || 'Unknown' };
  });
  const mixedIntel = shuffleArray(mixedPlayers);

  // Count hidden evil (Mordred + Oberon Chaos)
  const hiddenCount =
    (roleConfig.mordred ? 1 : 0) +
    (roleConfig.oberon === 'chaos' ? 1 : 0);

  return {
    certainEvil,
    mixedIntel,
    hiddenCount,
    certainLabel: '🎯 Certain Evil - These players are definitely evil',
    mixedLabel: '❓ Mixed Intel - One is evil, one is good',
  };
}
```

## Implementation Phases

### Phase 1: Database & Types (Foundation)

**Goal**: Schema ready, types defined

1. Create migration `014_merlin_split_intel.sql`
2. Run migration on Supabase
3. Update `src/types/role-config.ts` with `merlin_split_intel_enabled`
4. Update `src/types/game.ts` with split intel fields
5. Update database types in `src/types/database.ts`

**Checkpoint**: Database accepts new columns, TypeScript compiles

### Phase 2: Domain Logic (Core)

**Goal**: Group selection and visibility implemented

1. Create `src/lib/domain/split-intel.ts`:
   - `distributeSplitIntelGroups()` - group assignment
   - `canUseSplitIntelMode()` - validation (checks visible evil count)
2. Update `src/lib/domain/visibility.ts`:
   - `getSplitIntelVisibility()` - two-group visibility result
3. Update `src/lib/domain/role-config.ts`:
   - Add `merlin_split_intel_enabled` to validation
   - Add mutual exclusivity check with `merlin_decoy_enabled`
4. **Unit tests** for all visibility combinations with split intel

**Checkpoint**: Domain logic validated with tests

### Phase 3: API Updates

**Goal**: Endpoints support split intel mode

1. Update `POST /api/rooms/[code]/distribute`:
   - Check `role_config.merlin_split_intel_enabled`
   - Check visible evil count; block if 0
   - Call `distributeSplitIntelGroups()` if enabled
   - Store group IDs in games table
2. Update `GET /api/rooms/[code]/role`:
   - For Merlin: return `split_intel` object with two groups
3. Update `GET /api/games/[gameId]`:
   - Include split intel fields in response
   - Add `was_mixed_group` flag to player list

**Checkpoint**: APIs return correct data for all configurations

### Phase 4: Configuration UI

**Goal**: Room managers can enable split intel mode

1. Update `src/components/RoleConfigPanel.tsx`:
   - Add "Merlin Split Intel Mode" toggle
   - Add tooltip explaining the feature
   - Implement mutual exclusivity: disable Decoy when Split Intel is on, and vice versa
   - Show warning when enabling with Mordred + Oberon Chaos
2. Update `src/components/RolesInPlay.tsx`:
   - Show "🔀 Split Intel" indicator when enabled
3. Wire up configuration to room creation API

**Checkpoint**: Manager can enable split intel mode in UI; modes are mutually exclusive

### Phase 5: Role Reveal Updates (Two-Group Display)

**Goal**: Merlin sees distinct groups

1. Update `src/components/RoleRevealModal.tsx`:
   - Detect `split_intel` in role data
   - Display **two separate sections** with distinct styling:
     - 🎯 **Certain Evil**: Red/dark styling, "These players are definitely evil"
     - ❓ **Mixed Intel**: Amber/yellow styling, "One is evil, one is good"
   - Show hidden evil count warning if applicable
2. Ensure groups are visually distinct with clear labels

**Checkpoint**: Merlin sees correctly formatted two-group display

### Phase 6: Game Over Updates

**Goal**: Mixed group revealed at game end

1. Update `src/components/game/GameOver.tsx`:
   - Show "🔀 Mixed Group" indicator next to player who was in mixed group
   - Only show when `merlin_split_intel_enabled` was true
2. Style mixed group indicator to be clear but not distracting

**Checkpoint**: All players see mixed group identity at game end

### Phase 7: Testing & Polish

**Goal**: Feature complete and tested

1. Unit tests for group distribution algorithm
2. Unit tests for visibility with all combinations (Mordred, Oberon)
3. Integration test: Enable split intel → Distribute → Verify Merlin sees two groups
4. Integration test: Game start blocked when 0 visible evil
5. Integration test: Mutual exclusivity with Decoy mode
6. Integration test: Game over → Verify mixed group revealed
7. Error handling for edge cases
8. Mobile responsiveness check

**Checkpoint**: Feature complete

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Visibility bugs with Mordred/Oberon combinations | Comprehensive unit tests for all combinations |
| Game start not blocked when 0 visible evil | Explicit check in distribute API with clear error message |
| Decoy and Split Intel both enabled | Mutual exclusivity enforced in UI and API validation |
| Non-uniform group distribution | Use crypto-random shuffle; test distribution |
| Mixed group revealed during game | Server-side only; no client hints |
| Confusion about two groups | Clear visual separation with distinct colors/icons |

## Complexity Tracking

| Decision | Justification |
|----------|---------------|
| Store group assignments as separate columns | Clearer than single JSONB; allows foreign key constraints |
| Mutual exclusivity with Decoy | Simpler than combining; avoids complex visibility logic |
| Block game start when 0 visible evil | Better UX than silent fallback; explicit error guides config change |
| Fixed algorithm (2 certain, 1 mixed) | Balanced gameplay; simpler than configurable |

## Dependencies

- Special Roles (002) must be complete for visibility logic
- Merlin Decoy (009) must be complete for mutual exclusivity reference
- Quest System (003) must be complete for game-over logic
- Lady of the Lake (004) must work correctly with split intel (Lady sees true alignment)

## Success Metrics

- All 4 user stories pass acceptance criteria
- All visibility combinations work correctly with split intel
- Game start blocked when 0 visible evil (Mordred + Oberon Chaos)
- Mutual exclusivity with Decoy mode works in UI and API
- No leakage of mixed group identity during gameplay
- Clear two-group display for Merlin
- Clear game-end reveal
