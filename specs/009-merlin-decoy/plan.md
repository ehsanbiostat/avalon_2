# Implementation Plan: Merlin Decoy Configuration

**Branch**: `009-merlin-decoy` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-merlin-decoy/spec.md`
**Depends On**: Special Roles (002), Quest System (003), Lady of the Lake (004) ✅ Complete

## Summary

Add a new room configuration option "Merlin Decoy Mode" where Merlin sees one additional player (a randomly selected good player) mixed in with the evil players. This creates strategic uncertainty for Merlin, who can no longer be 100% certain about evil identities. The feature integrates with existing visibility rules (Mordred, Oberon modes) and reveals the decoy identity at game end.

## Technical Context

**Existing Stack** (from previous phases):
- TypeScript 5.x, Node.js 20.x
- Next.js 14+ (App Router), React 18+, Supabase JS Client v2, Tailwind CSS 3.x
- Supabase Postgres with RLS, Browser localStorage for player ID
- Vitest for unit tests, Playwright for E2E
- Existing `role_config` JSONB structure in rooms table
- Existing visibility logic in `lib/domain/visibility.ts`

**New for This Feature**:
- New `merlin_decoy_enabled` field in `role_config` JSONB
- New `merlin_decoy_player_id` column in `games` table
- Extended visibility logic to handle decoy injection
- Updated warning message system for Merlin
- Game over reveal showing decoy status

**Performance Goals**: Same as existing (<2s updates, <5s operations)
**Constraints**: Must integrate correctly with all 6 visibility combinations (Mordred/Oberon)

## Constitution Check

*GATE: Must pass before proceeding. All principles inherited from previous implementations.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Purpose & Vision | ✅ PASS | Incremental delivery; extends existing role config |
| II. Tech Stack | ✅ PASS | Same stack; extends existing JSONB config |
| III. Data & Security | ✅ PASS | RLS policies extend existing patterns; decoy selection server-side |
| IV. Code Quality | ✅ PASS | Pure functions for decoy logic; typed configs |
| V. Testing | ✅ PASS | Unit tests for all 6 visibility combinations |
| VI. UX Principles | ✅ PASS | Clear toggle UI; transparent game config; game-end reveal |
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
│  │  MERLIN DECOY CHANGES:                                        │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ • RoleConfigPanel → Add "Merlin Decoy Mode" toggle      │  │  │
│  │  │ • RolesInPlay → Show decoy mode indicator               │  │  │
│  │  │ • RoleRevealModal → Enhanced warning for Merlin         │  │  │
│  │  │ • GameOver → Show decoy player with indicator           │  │  │
│  │  │ • /api/rooms/[code]/distribute → Select decoy           │  │  │
│  │  │ • /api/rooms/[code]/role → Include decoy in Merlin list │  │  │
│  │  │ • lib/domain/visibility.ts → Inject decoy logic         │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ MERLIN DECOY SCHEMA CHANGES:                                 │   │
│  │ • rooms.role_config: +merlin_decoy_enabled (in JSONB)       │   │
│  │ • games: +merlin_decoy_player_id (UUID, nullable)           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure (Changes Only)

### New/Modified Files

```text
src/
├── components/
│   ├── RoleConfigPanel.tsx       # MODIFY: Add Merlin Decoy toggle
│   ├── RolesInPlay.tsx           # MODIFY: Show decoy mode indicator
│   ├── RoleRevealModal.tsx       # MODIFY: Enhanced warning message
│   └── game/
│       └── GameOver.tsx          # MODIFY: Show decoy player at game end
├── lib/
│   ├── domain/
│   │   ├── visibility.ts         # MODIFY: Add decoy injection logic
│   │   ├── role-config.ts        # MODIFY: Validate decoy config
│   │   └── decoy-selection.ts    # NEW: Decoy selection logic
│   └── supabase/
│       ├── games.ts              # MODIFY: Include decoy_player_id
│       └── roles.ts              # MODIFY: Select and persist decoy
├── types/
│   ├── role-config.ts            # MODIFY: Add merlin_decoy_enabled
│   └── game.ts                   # MODIFY: Add merlin_decoy_player_id
└── app/
    └── api/
        └── rooms/
            └── [code]/
                ├── distribute/
                │   └── route.ts  # MODIFY: Select decoy during distribution
                └── role/
                    └── route.ts  # MODIFY: Include decoy in Merlin's list

