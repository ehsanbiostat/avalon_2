# Tasks: Watcher Mode

**Input**: Design documents from `/specs/015-watcher-mode/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/
**Tests**: Not requested (manual browser testing per project patterns)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create TypeScript types and project structure for watcher feature

- [x] T001 Create watcher TypeScript types in `src/types/watcher.ts`
- [x] T002 Create watcher session module in `src/lib/domain/watcher-session.ts`

**Checkpoint**: Types and session module ready for API development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core watcher session management that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `addWatcher` function in `src/lib/domain/watcher-session.ts`
- [x] T004 Implement `removeWatcher` function in `src/lib/domain/watcher-session.ts`
- [x] T005 Implement `getWatcherCount` and `isWatcherLimitReached` in `src/lib/domain/watcher-session.ts`
- [x] T006 Implement `updateWatcherLastSeen` for timeout tracking in `src/lib/domain/watcher-session.ts`
- [x] T007 Implement `cleanupStaleWatchers` (30-second timeout) in `src/lib/domain/watcher-session.ts`
- [x] T008 Implement `isWatcher` validation function in `src/lib/domain/watcher-session.ts`

**Checkpoint**: Foundation ready - all watcher session functions tested and working

---

## Phase 3: User Story 1 + 2 - Join and View as Watcher (Priority: P1) 🎯 MVP

**Goal**: Users can join a game as a watcher and see the neutral observer game state

**Independent Test**: Enter room code → click Watch → see live game with disabled controls

> **Note**: US1 (Join) and US2 (View) are combined because they are both P1 MVP and inseparable - you cannot test viewing without joining first.

### Implementation for User Story 1 + 2

- [x] T009 [P] [US1] Create API directory structure `src/app/api/watch/[gameId]/`
- [x] T010 [US1] Create join endpoint `src/app/api/watch/[gameId]/join/route.ts`
- [x] T011 [US2] Create watcher game state endpoint `src/app/api/watch/[gameId]/route.ts`
- [x] T012 [US2] Implement `buildWatcherGameState` helper function in `src/lib/domain/watcher-game-state.ts`
- [x] T013 [US2] Create `useWatcherState` hook in `src/hooks/useWatcherState.ts`
- [x] T014 [US1] Created `WatcherGameBoard` component (separate read-only view instead of modifying GameBoard)
- [x] T015 [US1] Create watcher view page `src/app/watch/[gameId]/page.tsx`
- [x] T016 [US2] Verify watcher sees correct neutral observer state (no roles, no hidden votes)

**Checkpoint**: US1 + US2 complete - users can watch games with neutral observer view

---

## Phase 4: User Story 3 - Watcher Lifecycle (Priority: P2)

**Goal**: Watchers can leave, rejoin, and see game over screen

**Independent Test**: Watch game → click Stop Watching → rejoin → see current state → game ends → see roles

### Implementation for User Story 3

- [x] T017 [US3] Create leave endpoint `src/app/api/watch/[gameId]/leave/route.ts`
- [x] T018 [US3] Add "Stop Watching" button to watcher view (in WatcherGameBoard component)
- [x] T019 [US3] Handle game over state in watcher view (WatcherGameOverView in WatcherGameBoard)
- [x] T020 [US3] Verify rejoin shows current state only (design ensures this - each poll returns current snapshot)

**Checkpoint**: US3 complete - watchers can manage their watching session

---

## Phase 5: User Story 4 - Watcher Entry Flow (Priority: P2)

**Goal**: Users see clear "Watch" option on home page when entering room code

**Independent Test**: Enter room code → see "Join Room" and "Watch Game" options → Watch disabled if game not started

### Implementation for User Story 4

- [x] T021 [US4] Create watch status endpoint `src/app/api/rooms/[code]/watch-status/route.ts`
- [x] T022 [US4] Modify home page to check room watch status in `src/app/page.tsx`
- [x] T023 [US4] Add "Watch Game" button with conditional enable/disable in `src/app/page.tsx`
- [x] T024 [US4] Handle error states (game not started, limit reached) in home page UI

**Checkpoint**: US4 complete - clear entry flow for watchers

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and edge cases

- [x] T025 [P] Verify 10-watcher limit is enforced correctly (implemented in addWatcher with MAX_WATCHERS_PER_GAME check)
- [x] T026 [P] Verify watcher timeout cleanup works (30 seconds) (implemented in cleanupStaleWatchers)
- [x] T027 [P] Verify zero database writes for watcher operations (code review confirms all watcher APIs are READ ONLY)
- [ ] T028 [P] Test responsive design on mobile for watcher view (manual testing required)
- [ ] T029 Run quickstart.md manual testing checklist (manual testing required)
- [ ] T030 Verify player API response times unchanged with watchers present (manual testing required)
- [x] T031 [P] Verify room-scoped state: user can watch Room A and join Room B as player simultaneously (design ensures this - in-memory Map keyed by gameId)
- [x] T032 [P] Verify FR-016/FR-017: watcher state does not persist outside room context (design ensures this - in-memory only, no database)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on T001, T002 - BLOCKS all user stories
- **Phase 3 (US1+US2)**: Depends on Phase 2 completion - MVP
- **Phase 4 (US3)**: Depends on Phase 3 (needs watcher view to add Stop button)
- **Phase 5 (US4)**: Depends on Phase 2 only (home page can be built independently of watcher view)
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1+2 (P1)**: Depends on Foundational - Core MVP
- **User Story 3 (P2)**: Depends on US1+2 (needs watcher view)
- **User Story 4 (P2)**: Can start after Foundational - Independent of US1+2

### Parallel Opportunities

Within Phase 2 (Foundational):
- T003, T004, T005, T006, T007, T008 MUST be sequential (same file, interdependent)

Within Phase 3 (US1+US2):
- T009 can run first (creates directory)
- T010, T011, T012 can run in parallel after T009 (different files)
- T013 depends on T011 (uses the API endpoint)
- T014 can run in parallel with T010-T013 (different file)
- T015 depends on T013, T014 (uses hook and GameBoard)

Within Phase 5 (US4):
- T021 and T022/T023/T024 can run in parallel (API vs UI)

Within Phase 6 (Polish):
- T025, T026, T027, T028 can ALL run in parallel (independent checks)

---

## Parallel Example: Phase 3 Kickoff

```bash
# After Phase 2 completes, launch these in parallel:
Task T009: "Create API directory structure src/app/api/watch/[gameId]/"
Task T014: "Modify GameBoard.tsx to accept isWatcher prop"

