# Tasks: Merlin Split Intel Mode

**Input**: Design documents from `/specs/011-merlin-split-intel/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: Unit tests included as specified in plan.md for visibility combinations

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Database & Types)

**Purpose**: Schema ready, types defined - foundation for all user stories

- [ ] T001 Create migration `supabase/migrations/014_merlin_split_intel.sql` with three new columns: `split_intel_certain_evil_ids UUID[]`, `split_intel_mixed_evil_id UUID`, `split_intel_mixed_good_id UUID`
- [ ] T002 [P] Update `src/types/role-config.ts` to add `merlin_split_intel_enabled?: boolean` to RoleConfig interface
- [ ] T003 [P] Update `src/types/game.ts` to add split intel fields: `split_intel_certain_evil_ids`, `split_intel_mixed_evil_id`, `split_intel_mixed_good_id`
- [ ] T004 [P] Add `SplitIntelGroups` and `SplitIntelVisibility` interfaces to `src/types/game.ts`
- [ ] T005 Update `src/types/database.ts` to include new game table columns if type generation is manual

**Checkpoint**: Database schema ready, TypeScript compiles with new types

---

## Phase 2: Foundational (Domain Logic & API)

**Purpose**: Core logic that MUST be complete before UI work can begin

**⚠️ CRITICAL**: No UI tasks can begin until this phase is complete

### Domain Logic

- [ ] T006 Create `src/lib/domain/split-intel.ts` with `SplitIntelGroups` interface and `distributeSplitIntelGroups()` function
- [ ] T007 Add `canUseSplitIntelMode()` function to `src/lib/domain/split-intel.ts` that checks visible evil count and returns viability
- [ ] T008 Add `getSplitIntelVisibility()` function to `src/lib/domain/visibility.ts` that returns two-group visibility result
- [ ] T009 Update `src/lib/domain/role-config.ts` to add validation for `merlin_split_intel_enabled` and mutual exclusivity check with `merlin_decoy_enabled`

### API Updates

- [ ] T010 Update `src/app/api/rooms/[code]/distribute/route.ts` to check `merlin_split_intel_enabled`, block if 0 visible evil, call `distributeSplitIntelGroups()`, and store group IDs in games table
- [ ] T011 Update `src/app/api/rooms/[code]/role/route.ts` to return `split_intel` object with two groups for Merlin when split intel is enabled
- [ ] T012 Update `src/app/api/games/[gameId]/route.ts` to include split intel fields in response and add `was_mixed_group` flag to player list

### Supabase Data Layer

- [ ] T013 [P] Update `src/lib/supabase/games.ts` to handle split intel fields when creating/fetching games
- [ ] T014 [P] Update `src/lib/supabase/roles.ts` to persist group selections during role distribution

### Unit Tests (Domain Logic)

- [ ] T015 [P] Create `tests/unit/domain/split-intel.test.ts` with tests for `distributeSplitIntelGroups()` covering: 1 visible evil, 2 visible evil, 3+ visible evil, 0 visible evil returns null
- [ ] T016 [P] Add tests to `tests/unit/domain/visibility.test.ts` for `getSplitIntelVisibility()` covering all Mordred/Oberon combinations

**Checkpoint**: Foundation ready - all domain logic and APIs work, user story implementation can begin

---

## Phase 3: User Story 1 - Enable Split Intel Mode (Priority: P1) 🎯 MVP

**Goal**: Room managers can enable Merlin Split Intel Mode and see it in lobby settings

**Independent Test**: Create a room, toggle Split Intel Mode on, verify it appears in "Roles in Play" and cannot be enabled alongside Decoy Mode

### Implementation for User Story 1

- [ ] T017 [US1] Update `src/components/RoleConfigPanel.tsx` to add "Merlin Split Intel Mode" toggle with description: "Merlin sees two groups: certain evil players, and a mixed group with one evil and one good player"
- [ ] T018 [US1] Implement mutual exclusivity in `src/components/RoleConfigPanel.tsx`: when Split Intel is enabled, disable Decoy toggle (and vice versa) with tooltip explaining only one mode can be active
- [ ] T019 [US1] Add warning in `src/components/RoleConfigPanel.tsx` when enabling Split Intel with Mordred + Oberon Chaos (potential 0 visible evil configuration)
- [ ] T020 [US1] Update `src/components/RolesInPlay.tsx` to show "🔀 Split Intel" indicator when `merlin_split_intel_enabled` is true
- [ ] T021 [US1] Verify room creation API correctly persists `merlin_split_intel_enabled` in role_config

**Checkpoint**: Room managers can enable Split Intel Mode, mutual exclusivity works, lobby shows indicator

---

## Phase 4: User Story 2 - Merlin Sees Two Groups (Priority: P1)

**Goal**: Merlin's role reveal displays two visually distinct groups with correct labeling

**Independent Test**: Start a game with Split Intel enabled, verify Merlin sees Certain Evil (red) and Mixed Intel (amber) groups with correct labels and player counts

### Implementation for User Story 2

- [ ] T022 [US2] Update `src/components/RoleRevealModal.tsx` to detect `split_intel` in role data and conditionally render two-group display
- [ ] T023 [US2] Create Certain Evil group section in `src/components/RoleRevealModal.tsx` with red/dark styling, 🎯 icon, and label "These players are definitely evil"
- [ ] T024 [US2] Create Mixed Intel group section in `src/components/RoleRevealModal.tsx` with amber/yellow styling, ❓ icon, and label "One is evil, one is good - you don't know which"
- [ ] T025 [US2] Add hidden evil warning display in `src/components/RoleRevealModal.tsx` when `hidden_count > 0` (e.g., "1 evil player is hidden from you")
- [ ] T026 [US2] Handle edge case in `src/components/RoleRevealModal.tsx` where Certain Evil group is empty (only 1 visible evil) - show only Mixed Intel group
- [ ] T027 [US2] Ensure ability note in `src/components/RoleRevealModal.tsx` is updated for Split Intel: "You see players divided into two groups with different certainty levels"

**Checkpoint**: Merlin sees correctly formatted two-group display with all visual requirements

---

## Phase 5: User Story 3 - Mixed Group Player Experience (Priority: P1)

**Goal**: Mixed group player has normal experience during game; all players see reveal at game end

**Independent Test**: Play game as good player in mixed group - verify no indication during game; verify game over shows "🔀 Mixed Group" indicator

### Implementation for User Story 3

- [ ] T028 [US3] Verify no changes needed to non-Merlin role reveals in `src/components/RoleRevealModal.tsx` - mixed group player sees normal role (no task if already correct)
- [ ] T029 [US3] Update `src/components/game/GameOver.tsx` to show "🔀 Mixed Group" badge next to player who was in mixed group when `split_intel_mixed_good_id` or `split_intel_mixed_evil_id` matches player ID
- [ ] T030 [US3] Style the "🔀 Mixed Group" indicator in `src/components/game/GameOver.tsx` to be clear but not distracting (consistent with "🎭 Decoy" indicator from Feature 009)
- [ ] T031 [US3] Ensure mixed group reveal only appears when game had `merlin_split_intel_enabled` in role config

**Checkpoint**: Mixed group player has normal game experience; game over reveals mixed group composition

---

## Phase 6: User Story 4 - Group Selection Algorithm (Priority: P2)

**Goal**: Groups are formed fairly with correct distribution based on visible evil count

**Independent Test**: Run multiple games with various role configurations, verify group sizes match algorithm (2 certain + 1 mixed for 3+ evil, 1 certain + 1 mixed for 2 evil, 0 certain + 1 mixed for 1 evil)

### Implementation for User Story 4

- [ ] T032 [US4] Verify `distributeSplitIntelGroups()` in `src/lib/domain/split-intel.ts` correctly excludes Mordred and Oberon Chaos from visible evil count
- [ ] T033 [US4] Verify `distributeSplitIntelGroups()` correctly assigns: 2 to Certain + 1 to Mixed when 3+ visible evil
- [ ] T034 [US4] Verify `distributeSplitIntelGroups()` correctly assigns: 1 to Certain + 1 to Mixed when 2 visible evil
- [ ] T035 [US4] Verify `distributeSplitIntelGroups()` correctly assigns: 0 to Certain + 1 to Mixed when 1 visible evil
- [ ] T036 [US4] Verify `distributeSplitIntelGroups()` returns null when 0 visible evil (blocked configuration)
- [ ] T037 [US4] Verify good player selection in `distributeSplitIntelGroups()` excludes Merlin from eligible pool
- [ ] T038 [US4] Add additional unit tests to `tests/unit/domain/split-intel.test.ts` for edge cases: 5-player with Mordred, 7-player with Mordred + Oberon Chaos

**Checkpoint**: Algorithm correctly distributes players to groups for all configurations

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, edge cases, and final validation

- [ ] T039 Verify error message in distribute API is clear when Split Intel blocked: "Cannot use Split Intel Mode with current role configuration. All evil players are hidden from Merlin (Mordred + Oberon Chaos). Please disable Split Intel Mode or change role selection."
- [ ] T040 [P] Mobile responsiveness check for two-group display in `src/components/RoleRevealModal.tsx`
- [ ] T041 [P] Mobile responsiveness check for Split Intel toggle in `src/components/RoleConfigPanel.tsx`
- [ ] T042 Run full integration test: Enable split intel → Distribute → Verify Merlin sees two groups → Complete game → Verify game over reveals mixed group
- [ ] T043 Run integration test: Enable Split Intel + Mordred + Oberon Chaos → Attempt distribute → Verify game start blocked with error
- [ ] T044 Run integration test: Enable Split Intel → Then try to enable Decoy → Verify mutual exclusivity prevents both being enabled
- [ ] T045 Verify Lady of the Lake investigations show true alignment regardless of split intel group membership (existing behavior should be correct)
- [ ] T046 Run quickstart.md validation scenarios to confirm feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed) or sequentially by priority
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Mostly verification of Phase 2 domain logic

### Within Each Phase

- T002, T003, T004 can run in parallel (different files)
- T013, T014 can run in parallel (different files)
- T015, T016 can run in parallel (test files)
- T040, T041 can run in parallel (different components)

---

## Parallel Example: Phase 1 (Setup)

```bash
# All type updates can run in parallel:
Task T002: "Update src/types/role-config.ts"
Task T003: "Update src/types/game.ts (split intel fields)"
Task T004: "Add SplitIntelGroups and SplitIntelVisibility interfaces"