supabase/migrations/
└── 012_merlin_decoy.sql          # NEW: Add decoy column to games

tests/
└── unit/
    └── domain/
        ├── visibility.test.ts    # MODIFY: Add decoy combination tests
        └── decoy-selection.test.ts # NEW: Decoy selection tests
```

## Database Schema Changes

See [data-model.md](./data-model.md) for complete schema details.

### Migration: 012_merlin_decoy.sql

**games table changes:**
```sql
-- Store the randomly selected decoy player
-- NULL when decoy mode is disabled
ALTER TABLE games ADD COLUMN merlin_decoy_player_id UUID REFERENCES players(id);

-- Add comment for documentation
COMMENT ON COLUMN games.merlin_decoy_player_id IS
  'Player ID of the good player selected as decoy for Merlin. NULL if decoy mode disabled.';
```

**role_config JSONB extension:**
```typescript
// No schema change needed - just add to existing JSONB
interface RoleConfig {
  // ... existing fields ...
  merlin_decoy_enabled?: boolean;  // NEW: Enable decoy mode
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
    merlin_decoy_enabled?: boolean;  // NEW
  }
}
```

### Updated: POST `/api/rooms/[code]/distribute`

**New Behavior**:
1. Check if `role_config.merlin_decoy_enabled` is true
2. If enabled, randomly select one good player (excluding Merlin) as decoy
3. Store `merlin_decoy_player_id` in the games table
4. Return success (decoy selection is not revealed in response)

### Updated: GET `/api/rooms/[code]/role`

**Response for Merlin** (extended):
```typescript
{
  data: {
    // ... existing fields ...
    known_players: string[];        // NOW includes decoy if enabled
    known_players_label: string;    // "Evil Players" (unchanged)
    hidden_count: number;           // Hidden evil count (Mordred/Oberon Chaos)
    has_decoy: boolean;             // NEW: True if decoy mode enabled
    decoy_warning: string;          // NEW: Warning message about decoy
  }
}
```

**Warning Messages**:
- 0 hidden: "⚠️ One of these players is actually good!"
- 1 hidden: "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you."
- 2 hidden: "⚠️ One of these players is actually good! Also, 2 evil players are hidden from you."

### Updated: GET `/api/games/[gameId]` (Game Over)

**Response** (extended):
```typescript
{
  data: {
    // ... existing fields ...
    merlin_decoy_player_id: string | null;  // NEW: Revealed at game end
    players: [
      {
        // ... existing fields ...
        was_decoy: boolean;  // NEW: True if this player was the decoy
      }
    ]
  }
}
```

## Visibility Formula

The core logic for Merlin's visibility with decoy:

```
Merlin's List = (All Evil) - (Mordred) - (Oberon Chaos) + (Decoy if enabled)
```

### Implementation in `lib/domain/visibility.ts`

```typescript
function getMerlinVisibility(
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig,
  decoyPlayerId: string | null
): VisibilityResult {
  // 1. Get base evil list (existing logic)
  let visiblePlayers = getEvilPlayersVisibleToMerlin(allAssignments, roleConfig);

  // 2. Add decoy if enabled
  if (roleConfig.merlin_decoy_enabled && decoyPlayerId) {
    visiblePlayers.push(decoyPlayerId);
    // Shuffle to prevent position-based detection
    visiblePlayers = shuffleArray(visiblePlayers);
  }

  // 3. Calculate hidden count
  const hiddenCount = countHiddenEvil(allAssignments, roleConfig);

  // 4. Generate warning message
  const warning = generateDecoyWarning(hiddenCount);

  return { visiblePlayers, hiddenCount, warning, hasDecoy: true };
}
```

### Decoy Selection in `lib/domain/decoy-selection.ts`

```typescript
function selectDecoyPlayer(
  assignments: RoleAssignment[]
): string {
  // 1. Filter to good players only
  const goodPlayers = assignments.filter(a => a.role === 'good');

  // 2. Exclude Merlin (can't be their own decoy)
  const eligiblePlayers = goodPlayers.filter(
    a => a.special_role !== 'merlin'
  );

  // 3. Random selection with uniform distribution
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
  return eligiblePlayers[randomIndex].player_id;
}
```

## Implementation Phases

### Phase 1: Database & Types (Foundation)

**Goal**: Schema ready, types defined

1. Create migration `012_merlin_decoy.sql`
2. Run migration on Supabase
3. Update `src/types/role-config.ts` with `merlin_decoy_enabled`
4. Update `src/types/game.ts` with `merlin_decoy_player_id`
5. Update database types in `src/types/database.ts`

**Checkpoint**: Database accepts new column, TypeScript compiles

### Phase 2: Domain Logic (Core)

**Goal**: Decoy selection and visibility injection implemented

1. Create `src/lib/domain/decoy-selection.ts`:
   - `selectDecoyPlayer(assignments)` - random selection
   - `isEligibleForDecoy(assignment)` - validation
2. Update `src/lib/domain/visibility.ts`:
   - `getMerlinVisibilityWithDecoy()` - inject decoy into list
   - `generateDecoyWarning(hiddenCount)` - warning messages
3. Update `src/lib/domain/role-config.ts`:
   - Add `merlin_decoy_enabled` to validation
4. **Unit tests** for all 6 visibility combinations with decoy

**Checkpoint**: Domain logic validated with tests for all combinations

### Phase 3: API Updates

**Goal**: Endpoints support decoy mode

1. Update `POST /api/rooms/[code]/distribute`:
   - Check `role_config.merlin_decoy_enabled`
   - Call `selectDecoyPlayer()` if enabled
   - Store `merlin_decoy_player_id` in games table
2. Update `GET /api/rooms/[code]/role`:
   - For Merlin: include decoy in `known_players`
   - Add `has_decoy` and `decoy_warning` to response
3. Update `GET /api/games/[gameId]`:
   - Include `merlin_decoy_player_id` in response
   - Add `was_decoy` flag to player list

**Checkpoint**: APIs return correct data for all configurations

### Phase 4: Configuration UI

**Goal**: Room managers can enable decoy mode

1. Update `src/components/RoleConfigPanel.tsx`:
   - Add "Merlin Decoy Mode" toggle
   - Add tooltip explaining the feature
2. Update `src/components/RolesInPlay.tsx`:
   - Show "🎭 Merlin Decoy" indicator when enabled
3. Wire up configuration to room creation API

**Checkpoint**: Manager can enable decoy mode in UI

### Phase 5: Role Reveal Updates

**Goal**: Merlin sees enhanced warning

1. Update `src/components/RoleRevealModal.tsx`:
   - Show decoy warning when `has_decoy` is true
   - Combine with hidden evil warning appropriately
2. Ensure decoy is visually indistinguishable in player list

**Checkpoint**: Merlin sees correct warning messages

### Phase 6: Game Over Updates

**Goal**: Decoy revealed at game end

1. Update `src/components/game/GameOver.tsx`:
   - Show "🎭 Decoy" indicator next to decoy player
   - Only show when `merlin_decoy_enabled` was true
2. Style decoy indicator to be clear but not distracting

**Checkpoint**: All players see decoy identity at game end

### Phase 7: Testing & Polish

**Goal**: Feature complete and tested

1. Unit tests for decoy selection (uniform distribution)
2. Unit tests for all 6 visibility combinations
3. Integration test: Enable decoy → Distribute → Verify Merlin sees extra player
4. Integration test: Game over → Verify decoy revealed
5. Error handling for edge cases
6. Mobile responsiveness check

**Checkpoint**: Feature complete

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Visibility bugs with Mordred/Oberon combinations | Comprehensive unit tests for all 6 combinations |
| Non-uniform decoy selection | Use crypto-random; test distribution |
| Decoy revealed during game | Server-side only; no client hints |
| Performance impact | Decoy is single additional player; negligible |
| Confusion about feature | Clear tooltip; warning messages |

## Complexity Tracking

| Decision | Justification |
|----------|---------------|
| Store decoy in games table | Persists for game duration; revealed at end |
| Inject decoy into existing visibility | Reuses existing infrastructure; simpler than parallel system |
| Shuffle Merlin's list | Prevents position-based detection of decoy |

## Dependencies

- Special Roles (002) must be complete for visibility logic
- Quest System (003) must be complete for game-over logic
- Lady of the Lake (004) must work correctly with decoy (Lady sees true alignment)

## Success Metrics

- All 4 user stories pass acceptance criteria
- All 6 visibility combinations work correctly with decoy
- Decoy selection is uniform random
- No leakage of decoy identity during gameplay
- Clear game-end reveal