# Then these in parallel:
Task T010: "Create join endpoint src/app/api/watch/[gameId]/join/route.ts"
Task T011: "Create watcher game state endpoint src/app/api/watch/[gameId]/route.ts"
Task T012: "Implement buildWatcherGameState helper function"
```

---

## Implementation Strategy

### MVP First (User Stories 1+2 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T008)
3. Complete Phase 3: User Story 1+2 (T009-T016)
4. **STOP and VALIDATE**: Test watching a game with disabled controls
5. Deploy/demo if ready - users can watch games!

### Incremental Delivery

1. Setup + Foundational → Session management ready
2. Add US1+US2 → Watchers can join and view (MVP!)
3. Add US3 → Watchers can leave/rejoin properly
4. Add US4 → Clean entry flow from home page
5. Polish → Final validation

### Quick Win Order

```
T001 → T002 → T003-T008 → T010 → T011 → T012 → T013 → T014 → T015 → DEMO!
```

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 32 |
| Phase 1 (Setup) | 2 tasks |
| Phase 2 (Foundational) | 6 tasks |
| Phase 3 (US1+US2 - MVP) | 8 tasks |
| Phase 4 (US3) | 4 tasks |
| Phase 5 (US4) | 4 tasks |
| Phase 6 (Polish) | 8 tasks |
| Parallel Opportunities | 12+ |
| MVP Scope | T001-T016 (16 tasks) |

---

## Notes

- No database migrations required (in-memory storage only)
- Watcher session functions in single file for code isolation
- GameBoard modification is additive (isWatcher prop, defaults to false)
- Reuse existing game state fetching logic but strip player-specific fields
- All watcher API endpoints are completely separate from player endpoints
- Critical: Verify SC-008 to SC-013 (performance & isolation) in Phase 6
