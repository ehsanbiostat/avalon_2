# Implementation Plan: Avalon Online – Phase 2: Special Roles & Configurations

**Branch**: `002-avalon-special-roles` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-avalon-special-roles/spec.md`
**Depends On**: MVP (001-avalon-mvp-lobby) ✅ Complete

## Summary

Extend the Avalon Online role system to support configurable special characters (Percival, Morgana, Mordred, Oberon) with proper visibility rules, plus Lady of the Lake setup designation. Room managers can customize game complexity by selecting which roles to include. This phase builds on the existing MVP infrastructure.

## Technical Context

**Existing Stack** (from MVP):
- TypeScript 5.x, Node.js 20.x
- Next.js 14+ (App Router), React 18+, Supabase JS Client v2, Tailwind CSS 3.x
- Supabase Postgres with RLS, Browser localStorage for player ID
- Vitest for unit tests, Playwright for E2E

**New for Phase 2**:
- JSONB column for role configuration storage
- Extended `special_role` enum with new character types
- Complex visibility matrix logic in domain layer
- Role configuration UI components

**Performance Goals**: Same as MVP (<2s updates, <5s operations)
**Constraints**: Backward compatible with existing rooms; validation must prevent invalid role configs

## Constitution Check

*GATE: Must pass before proceeding. All principles inherited from MVP implementation.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Purpose & Vision | ✅ PASS | Incremental delivery; extends MVP as planned |
| II. Tech Stack | ✅ PASS | Same stack; extends existing schemas |
| III. Data & Security | ✅ PASS | RLS policies extend existing patterns; server-side role logic |
| IV. Code Quality | ✅ PASS | Pure functions for visibility logic; typed configs |
| V. Testing | ✅ PASS | Unit tests for visibility matrix; smoke tests for config flow |
| VI. UX Principles | ✅ PASS | Clear role selection UI; transparent game config |
| VII. Workflow | ✅ PASS | Spec-driven; extends MVP branch pattern |

**Result**: All gates passed. Proceeding with implementation plan.

## High-Level Architecture

Phase 2 extends the existing architecture without structural changes:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EXISTING MVP ARCHITECTURE                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Next.js App (App Router)                   │  │
│  │                                                                │  │
│  │  PHASE 2 CHANGES:                                             │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ • CreateRoomModal → Add RoleConfigPanel                 │  │  │
│  │  │ • RoleRevealModal → Character-specific visibility       │  │  │
│  │  │ • Lobby → "Roles in Play" section + Lady of Lake badge  │  │  │
│  │  │ • /api/rooms POST → Accept role_config                  │  │  │
│  │  │ • /api/rooms/[code]/role → Enhanced visibility data     │  │  │
│  │  │ • lib/domain/roles.ts → Visibility matrix logic         │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ PHASE 2 SCHEMA CHANGES:                                      │   │
│  │ • rooms: +role_config (JSONB), +lady_of_lake_enabled,       │   │
│  │          +lady_of_lake_holder_id                            │   │
│  │ • player_roles: special_role enum extended                   │   │
│  │                  +has_lady_of_lake boolean                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure (Changes Only)

### New/Modified Files

```text
src/
├── components/
│   ├── CreateRoomModal.tsx       # MODIFY: Add role configuration section
│   ├── RoleConfigPanel.tsx       # NEW: Role selection UI
│   ├── RoleConfigSummary.tsx     # NEW: Display selected roles
│   ├── RolesInPlay.tsx           # NEW: Public roles display for lobby
│   ├── LadyOfLakeBadge.tsx       # NEW: Token holder indicator
│   ├── Lobby.tsx                 # MODIFY: Add RolesInPlay section
│   └── RoleRevealModal.tsx       # MODIFY: Character-specific content
├── lib/
│   ├── domain/
│   │   ├── roles.ts              # MODIFY: Add visibility matrix logic
│   │   ├── role-config.ts        # NEW: Role config validation
│   │   └── visibility.ts         # NEW: Character visibility rules
│   └── utils/
│       └── constants.ts          # MODIFY: Add role definitions
├── types/
│   ├── database.ts               # MODIFY: Extend types
│   ├── role.ts                   # MODIFY: Add new role types
│   └── role-config.ts            # NEW: Configuration types
└── app/
    └── api/
        └── rooms/
            ├── route.ts          # MODIFY: Accept role_config
            └── [code]/
                ├── distribute/
                │   └── route.ts  # MODIFY: Use config for distribution
                └── role/
                    └── route.ts  # MODIFY: Return visibility data

supabase/migrations/
└── 006_special_roles_config.sql  # NEW: Schema changes

tests/
├── unit/
│   └── domain/
│       ├── visibility.test.ts    # NEW: Visibility matrix tests
│       └── role-config.test.ts   # NEW: Config validation tests
└── e2e/
    └── role-config.spec.ts       # NEW: Role configuration flow
