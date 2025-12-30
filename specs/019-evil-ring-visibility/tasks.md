# Tasks: Evil Ring Visibility Mode

**Input**: Design documents from `/specs/019-evil-ring-visibility/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: Unit tests for ring formation logic (per plan.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema and type definitions

- [ ] T001 Create database migration for evil_ring_assignments column in `supabase/migrations/019_evil_ring_visibility.sql`
- [ ] T002 [P] Add `evil_ring_visibility_enabled` field to RoleConfig interface in `src/types/role-config.ts`
- [ ] T003 [P] Add EvilRingVisibility types and interfaces to `src/types/game.ts`
- [ ] T004 [P] Update DEFAULT_ROLE_CONFIG with evil_ring_visibility_enabled: false in `src/types/role-config.ts`
- [ ] T005 [P] Add type guard isValidRoleConfig check for evil_ring_visibility_enabled in `src/types/role-config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain logic that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create `src/lib/domain/evil-ring-visibility.ts` with exports placeholder
- [ ] T007 Implement `canEnableEvilRingVisibility(playerCount, oberon)` function in `src/lib/domain/evil-ring-visibility.ts`
- [ ] T008 Implement `calculateNonOberonEvilCount(playerCount, oberon)` helper in `src/lib/domain/evil-ring-visibility.ts`
- [ ] T009 Implement `formEvilRing(evilPlayerIds)` ring formation algorithm in `src/lib/domain/evil-ring-visibility.ts`
- [ ] T010 Implement `getKnownTeammate(playerId, ringAssignments)` lookup function in `src/lib/domain/evil-ring-visibility.ts`
- [ ] T011 Implement `calculateHiddenCount(ringSize, hasOberon)` counter in `src/lib/domain/evil-ring-visibility.ts`
- [ ] T012 Add Game type fields for evil_ring_assignments in `src/lib/supabase/games.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Enable Evil Ring Visibility Mode (Priority: P1) 🎯 MVP

**Goal**: Room manager can enable/disable Evil Ring Visibility Mode with prerequisite validation

**Independent Test**: Create room with 7+ players → Toggle is enabled. Create room with 5 players → Toggle is disabled with tooltip.

### Implementation for User Story 1

- [ ] T013 [US1] Add prerequisite validation in `src/lib/domain/role-config.ts` - check 3+ non-Oberon evil
- [ ] T014 [US1] Add auto-disable logic when Oberon enables and invalidates ring mode in `src/lib/domain/role-config.ts`
- [ ] T015 [US1] Add Evil Ring Visibility toggle to `src/components/RoleConfigPanel.tsx` with disabled state logic and config summary display (FR-001, FR-004)
- [ ] T016 [US1] Add tooltip for disabled state explaining prerequisite in `src/components/RoleConfigPanel.tsx`
- [ ] T017 [US1] Add auto-disable notification when Oberon/player count changes in `src/components/RoleConfigPanel.tsx`
- [ ] T018 [US1] Add Evil Ring Visibility indicator to `src/components/RolesInPlay.tsx`
- [ ] T019 [US1] Add toggle description: "Evil players only know one teammate each (chain pattern)" in `src/components/RoleConfigPanel.tsx`

**Checkpoint**: Room manager can configure Evil Ring Visibility Mode with all prerequisite validations

---

## Phase 4: User Story 2 - Evil Player Sees One Teammate (Priority: P1)

**Goal**: Evil players see exactly one teammate's name (not role) in role reveal when ring mode is active

**Independent Test**: Distribute roles with ring mode enabled → Evil player sees exactly one name (e.g., "Alice is Evil")

### Implementation for User Story 2

- [ ] T020 [US2] Implement `getEvilRingVisibility()` in `src/lib/domain/visibility.ts` that returns ring visibility for evil player
- [ ] T021 [US2] Add ring formation during role distribution in `src/app/api/rooms/[code]/distribute/route.ts`
- [ ] T022 [US2] Store evil_ring_assignments in database during distribution in `src/app/api/rooms/[code]/distribute/route.ts`
- [ ] T023 [US2] Return ring visibility data in `/api/rooms/[code]/role` endpoint in `src/app/api/rooms/[code]/role/route.ts`
- [ ] T024 [US2] Add ring visibility display section to `src/components/RoleRevealModal.tsx` for evil players
- [ ] T025 [US2] Display known teammate as "Name is Evil" (not role) in `src/components/RoleRevealModal.tsx`
- [ ] T026 [US2] Display explanation message: "Ring Visibility Mode: You only know one teammate." in `src/components/RoleRevealModal.tsx`
- [ ] T027 [US2] Display hidden count: "X other evil player(s) are hidden from you" in `src/components/RoleRevealModal.tsx`

**Checkpoint**: Evil players see correct ring visibility in role reveal

---

## Phase 5: User Story 3 - Oberon Remains Isolated (Priority: P1)

**Goal**: Oberon is completely excluded from the ring and sees no teammates

**Independent Test**: With ring mode enabled and Oberon in game → Oberon sees no teammates, ring forms without Oberon

### Implementation for User Story 3

- [ ] T028 [US3] Filter out Oberon (standard and chaos) from ring formation in `src/lib/domain/evil-ring-visibility.ts`
- [ ] T029 [US3] Ensure Oberon excluded from ring in distribute route in `src/app/api/rooms/[code]/distribute/route.ts`
- [ ] T030 [US3] Include Oberon in hidden count for ring members in `src/lib/domain/evil-ring-visibility.ts`
- [ ] T031 [US3] Verify Oberon visibility unchanged (sees nothing) in `src/lib/domain/visibility.ts`

**Checkpoint**: Oberon behavior is unchanged, properly excluded from ring

---

## Phase 6: User Story 4 - Ring Assignment Persists (Priority: P2)

**Goal**: Ring assignments remain consistent for entire game duration

**Independent Test**: View role reveal multiple times during game → Same teammate shown each time

### Implementation for User Story 4

- [ ] T032 [US4] Verify ring assignments loaded from database (not regenerated) in `src/app/api/rooms/[code]/role/route.ts`
- [ ] T033 [US4] Ensure game end reveals all roles normally (not just ring structure) in `src/components/game/GameOver.tsx`

**Checkpoint**: Ring assignments persist correctly throughout game

---

## Phase 7: User Story 5 - Watcher Experience (Priority: P2)

**Goal**: Watchers see no evil team information until game ends

**Independent Test**: Watch active game with ring mode → No evil info shown until game over

### Implementation for User Story 5

- [ ] T034 [US5] Verify watcher game state excludes ring information in `src/lib/domain/watcher-game-state.ts`
- [ ] T035 [US5] Ensure game end shows all roles to watchers normally in `src/components/game/WatcherGameBoard.tsx`

**Checkpoint**: Watcher experience properly maintains neutrality

---

## Phase 8: Testing & Polish

**Purpose**: Unit tests and validation

- [ ] T036 [P] Create unit test file `tests/unit/domain/evil-ring-visibility.test.ts`
- [ ] T037 [P] Test `canEnableEvilRingVisibility()` with various player counts in `tests/unit/domain/evil-ring-visibility.test.ts`
- [ ] T038 [P] Test `formEvilRing()` creates valid circular chain in `tests/unit/domain/evil-ring-visibility.test.ts`
- [ ] T039 [P] Test ring excludes Oberon correctly in `tests/unit/domain/evil-ring-visibility.test.ts`
- [ ] T040 [P] Test `calculateHiddenCount()` includes Oberon in `tests/unit/domain/evil-ring-visibility.test.ts`
- [ ] T041 Run quickstart.md validation scenarios
- [ ] T042 Verify mode compatibility: (1) Ring + Merlin Split Intel @ 8 players, (2) Ring + Oberon Split Intel @ 10 players, (3) Ring + Decoy @ 7 players

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Toggle) can start first
  - US2 (Role Reveal) depends on ring formation logic from US1
  - US3 (Oberon) can parallel with US2
  - US4 (Persistence) depends on US2 completion
  - US5 (Watcher) can parallel with US4
- **Testing (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Toggle) | Foundational | None (start first) |
| US2 (Role Reveal) | US1 (needs ring config) | US3 |
| US3 (Oberon) | Foundational | US2 |
| US4 (Persistence) | US2 | US5 |
| US5 (Watcher) | Foundational | US4 |

### Within Each User Story

- Type definitions before domain logic
- Domain logic before API changes
- API changes before UI components
- Core implementation before edge cases

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# Can run in parallel:
- T002: role-config.ts types
- T003: game.ts types
- T004: DEFAULT_ROLE_CONFIG
- T005: type guard
```

**Phase 2 (Foundational)**:
```bash
# Sequential dependency:
T006 → T007 → T008 → T009 → T010 → T011 → T012
```

**Phase 3-7 (User Stories)**:
```bash
# After US1 completes, US2 and US3 can run in parallel:
US1 → (US2 || US3) → (US4 || US5) → Phase 8
```

**Phase 8 (Testing)**:
```bash
# All test tasks can run in parallel:
- T036-T040: All unit tests
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup (database + types)
2. Complete Phase 2: Foundational (ring formation logic)
3. Complete Phase 3: User Story 1 (toggle configuration)
4. Complete Phase 4: User Story 2 (role reveal display)
5. **STOP and VALIDATE**: Evil players see one teammate in ring mode
6. Deploy/demo if ready

### Full Feature

1. MVP (above) + US3 (Oberon isolation)
2. Add US4 (persistence verification)
3. Add US5 (watcher experience)
4. Complete Phase 8 (testing & polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Ring assignments stored as JSONB in games table (matches split intel pattern)
- Ring visibility returns name only (not role) per spec clarification
- Hidden count includes Oberon per spec clarification
- Mode is compatible with all existing Merlin visibility modes
