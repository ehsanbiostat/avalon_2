# Tasks: Oberon Split Intel Mode

**Input**: Design documents from `/specs/018-oberon-split-intel/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: Optional - Unit tests included for core domain logic per plan.md

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Database & Types)

**Purpose**: Schema migration and type definitions that ALL user stories depend on

- [x] T001 Create migration file `supabase/migrations/018_oberon_split_intel.sql` with new game columns
- [ ] T002 Run migration on Supabase to add `oberon_split_intel_certain_evil_ids` and `oberon_split_intel_mixed_good_id` columns
- [x] T003 [P] Add `oberon_split_intel_enabled` field to RoleConfig interface in `src/types/role-config.ts`
- [x] T004 [P] Add oberon split intel fields to Game type in `src/types/game.ts`
- [x] T005 [P] Update `isValidRoleConfig` type guard in `src/types/role-config.ts` to include new field
- [x] T006 Update database types in `src/types/database.ts` if needed

**Checkpoint**: Database accepts new columns, TypeScript compiles

---

## Phase 2: Foundational (Domain Logic)

**Purpose**: Core domain logic that MUST be complete before ANY user story UI can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create `src/lib/domain/oberon-split-intel.ts` with OberonSplitIntelGroups interface
- [x] T008 Implement `canUseOberonSplitIntelMode()` in `src/lib/domain/oberon-split-intel.ts`
- [x] T009 Implement `distributeOberonSplitIntelGroups()` in `src/lib/domain/oberon-split-intel.ts`
- [x] T010 Add `getOberonSplitIntelVisibility()` function to `src/lib/domain/visibility.ts`
- [x] T011 Update `validateRoleConfig()` in `src/lib/domain/role-config.ts` for triple mutual exclusivity
- [x] T012 Add prerequisite validation (oberon === 'standard') to `src/lib/domain/role-config.ts`
- [x] T013 [P] Update `src/lib/supabase/games.ts` to include oberon split intel fields in queries

**Checkpoint**: Domain logic complete - user story implementation can now begin

---

## Phase 3: User Story 1 - Enable Oberon Split Intel Mode (Priority: P1) 🎯 MVP

**Goal**: Room manager can enable Oberon Split Intel Mode when Oberon Standard is selected

**Independent Test**: Toggle appears, is disabled/enabled based on Oberon selection, mutually exclusive with other modes

### Implementation for User Story 1

- [x] T014 [US1] Add "Oberon Split Intel Mode" toggle to `src/components/RoleConfigPanel.tsx`
- [x] T015 [US1] Implement disabled state with tooltip when Oberon Standard not enabled in `src/components/RoleConfigPanel.tsx`
- [x] T016 [US1] Implement disabled state with tooltip when Oberon Chaos is selected in `src/components/RoleConfigPanel.tsx`
- [x] T017 [US1] Implement triple mutual exclusivity UI logic (disable other modes when this is on) in `src/components/RoleConfigPanel.tsx`
- [x] T018 [US1] Implement auto-disable when Oberon Standard is removed in `src/components/RoleConfigPanel.tsx`
- [x] T019 [US1] Add "👤🔀 Oberon Split Intel" indicator to `src/components/RolesInPlay.tsx`
- [x] T020 [US1] Add description tooltip: "Merlin sees Oberon mixed with a good player" in `src/components/RoleConfigPanel.tsx`

**Checkpoint**: Room manager can enable/disable Oberon Split Intel Mode with proper validation

---

## Phase 4: User Story 2 - Merlin Sees Oberon in Mixed Group (Priority: P1)

**Goal**: Merlin sees two distinct groups: Certain Evil (Morgana, Assassin) and Mixed Intel (Oberon + good player)

**Independent Test**: Distribute roles → Merlin sees correct two-group display with Oberon always in mixed

### Implementation for User Story 2

- [x] T021 [US2] Update `POST /api/rooms/[code]/distribute/route.ts` to call `distributeOberonSplitIntelGroups()` when enabled
- [x] T022 [US2] Update `POST /api/rooms/[code]/distribute/route.ts` to store group IDs in games table
- [x] T023 [US2] Update `GET /api/rooms/[code]/role/route.ts` to return `oberon_split_intel` object for Merlin
- [x] T024 [US2] Update `src/components/RoleRevealModal.tsx` to detect and handle `oberon_split_intel` data
- [x] T025 [US2] Reuse two-group display UI from Merlin Split Intel (011) in `src/components/RoleRevealModal.tsx`
- [x] T026 [US2] Display "🎯 Certain Evil" group with label "These players are definitely evil" in `src/components/RoleRevealModal.tsx`
- [x] T027 [US2] Display "❓ Mixed Intel" group with label "One is evil (Oberon), one is good" in `src/components/RoleRevealModal.tsx`
- [x] T028 [US2] Handle edge case: empty Certain group when only Mordred + Oberon in `src/components/RoleRevealModal.tsx`
- [x] T029 [US2] Verify Mordred is excluded from both groups when present (test with Mordred + Oberon + Morgana config)

**Checkpoint**: Merlin sees correctly formatted two-group display with Oberon always in mixed

---

## Phase 5: User Story 3 - Good Player in Mixed Group Experience (Priority: P1)

**Goal**: Good player in mixed group has unchanged experience; mixed group revealed at game end

**Independent Test**: Good player sees normal role reveal; game end shows "🔀 Mixed with Oberon" indicator

### Implementation for User Story 3

- [x] T030 [US3] Update `GET /api/games/[gameId]/route.ts` to include oberon split intel fields in response
- [x] T031 [US3] Add `was_mixed_group_with_oberon` flag to player list in game response
- [x] T032 [US3] Update `src/components/game/GameOver.tsx` to show "👤🔀 Mixed with Oberon" indicator
- [x] T033 [US3] Only show indicator when `oberon_split_intel_enabled` was true in `src/components/game/GameOver.tsx`
- [x] T034 [US3] Verify good player sees normal role reveal with no mixed group indication (no changes needed - just verify)

**Checkpoint**: Game end reveals mixed group composition correctly

---

## Phase 6: User Story 4 - Oberon's Experience (Priority: P2)

**Goal**: Oberon's gameplay remains unchanged; no indication they are always in mixed group

**Independent Test**: Oberon sees standard Oberon role reveal with no mixed group mention

### Implementation for User Story 4

- [x] T035 [US4] Verify Oberon role reveal shows standard message (no mixed group info) - no code changes needed
- [x] T036 [US4] Verify no client-side hints about mixed group status for Oberon player

**Checkpoint**: Oberon experience unchanged; no information leakage

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Testing, cleanup, and validation

- [ ] T037 [P] Create unit tests for `canUseOberonSplitIntelMode()` in `tests/unit/domain/oberon-split-intel.test.ts`
- [ ] T038 [P] Create unit tests for `distributeOberonSplitIntelGroups()` in `tests/unit/domain/oberon-split-intel.test.ts`
- [ ] T039 [P] Create unit tests for triple mutual exclusivity in `tests/unit/domain/role-config.test.ts`
- [ ] T040 Mobile responsiveness check for RoleConfigPanel toggle
- [ ] T041 Mobile responsiveness check for RoleRevealModal two-group display
- [ ] T042 Run quickstart.md test scenarios manually
- [ ] T043 Verify all acceptance scenarios from spec.md

**Note**: Unit tests (T037-T039) are optional per plan.md. Core implementation is complete and build passes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1, US2, US3, US4 can proceed in priority order
  - US1 enables the feature; US2 needs US1 to be enabled; US3 needs game to run; US4 is verification
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Enables the toggle
- **User Story 2 (P1)**: Depends on US1 (need toggle enabled to test Merlin's view)
- **User Story 3 (P1)**: Depends on US2 (need game to complete to test game end reveal)
- **User Story 4 (P2)**: Can verify alongside US2/US3 - no code changes, just verification

### Within Each User Story

- Domain logic before API updates
- API updates before UI components
- Configuration UI before role reveal UI
- Role reveal before game over UI

### Parallel Opportunities

- T003, T004, T005 can run in parallel (different type files)
- T007-T013 mostly sequential but T013 can run in parallel with others
- T037, T038, T039 can run in parallel (different test files/functions)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch type updates in parallel:
Task: "Add oberon_split_intel_enabled to RoleConfig in src/types/role-config.ts"
Task: "Add oberon split intel fields to Game type in src/types/game.ts"
Task: "Update isValidRoleConfig type guard in src/types/role-config.ts"
```

