# Implementation Plan: Oberon Split Intel Mode

**Branch**: `018-oberon-split-intel` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-oberon-split-intel/spec.md`
**Depends On**: Merlin Split Intel Mode (011) ✅ Complete, Special Roles (002) ✅ Complete

## Summary

Add a new room configuration option "Oberon Split Intel Mode" - a variant of Merlin Split Intel where Oberon is ALWAYS placed in the Mixed Intel group with one random good player, while all other visible evil players (Morgana, Assassin) go to the Certain Evil group. This mode requires Oberon Standard to be enabled (not available with Oberon Chaos or no Oberon). The feature is mutually exclusive with both Merlin Decoy Mode and standard Merlin Split Intel Mode.

## Technical Context

**Existing Stack** (from previous phases):
- TypeScript 5.7.2, Node.js 20.x
- Next.js 15.1.9 (App Router), React 18.3.1, Supabase JS Client v2, Tailwind CSS 3.x
- Supabase Postgres with RLS, Browser localStorage for player ID
- Vitest for unit tests, Playwright for E2E
- Existing `role_config` JSONB structure in rooms table
- Existing Merlin Split Intel Mode (011) - UI patterns can be reused
- Existing visibility logic in `lib/domain/visibility.ts`

**New for This Feature**:
- New `oberon_split_intel_enabled` field in `role_config` JSONB
- New columns in `games` table: `oberon_split_intel_certain_evil_ids`, `oberon_split_intel_mixed_good_id`
- Extended visibility logic with new `getOberonSplitIntelVisibility()` function
- Prerequisite validation: requires Oberon Standard enabled
- Mutual exclusivity with both Merlin Decoy and standard Merlin Split Intel
- Toggle disabled/enabled state based on Oberon selection

**Performance Goals**: Same as existing (<2s updates, <5s operations)
**Constraints**: Must integrate correctly with all visibility combinations (Mordred hidden); Oberon Chaos incompatible

## Constitution Check

*GATE: Must pass before proceeding. All principles inherited from previous implementations.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Purpose & Vision | ✅ PASS | Incremental delivery; extends existing role config |
| II. Tech Stack | ✅ PASS | Same stack; extends existing JSONB config and visibility system |
| III. Data & Security | ✅ PASS | RLS policies extend existing patterns; group selection server-side |
| IV. Code Quality | ✅ PASS | Pure functions for group selection logic; typed configs |
| V. Testing | ✅ PASS | Unit tests for all visibility combinations with oberon split intel |
| VI. UX Principles | ✅ PASS | Clear toggle UI; prerequisite validation; distinct group display |
| VII. Workflow | ✅ PASS | Spec-driven; extends branch pattern |

**Result**: All gates passed. Proceeding with implementation plan.

## High-Level Architecture

This feature extends the existing role configuration and visibility system, reusing patterns from Merlin Split Intel (011):

```
┌─────────────────────────────────────────────────────────────────────┐
│                  EXISTING AVALON ARCHITECTURE                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Next.js App (App Router)                   │  │
│  │                                                                │  │
│  │  OBERON SPLIT INTEL CHANGES:                                  │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ • RoleConfigPanel → Add "Oberon Split Intel" toggle     │  │  │
│  │  │ • RoleConfigPanel → Prerequisite: Oberon Standard       │  │  │
│  │  │ • RoleConfigPanel → Mutual exclusivity with 3 modes     │  │  │
│  │  │ • RolesInPlay → Show oberon split intel indicator       │  │  │
│  │  │ • RoleRevealModal → Reuse two-group display (011 UI)    │  │  │
│  │  │ • GameOver → Show mixed group player with indicator     │  │  │
│  │  │ • /api/rooms/[code]/distribute → Fixed Oberon in mixed  │  │  │
│  │  │ • /api/rooms/[code]/role → Return group data            │  │  │
│  │  │ • lib/domain/oberon-split-intel.ts → Group logic        │  │  │
│  │  │ • lib/domain/visibility.ts → getOberonSplitIntelVis     │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ OBERON SPLIT INTEL SCHEMA CHANGES:                         │   │
│  │ • rooms.role_config: +oberon_split_intel_enabled (JSONB)   │   │
│  │ • games: +oberon_split_intel_certain_evil_ids (UUID[])     │   │
│  │ • games: +oberon_split_intel_mixed_good_id (UUID)          │   │
│  │ (Oberon's ID not stored - always findable from roles)      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure (Changes Only)

### New/Modified Files

```text
src/
├── components/
│   ├── RoleConfigPanel.tsx       # MODIFY: Add Oberon Split Intel toggle + prerequisites
│   ├── RolesInPlay.tsx           # MODIFY: Show oberon split intel indicator
│   ├── RoleRevealModal.tsx       # MODIFY: Handle oberon_split_intel (reuse split_intel UI)
│   └── game/
│       └── GameOver.tsx          # MODIFY: Show mixed group player at game end
├── lib/
│   ├── domain/
│   │   ├── visibility.ts         # MODIFY: Add getOberonSplitIntelVisibility()
│   │   ├── role-config.ts        # MODIFY: Add oberon_split_intel validation + prerequisites
│   │   └── oberon-split-intel.ts # NEW: Group selection logic (Oberon always in mixed)
│   └── supabase/
│       ├── games.ts              # MODIFY: Include oberon split intel fields
│       └── roles.ts              # MODIFY: Select and persist groups
├── types/
│   ├── role-config.ts            # MODIFY: Add oberon_split_intel_enabled
│   └── game.ts                   # MODIFY: Add oberon split intel fields
└── app/
    └── api/
        └── rooms/
            └── [code]/
                ├── distribute/
                │   └── route.ts  # MODIFY: Handle oberon split intel groups
                └── role/
                    └── route.ts  # MODIFY: Return group data for Merlin

supabase/migrations/
└── 018_oberon_split_intel.sql    # NEW: Add oberon split intel columns to games

tests/
└── unit/
    └── domain/
        └── oberon-split-intel.test.ts  # NEW: Group selection tests
```

## Database Schema Changes

### Migration: 018_oberon_split_intel.sql

**games table changes:**
```sql
-- Store the Certain Evil Group (Morgana, Assassin, etc. - excluding Oberon)
ALTER TABLE games ADD COLUMN oberon_split_intel_certain_evil_ids UUID[];

-- Store the good player in Mixed group with Oberon
ALTER TABLE games ADD COLUMN oberon_split_intel_mixed_good_id UUID REFERENCES players(id);

-- Comments for documentation
COMMENT ON COLUMN games.oberon_split_intel_certain_evil_ids IS
  'Array of player IDs in Certain Evil group (excludes Oberon). NULL if oberon split intel disabled.';
COMMENT ON COLUMN games.oberon_split_intel_mixed_good_id IS
  'Player ID of good player in Mixed Intel group with Oberon. NULL if oberon split intel disabled.';

-- Note: Oberon's ID is not stored separately because Oberon is ALWAYS the evil player
-- in the mixed group when this mode is enabled. We can find Oberon from player_roles.
```

**role_config JSONB extension:**
```typescript
interface RoleConfig {
  // ... existing fields ...
  oberon_split_intel_enabled?: boolean;  // NEW: Enable oberon split intel mode
}
```

## Group Distribution Logic

### Core Logic in `lib/domain/oberon-split-intel.ts`

```typescript
interface OberonSplitIntelGroups {
  certainEvilIds: string[];      // Morgana, Assassin (NOT Oberon)
  oberonId: string;              // Oberon (always in mixed)
  mixedGoodId: string;           // 1 good player (not Merlin)
}

function canUseOberonSplitIntelMode(roleConfig: RoleConfig): {
  canUse: boolean;
  reason?: string;
} {
  // Check prerequisite: Oberon Standard must be enabled
  if (!roleConfig.oberon) {
    return { canUse: false, reason: 'Requires Oberon (Standard) to be enabled' };
  }
  if (roleConfig.oberon === 'chaos') {
    return { canUse: false, reason: 'Not available with Oberon (Chaos) - Oberon must be visible to Merlin' };
  }
  return { canUse: true };
}

function distributeOberonSplitIntelGroups(
  assignments: RoleAssignment[],
  roleConfig: RoleConfig
): OberonSplitIntelGroups {
  // 1. Find Oberon (always goes to mixed group)
  const oberon = assignments.find(a => a.specialRole === 'oberon_standard');
  if (!oberon) {
    throw new Error('Oberon Standard required for this mode');
  }

  // 2. Get other visible evil players (Morgana, Assassin) - go to Certain group
  const certainEvil = assignments.filter(a =>
    a.role === 'evil' &&
    a.specialRole !== 'oberon_standard' &&
    a.specialRole !== 'mordred'  // Mordred hidden from Merlin
  );

  // 3. Select random good player for Mixed group (not Merlin)
  const eligibleGood = assignments.filter(a =>
    a.role === 'good' && a.specialRole !== 'merlin'
  );
  const shuffledGood = shuffleArray([...eligibleGood]);
  const mixedGood = shuffledGood[0];

  return {
    certainEvilIds: certainEvil.map(a => a.playerId),
    oberonId: oberon.playerId,
    mixedGoodId: mixedGood.playerId,
  };
}
```

### Visibility Logic in `lib/domain/visibility.ts`

```typescript
interface OberonSplitIntelVisibilityResult {
  certainEvil: Array<{ id: string; name: string }>;
  mixedIntel: Array<{ id: string; name: string }>;  // Oberon + good player (shuffled)
  hiddenCount: number;  // Mordred only (Oberon is visible in this mode)
  certainLabel: string;
  mixedLabel: string;
}

function getOberonSplitIntelVisibility(
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig,
  certainEvilIds: string[],
  oberonId: string,
  mixedGoodId: string
): OberonSplitIntelVisibilityResult {
  // Build Certain Evil group (Morgana, Assassin)
  const certainEvil = certainEvilIds.map(id => {
    const player = allAssignments.find(a => a.playerId === id);
    return { id, name: player?.playerName || 'Unknown' };
  });

  // Build Mixed Intel group (Oberon + good player, shuffled to hide order)
  const mixedPlayers = [oberonId, mixedGoodId].map(id => {
    const player = allAssignments.find(a => a.playerId === id);
    return { id, name: player?.playerName || 'Unknown' };
  });
  const mixedIntel = shuffleArray(mixedPlayers);

  // Only Mordred is hidden (Oberon is visible in this mode)
  const hiddenCount = roleConfig.mordred ? 1 : 0;

  return {
    certainEvil,
    mixedIntel,
    hiddenCount,
    certainLabel: '🎯 Certain Evil - These players are definitely evil',
    mixedLabel: '❓ Mixed Intel - One is evil (Oberon), one is good',
  };
}
```

## Implementation Phases

### Phase 1: Database & Types (Foundation)

**Goal**: Schema ready, types defined

1. Create migration `018_oberon_split_intel.sql`
2. Run migration on Supabase
3. Update `src/types/role-config.ts` with `oberon_split_intel_enabled`
4. Update `src/types/game.ts` with oberon split intel fields
5. Update database types in `src/types/database.ts`

**Checkpoint**: Database accepts new columns, TypeScript compiles

### Phase 2: Domain Logic (Core)

**Goal**: Group selection and validation implemented

1. Create `src/lib/domain/oberon-split-intel.ts`:
   - `canUseOberonSplitIntelMode()` - prerequisite validation
   - `distributeOberonSplitIntelGroups()` - group assignment (Oberon always in mixed)
2. Update `src/lib/domain/visibility.ts`:
   - `getOberonSplitIntelVisibility()` - two-group visibility result
3. Update `src/lib/domain/role-config.ts`:
   - Add `oberon_split_intel_enabled` to validation
   - Add prerequisite check: requires `oberon === 'standard'`
   - Add mutual exclusivity with `merlin_decoy_enabled` AND `merlin_split_intel_enabled`
   - Auto-disable if Oberon Standard is removed
4. **Unit tests** for prerequisite validation and group distribution

**Checkpoint**: Domain logic validated with tests

### Phase 3: API Updates

**Goal**: Endpoints support oberon split intel mode

1. Update `POST /api/rooms/[code]/distribute`:
   - Check `role_config.oberon_split_intel_enabled`
   - Verify Oberon Standard is present
   - Call `distributeOberonSplitIntelGroups()` if enabled
   - Store group IDs in games table
2. Update `GET /api/rooms/[code]/role`:
   - For Merlin: return `oberon_split_intel` object with two groups
   - Reuse similar structure to `split_intel` response
3. Update `GET /api/games/[gameId]`:
   - Include oberon split intel fields in response
   - Add `was_mixed_group_with_oberon` flag to player list

**Checkpoint**: APIs return correct data for all configurations

### Phase 4: Configuration UI

**Goal**: Room managers can enable oberon split intel mode

1. Update `src/components/RoleConfigPanel.tsx`:
   - Add "Oberon Split Intel Mode" toggle
   - **Disabled state** when Oberon Standard not enabled (with tooltip)
   - **Disabled state** when Oberon Chaos is selected (with tooltip)
   - Implement triple mutual exclusivity:
     - When Oberon Split Intel is on → disable Decoy and standard Split Intel
     - When Decoy or standard Split Intel is on → disable Oberon Split Intel
   - Auto-disable Oberon Split Intel when Oberon Standard is removed
   - Show clear description: "Merlin sees Oberon mixed with a good player, while other evil players are shown as certain evil"
2. Update `src/components/RolesInPlay.tsx`:
   - Show "👤🔀 Oberon Split Intel" indicator when enabled
3. Wire up configuration to room creation API

**Checkpoint**: Manager can enable oberon split intel mode with proper prerequisites

### Phase 5: Role Reveal Updates (Two-Group Display)

**Goal**: Merlin sees distinct groups with Oberon in mixed

1. Update `src/components/RoleRevealModal.tsx`:
   - Detect `oberon_split_intel` in role data
   - **Reuse existing two-group display** from Merlin Split Intel (011)
   - Display two separate sections:
     - 🎯 **Certain Evil**: Morgana, Assassin (red/dark styling)
     - ❓ **Mixed Intel**: Oberon + good player (amber/yellow styling)
   - Show explanation: "One is evil (Oberon), one is good"
   - Handle edge case: empty Certain group if only Mordred + Oberon
2. Ensure groups are visually distinct with clear labels

**Checkpoint**: Merlin sees correctly formatted two-group display

### Phase 6: Game Over Updates

**Goal**: Mixed group revealed at game end

1. Update `src/components/game/GameOver.tsx`:
   - Show "👤🔀 Mixed with Oberon" indicator next to good player in mixed group
   - Only show when `oberon_split_intel_enabled` was true
2. Style indicator to be clear but not distracting

**Checkpoint**: All players see mixed group identity at game end

### Phase 7: Testing & Polish

**Goal**: Feature complete and tested

1. Unit tests for prerequisite validation (Oberon Standard required)
2. Unit tests for group distribution (Oberon always in mixed)
3. Integration test: Enable toggle only when Oberon Standard selected
4. Integration test: Toggle disabled when Oberon Chaos selected
5. Integration test: Triple mutual exclusivity works
6. Integration test: Auto-disable when Oberon Standard removed
7. Integration test: Distribute → Verify Merlin sees correct groups
8. Integration test: Game over → Verify mixed group revealed
9. Error handling for edge cases
10. Mobile responsiveness check

**Checkpoint**: Feature complete

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Oberon Chaos enabled by mistake | Toggle disabled with clear tooltip when Chaos is selected |
| No Oberon enabled | Toggle disabled with clear tooltip requiring Oberon Standard |
| Three modes enabled simultaneously | Triple mutual exclusivity enforced in UI and API validation |
| Oberon removed after enabling mode | Auto-disable Oberon Split Intel with notification |
| Mixed group revealed during game | Server-side only; no client hints |
| UI confusion with standard Split Intel | Different indicator icon (👤🔀 vs 🔀); clear labeling |

## Complexity Tracking

| Decision | Justification |
|----------|---------------|
| Reuse two-group UI from Split Intel (011) | Consistent UX; avoids duplication |
| Oberon ID not stored separately | Always findable from player_roles; reduces schema changes |
| Triple mutual exclusivity | Simpler than combining modes; avoids complex visibility logic |
| Prerequisite check in UI | Better UX than API error; guides correct configuration |

## Dependencies

- Special Roles (002) must be complete for Oberon Standard role
- Merlin Split Intel (011) must be complete for UI patterns and visibility helpers
- Quest System (003) must be complete for game-over logic

## Success Metrics

- All 4 user stories pass acceptance criteria
- Toggle correctly disabled when Oberon Standard not enabled
- Toggle correctly disabled when Oberon Chaos selected
- Triple mutual exclusivity works (Oberon Split Intel, Split Intel, Decoy)
- Oberon ALWAYS in mixed group (never in Certain group)
- No leakage of mixed group identity during gameplay
- Clear two-group display for Merlin
- Clear game-end reveal with "Mixed with Oberon" indicator