```

## Database Schema Changes

See [data-model.md](./data-model.md) for complete schema details.

### Migration: 006_special_roles_config.sql

**rooms table changes:**
```sql
ALTER TABLE rooms ADD COLUMN role_config JSONB DEFAULT '{"roles":["merlin","assassin"]}';
ALTER TABLE rooms ADD COLUMN lady_of_lake_enabled BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN lady_of_lake_holder_id UUID REFERENCES players(id);
```

**special_role enum extension:**
```sql
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'percival';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'morgana';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'mordred';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'oberon_standard';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'oberon_chaos';
```

**player_roles table changes:**
```sql
ALTER TABLE player_roles ADD COLUMN has_lady_of_lake BOOLEAN DEFAULT false;
```

### Role Configuration Schema (JSONB)

```typescript
interface RoleConfig {
  // Required roles (always present)
  // merlin and assassin are implicit
  
  // Optional Good roles
  percival?: boolean;
  
  // Optional Evil roles
  morgana?: boolean;
  mordred?: boolean;
  oberon?: 'standard' | 'chaos' | false;
  
  // Game options
  ladyOfLake?: boolean;
}
```

## API Contract Changes

### Updated: POST `/api/rooms`

**Request Body** (extended):
```typescript
{
  expected_players: number;  // 5-10
  role_config?: {
    percival?: boolean;
    morgana?: boolean;
    mordred?: boolean;
    oberon?: 'standard' | 'chaos';
    ladyOfLake?: boolean;
  }
}
```

**Validation Rules:**
- `percival` can only be true if expected Good slots ≥ 2 (Merlin + Percival)
- `morgana` can only be true if expected Evil slots ≥ 2 (Assassin + Morgana)
- `mordred` can only be true if expected Evil slots ≥ 2 (or 3 if Morgana also selected)
- `oberon` can only be set if expected Evil slots ≥ 2 (or 3/4 with other evil)
- Total special roles per team cannot exceed team size

### Updated: GET `/api/rooms/[code]/role`

**Response** (extended):
```typescript
{
  data: {
    role: 'good' | 'evil';
    special_role: SpecialRole;
    role_name: string;
    role_description: string;
    is_confirmed: boolean;
    has_lady_of_lake: boolean;
    
    // Visibility data (character-specific)
    known_players?: string[];           // Names visible to this role
    known_players_label?: string;       // "Evil Players", "Merlin Candidates", etc.
    hidden_count?: number;              // Number of hidden evil (for Merlin warning)
  }
}
```

### Updated: GET `/api/rooms/[code]`

**Response** (extended room info):
```typescript
{
  data: {
    room: {
      // ... existing fields ...
      role_config: RoleConfig;
      lady_of_lake_enabled: boolean;
      lady_of_lake_holder_id: string | null;
      roles_in_play: string[];  // Computed list of active roles
    },
    // ... players, confirmations, etc. ...
  }
}
```

## Visibility Matrix

Core logic for determining what each role sees:

```
                    │ Sees Evil │ Sees Merlin │ Seen by Merlin │ Seen by Evil │
────────────────────┼───────────┼─────────────┼────────────────┼──────────────┤
Merlin              │ *partial  │ (self)      │ N/A            │ No           │
Percival            │ No        │ *candidates │ No             │ No           │
Loyal Servant       │ No        │ No          │ No             │ No           │
────────────────────┼───────────┼─────────────┼────────────────┼──────────────┤
Assassin            │ Yes**     │ No          │ Yes            │ Yes          │
Morgana             │ Yes**     │ No          │ Yes            │ Yes          │
Mordred             │ Yes**     │ No          │ NO             │ Yes          │
Oberon (Standard)   │ No        │ No          │ Yes            │ No           │
Oberon (Chaos)      │ No        │ No          │ NO             │ No           │
Minion              │ Yes**     │ No          │ Yes            │ Yes          │

* Merlin sees all evil EXCEPT Mordred and Oberon (Chaos)
** Evil players see each other EXCEPT Oberon (both modes)
*candidates = Percival sees Merlin + Morgana (indistinguishable)
```

### Implementation in `lib/domain/visibility.ts`

```typescript
interface VisibilityResult {
  knownPlayers: string[];      // Player IDs this role can see
  knownPlayersLabel: string;   // Display label
  hiddenEvilCount: number;     // For Merlin's warning
}

