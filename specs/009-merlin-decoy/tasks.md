# Tasks: Merlin Decoy Configuration

**Feature**: 009-merlin-decoy
**Input**: Design documents from `/specs/009-merlin-decoy/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: Unit tests included for domain logic per constitution requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## User Story Mapping

| Story | Title | Priority | Key Deliverables |
|-------|-------|----------|------------------|
| US1 | Enable Merlin Decoy Mode | P1 | Configuration toggle, UI, validation |
| US2 | Merlin Sees Decoy Player | P1 | Visibility injection, warning messages |
| US3 | Decoy Player Experience | P1 | Game-over reveal, secrecy during game |
| US4 | Decoy Selection Rules | P2 | Random selection, persistence |

---

## Phase 1: Setup (Database & Types)

**Purpose**: Database schema and TypeScript types ready

- [x] T001 Create migration file `supabase/migrations/012_merlin_decoy.sql` with ALTER TABLE to add merlin_decoy_player_id column to games table
- [x] T002 Add column comment documenting merlin_decoy_player_id lifecycle in migration file
- [x] T003 [P] Add `merlin_decoy_enabled` field to RoleConfig interface in `src/types/role-config.ts`
- [x] T004 [P] Add `merlin_decoy_player_id: string | null` to Game interface in `src/types/game.ts`
- [x] T005 [P] Add `was_decoy?: boolean` to GamePlayer interface in `src/types/game.ts`
- [x] T006 [P] Update DEFAULT_ROLE_CONFIG to include `merlin_decoy_enabled: false` in `src/types/role-config.ts`
- [x] T007 Update database types with new column in `src/types/database.ts`

**Checkpoint**: Database accepts new column, TypeScript compiles

---

## Phase 2: Foundational (Domain Logic)

**Purpose**: Core decoy selection and visibility logic MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Decoy Selection Logic

- [x] T008 Create `src/lib/domain/decoy-selection.ts` with module structure
- [x] T009 Implement `selectDecoyPlayer(assignments: RoleAssignment[]): string` function in `src/lib/domain/decoy-selection.ts`
- [x] T010 Implement `isEligibleForDecoy(assignment: RoleAssignment): boolean` helper in `src/lib/domain/decoy-selection.ts`
- [x] T011 Implement `getEligibleDecoyPlayers(assignments: RoleAssignment[]): RoleAssignment[]` helper in `src/lib/domain/decoy-selection.ts`
- [x] T012 [P] Create unit tests for decoy selection in `tests/unit/domain/decoy-selection.test.ts`

### Visibility Logic Updates

- [x] T013 Add `generateDecoyWarning(hiddenCount: number): string` function in `src/lib/domain/visibility.ts`
- [x] T014 Update `getMerlinVisibility()` to accept optional `decoyPlayerId` parameter in `src/lib/domain/visibility.ts`
- [x] T015 Implement decoy injection logic: add decoy to visible players list in `src/lib/domain/visibility.ts`
- [x] T016 Implement list shuffling after decoy injection to prevent position detection in `src/lib/domain/visibility.ts`
- [x] T017 [P] Create unit tests for all 6 visibility combinations with decoy in `tests/unit/domain/visibility.test.ts`

### Role Config Validation

- [x] T018 Update `validateRoleConfig()` to handle `merlin_decoy_enabled` field in `src/lib/domain/role-config.ts`

**Checkpoint**: Domain logic validated with tests for all 6 visibility combinations

---

## Phase 3: User Story 1 - Enable Merlin Decoy Mode (Priority: P1) 🎯 MVP

**Goal**: Room managers can enable Merlin Decoy Mode when creating a room

**Independent Test**: Create a room with Merlin Decoy enabled, verify configuration is stored and displayed

### Implementation for User Story 1

- [x] T019 [US1] Add "Merlin Decoy Mode" toggle switch to role configuration in `src/components/RoleConfigPanel.tsx`
- [x] T020 [US1] Add tooltip explaining decoy feature: "One random good player appears evil to Merlin" in `src/components/RoleConfigPanel.tsx`
- [x] T021 [US1] Add decoy configuration state management in `src/components/RoleConfigPanel.tsx`
- [x] T022 [US1] Update `POST /api/rooms` to accept `merlin_decoy_enabled` in role_config in `src/app/api/rooms/route.ts`
- [x] T023 [US1] Update room creation to persist decoy config to database in `src/lib/supabase/rooms.ts`
- [x] T024 [US1] Add "🎭 Merlin Decoy" indicator to roles in play display in `src/components/RolesInPlay.tsx`
- [x] T025 [US1] Update `GET /api/rooms/[code]` to include merlin_decoy_enabled in roles_in_play in `src/app/api/rooms/[code]/route.ts`

**Checkpoint**: Room manager can enable decoy mode, all players see indicator in lobby

---

## Phase 4: User Story 4 - Decoy Selection Rules (Priority: P2)

**Goal**: System selects decoy fairly during role distribution

**Independent Test**: Distribute roles with decoy enabled, verify decoy is persisted and is a valid good player (not Merlin)

**Note**: Implementing US4 before US2/US3 because selection logic is needed for visibility and game-over features

### Implementation for User Story 4

- [x] T026 [US4] Update `POST /api/rooms/[code]/distribute` to check if merlin_decoy_enabled in `src/app/api/rooms/[code]/distribute/route.ts`
- [x] T027 [US4] Call `selectDecoyPlayer()` after role distribution if decoy enabled in `src/app/api/rooms/[code]/distribute/route.ts`
- [x] T028 [US4] Store `merlin_decoy_player_id` in games table after selection in `src/lib/supabase/games.ts`
- [x] T029 [US4] Add `setMerlinDecoyPlayer(gameId, playerId)` function to `src/lib/supabase/games.ts`
- [x] T030 [US4] Ensure decoy selection is persisted and not re-randomized on subsequent calls in `src/app/api/rooms/[code]/distribute/route.ts`

**Checkpoint**: Decoy is correctly selected and persisted during role distribution

---

## Phase 5: User Story 2 - Merlin Sees Decoy Player (Priority: P1) 🎯

**Goal**: Merlin sees decoy in evil list with appropriate warning

**Independent Test**: As Merlin with decoy enabled, view role reveal and verify extra player + warning message

### Implementation for User Story 2

- [x] T031 [US2] Update `GET /api/rooms/[code]/role` to fetch game's decoy_player_id in `src/app/api/rooms/[code]/role/route.ts`
- [x] T032 [US2] Pass decoy_player_id to visibility calculation for Merlin in `src/app/api/rooms/[code]/role/route.ts`
- [x] T033 [US2] Add `has_decoy: boolean` to role API response for Merlin in `src/app/api/rooms/[code]/role/route.ts`
- [x] T034 [US2] Add `decoy_warning: string` to role API response for Merlin in `src/app/api/rooms/[code]/role/route.ts`
- [x] T035 [US2] Update Merlin's role reveal to show decoy warning in `src/components/RoleRevealModal.tsx`
- [x] T036 [US2] Style decoy warning message (⚠️ icon, appropriate color) in `src/components/RoleRevealModal.tsx`
- [x] T037 [US2] Combine decoy warning with hidden evil count warning (0, 1, or 2 hidden) in `src/components/RoleRevealModal.tsx`
- [x] T038 [US2] Ensure decoy player is visually indistinguishable in Merlin's evil list in `src/components/RoleRevealModal.tsx`

**Checkpoint**: Merlin sees correct player count and warning for all 6 visibility combinations

---

## Phase 6: User Story 3 - Decoy Player Experience (Priority: P1) 🎯

**Goal**: Decoy player has normal experience during game, revealed at game end

**Independent Test**: As decoy player, verify no indication during game; at game end, verify decoy indicator shown

### Implementation for User Story 3

- [x] T039 [US3] Ensure decoy player's role reveal shows only their actual role (no decoy mention) in `src/app/api/rooms/[code]/role/route.ts`
- [x] T040 [US3] Update `GET /api/games/[gameId]` to include `merlin_decoy_player_id` at game_over phase in `src/app/api/games/[gameId]/route.ts`
- [x] T041 [US3] Add `was_decoy` flag to players array in game state response in `src/app/api/games/[gameId]/route.ts`
- [x] T042 [US3] Add game-over check: only reveal decoy when phase is `game_over` in `src/app/api/games/[gameId]/route.ts`
- [x] T043 [US3] Update GameOver component to show "🎭 Decoy" indicator for decoy player in `src/components/game/GameOver.tsx`
- [x] T044 [US3] Style decoy indicator (subtle but visible, next to role) in `src/components/game/GameOver.tsx`
- [x] T045 [US3] Only show decoy indicator when `merlin_decoy_enabled` was true for the game in `src/components/game/GameOver.tsx`

**Checkpoint**: Decoy hidden during game, revealed at game end for all players

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and final validation

### Error Handling

- [x] T046 [P] Add error handling for decoy selection edge cases (no eligible players - shouldn't happen but defensive) in `src/lib/domain/decoy-selection.ts`
- [x] T047 [P] Add null check for decoy_player_id when fetching from games table in `src/app/api/rooms/[code]/role/route.ts`

### Integration Verification

- [x] T048 Verify Lady of the Lake correctly shows "Good" for decoy player (existing logic should work) in `src/app/api/games/[gameId]/lady-investigate/route.ts`
- [x] T049 Verify Percival's view is NOT affected by decoy mode (existing logic should work) in `src/app/api/rooms/[code]/role/route.ts`

### Testing

- [x] T050 [P] Add unit test: decoy selection excludes Merlin in `tests/unit/domain/decoy-selection.test.ts`
- [x] T051 [P] Add unit test: uniform distribution check (statistical) in `tests/unit/domain/decoy-selection.test.ts`
- [x] T052 [P] Add unit test: visibility Combination 1 (Decoy only) in `tests/unit/domain/visibility.test.ts`
- [x] T053 [P] Add unit test: visibility Combination 2 (Decoy + Mordred) in `tests/unit/domain/visibility.test.ts`
- [x] T054 [P] Add unit test: visibility Combination 4 (Decoy + Oberon Chaos) in `tests/unit/domain/visibility.test.ts`
- [x] T055 [P] Add unit test: visibility Combination 6 (Decoy + Mordred + Oberon Chaos) in `tests/unit/domain/visibility.test.ts`

### Final Validation

- [ ] T056 Run quickstart.md test scenarios 1-10
- [x] T057 [P] Mobile responsiveness check for RoleConfigPanel decoy toggle
- [x] T058 [P] Mobile responsiveness check for GameOver decoy indicator

**Checkpoint**: Feature complete, all tests pass, ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup: Database & Types)
    │
    ▼
Phase 2 (Foundational: Domain Logic) ─── BLOCKS ALL USER STORIES
    │
    ├──────────────────────────────────────────────────────┐
    │                                                      │
    ▼                                                      │
Phase 3 (US1: Enable Decoy Mode)                          │
    │                                                      │
    ▼                                                      │
Phase 4 (US4: Decoy Selection) ◄───────────────────────────┘
    │
    ▼
Phase 5 (US2: Merlin Visibility)
    │
    ▼
Phase 6 (US3: Decoy Experience)
    │
    ▼
Phase 7 (Polish)
```