# Migration must complete first (T001), then type updates
```

## Parallel Example: Foundational Phase

```bash
# Domain logic tasks after T006 creates the file:
Task T006: "Create src/lib/domain/split-intel.ts" (first)
Task T007: "Add canUseSplitIntelMode()" (after T006)

# These can run in parallel (different files):
Task T013: "Update src/lib/supabase/games.ts"
Task T014: "Update src/lib/supabase/roles.ts"
Task T015: "Create tests/unit/domain/split-intel.test.ts"
Task T016: "Add tests to tests/unit/domain/visibility.test.ts"
```

## Parallel Example: User Stories After Foundation

```bash
# Once Foundational is complete, different team members can work on:
Developer A: User Story 1 (T017-T021) - Configuration UI
Developer B: User Story 2 (T022-T027) - Merlin Role Reveal
Developer C: User Story 3 (T028-T031) - Game Over Display
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Minimal)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Configuration)
4. Complete Phase 4: User Story 2 (Merlin Display)
5. **STOP and VALIDATE**: Test Split Intel Mode end-to-end
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Configuration works → Deploy
3. User Story 2 → Merlin sees groups → Deploy
4. User Story 3 → Game over reveal → Deploy
5. User Story 4 → Algorithm verified → Deploy
6. Polish → Feature complete

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Phase 1: Setup | T001-T005 (5 tasks) | T002, T003, T004 |
| Phase 2: Foundational | T006-T016 (11 tasks) | T013-T016 |
| Phase 3: US1 Config | T017-T021 (5 tasks) | None (same component) |
| Phase 4: US2 Merlin Display | T022-T027 (6 tasks) | None (same component) |
| Phase 5: US3 Game Over | T028-T031 (4 tasks) | None (same component) |
| Phase 6: US4 Algorithm | T032-T038 (7 tasks) | T032-T038 (verification) |
| Phase 7: Polish | T039-T046 (8 tasks) | T040, T041 |
| **Total** | **46 tasks** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