function getVisibilityForRole(
  myRole: SpecialRole,
  allAssignments: RoleAssignment[],
  roleConfig: RoleConfig
): VisibilityResult;
```

## Lady of the Lake Logic

### Holder Designation

When roles are distributed:
1. Get ordered list of players by join time
2. Find room manager's position in list
3. Holder = player at (manager_position + 1) % player_count
4. Set `has_lady_of_lake = true` for that player's role

### Display Rules

- Show Lady of Lake holder badge in lobby (after role distribution)
- Show on holder's role card: "You hold the Lady of the Lake"
- Other players see: "[Name] holds the Lady of the Lake"

## Implementation Phases

### Phase 1: Database & Types (Foundation)

**Goal**: Schema ready, types defined

1. Create migration `006_special_roles_config.sql`
2. Run migration on Supabase
3. Update `src/types/database.ts` with new fields
4. Create `src/types/role-config.ts` with configuration types
5. Update `src/types/role.ts` with extended special roles

**Checkpoint**: Database accepts new columns, TypeScript compiles

### Phase 2: Domain Logic (Core)

**Goal**: Role configuration validation and visibility rules implemented

1. Create `src/lib/domain/role-config.ts`:
   - `validateRoleConfig(config, playerCount)` - returns errors/warnings
   - `getRolesForConfig(config)` - returns list of special roles to distribute
   - `getDefaultConfig()` - returns base config (Merlin + Assassin)
2. Create `src/lib/domain/visibility.ts`:
   - `getVisibilityForRole(myRole, allAssignments, config)` - visibility matrix
   - `getMerlinCandidates(allAssignments)` - for Percival
   - `getEvilTeammatesExcludingOberon(allAssignments, myPlayerId)` - for evil
3. Update `src/lib/domain/roles.ts`:
   - Modify `distributeRoles` to use config-based role pool
4. **Unit tests** for all domain functions

**Checkpoint**: Domain logic validated with tests, visibility matrix correct

### Phase 3: API Updates

**Goal**: Endpoints support role configuration

1. Update `POST /api/rooms`:
   - Accept `role_config` in request body
   - Validate config against player count
   - Store config in database
2. Update `POST /api/rooms/[code]/distribute`:
   - Use `role_config` to determine role pool
   - Assign Lady of Lake holder if enabled
3. Update `GET /api/rooms/[code]/role`:
   - Use visibility matrix for `known_players`
   - Include `has_lady_of_lake` flag
4. Update `GET /api/rooms/[code]`:
   - Include `role_config` and `roles_in_play` in response

**Checkpoint**: APIs return correct data for role configurations

### Phase 4: Role Configuration UI

**Goal**: Room managers can configure roles

1. Create `src/components/RoleConfigPanel.tsx`:
   - Role selection checkboxes (organized by team)
   - Oberon mode toggle (Standard/Chaos)
   - Lady of Lake toggle
   - Warning/error messages for invalid configs
2. Create `src/components/RoleConfigSummary.tsx`:
   - Display selected roles before confirmation
3. Update `src/components/CreateRoomModal.tsx`:
   - Add "Advanced Options" or "Configure Roles" section
   - Integrate RoleConfigPanel
4. Update landing page flow to pass config to API

**Checkpoint**: Manager can configure and create room with custom roles

### Phase 5: Lobby Updates

**Goal**: Players see active roles and Lady of Lake

1. Create `src/components/RolesInPlay.tsx`:
   - Display list of active special roles
   - Show Oberon mode indicator
2. Create `src/components/LadyOfLakeBadge.tsx`:
   - Token holder indicator
3. Update `src/components/Lobby.tsx`:
   - Add RolesInPlay section
   - Show Lady of Lake holder after distribution
4. Update `src/hooks/useRoom.ts`:
   - Include role_config in room data

**Checkpoint**: All players see roles in play and Lady holder

### Phase 6: Role Reveal Updates

**Goal**: Character-specific role reveals

1. Update `src/components/RoleRevealModal.tsx`:
   - Different content for each special role
   - Show visibility information per character
   - Show Lady of Lake designation if applicable
2. Update role info constants for each character:
   - Percival: "These players might be Merlin"
   - Morgana: "You appear as Merlin to Percival"
   - Mordred: "Merlin cannot see you"
   - Oberon: Mode-specific messaging
3. Handle edge cases:
   - Percival without Morgana (sees only Merlin)
   - Morgana without Percival (note about ability)
   - Merlin with hidden evil count warning

**Checkpoint**: Each role sees correct information

### Phase 7: Testing & Polish

**Goal**: Feature complete and tested

1. Unit tests for visibility matrix (all combinations)
2. Unit tests for role config validation
3. E2E test: Configure roles → Create room → Distribute → Verify reveals
4. Update existing E2E tests if needed
5. Error handling for all new paths
6. Mobile responsiveness for config UI

**Checkpoint**: Phase 2 feature complete

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Complex visibility bugs | Comprehensive unit tests for all role combinations |
| Invalid role configs | Server-side validation; clear UI feedback |
| Backward compatibility | Default config equals MVP behavior (Merlin + Assassin) |
| Lady of Lake holder edge cases | Clear rules for holder determination; handle disconnects |
| UI complexity | Progressive disclosure; hide advanced options by default |

## Complexity Tracking

| Decision | Justification |
|----------|---------------|
| JSONB for role_config | Flexible schema for future role additions; simple updates |
| Separate visibility module | Pure functions easier to test; clear separation of concerns |
| Oberon as two enum values | Simpler than runtime mode flag; clearer in database |

## Dependencies

- MVP implementation must be stable
- Existing role distribution must work before extending
- Database migration must be backward compatible

## Success Metrics

- All 8 user stories pass acceptance criteria
- Visibility matrix correct for all 20+ role combinations
- Role configuration validation catches all invalid states
- No regression in MVP functionality