### User Story Dependencies

- **US1 (Enable Mode)**: Can start after Phase 2 - Configuration only, no game logic
- **US4 (Selection Rules)**: Depends on US1 - Needs config to trigger selection
- **US2 (Merlin Visibility)**: Depends on US4 - Needs decoy_player_id to inject
- **US3 (Decoy Experience)**: Depends on US4 - Needs decoy_player_id for game-over reveal

### Within Each User Story

- API updates before UI updates (data must exist before display)
- Types before implementation (TypeScript compilation)
- Domain logic before API integration

### Parallel Opportunities

**Phase 1 Parallel**: T003, T004, T005, T006 (different files)
**Phase 2 Parallel**: T012, T017 (test files independent)
**Phase 7 Parallel**: T050-T055 (all test files), T057-T058 (responsive checks)

---

## Parallel Example: Phase 2 Foundation

```bash
# Launch domain logic sequentially (same file):
T008 → T009 → T010 → T011

# Launch unit tests in parallel (different test files):
Task T012: "Create unit tests for decoy selection in tests/unit/domain/decoy-selection.test.ts"
Task T017: "Create unit tests for visibility combinations in tests/unit/domain/visibility.test.ts"

# Then visibility updates (same file):
T013 → T014 → T015 → T016

# Then validation:
T018
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 4 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 - Enable Decoy Mode
4. Complete Phase 4: US4 - Decoy Selection
5. Complete Phase 5: US2 - Merlin Visibility
6. **STOP and VALIDATE**: Merlin sees decoy with correct warning
7. Deploy/demo if ready (game-over reveal can be added later)

### Full Feature

1. All above + Phase 6: US3 - Game Over Reveal
2. Phase 7: Polish & Testing
3. Full feature complete

### Task Count Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| 1. Setup | 7 | 4 |
| 2. Foundational | 11 | 2 |
| 3. US1 Enable Mode | 7 | 0 |
| 4. US4 Selection | 5 | 0 |
| 5. US2 Merlin Visibility | 8 | 0 |
| 6. US3 Decoy Experience | 7 | 0 |
| 7. Polish | 13 | 8 |
| **Total** | **58** | **14** |

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently testable at its checkpoint
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution requires unit tests for domain logic (included in Phase 2 and 7)
- No E2E tests specified in requirements (manual testing via quickstart.md)