---

## Parallel Example: Phase 7 Testing

```bash
# Launch all unit tests in parallel:
Task: "Create unit tests for canUseOberonSplitIntelMode() in tests/unit/domain/oberon-split-intel.test.ts"
Task: "Create unit tests for distributeOberonSplitIntelGroups() in tests/unit/domain/oberon-split-intel.test.ts"
Task: "Create unit tests for triple mutual exclusivity in tests/unit/domain/role-config.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration, types)
2. Complete Phase 2: Foundational (domain logic)
3. Complete Phase 3: User Story 1 (enable toggle)
4. **STOP and VALIDATE**: Test toggle enable/disable with different Oberon configurations
5. Deploy for early feedback on configuration UX

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test toggle → Deploy (Configuration MVP!)
3. Add User Story 2 → Test Merlin's view → Deploy (Core feature!)
4. Add User Story 3 → Test game end reveal → Deploy (Complete feature!)
5. Add User Story 4 → Verify Oberon experience → Deploy (Polish!)

### Single Developer Strategy

1. Complete Setup + Foundational (~30 min)
2. Complete US1 (toggle UI) (~30 min)
3. Complete US2 (Merlin's view) (~45 min)
4. Complete US3 (game end reveal) (~30 min)
5. Complete US4 (verification) (~15 min)
6. Complete Polish (tests) (~30 min)

**Total estimated time**: ~3 hours

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- Reuse UI patterns from Merlin Split Intel (011) for two-group display
- Oberon ID not stored separately - always findable from player_roles
- Triple mutual exclusivity: only ONE of Decoy, Split Intel, Oberon Split Intel can be active
- Prerequisite: Oberon Standard must be enabled; Oberon Chaos is incompatible
