# Tasks: Room Game-Over Cleanup

**Input**: Design documents from `/specs/017-room-game-over-cleanup/`
**Prerequisites**: plan.md, spec.md, research.md

**Tests**: Not requested - manual E2E testing per quickstart.md

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- All file paths are relative to repository root

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Update room state machine to allow `started` → `closed` transition

**⚠️ CRITICAL**: User story implementation requires this phase complete

- [x] T001 Update STATE_TRANSITIONS in `src/lib/domain/room-state.ts` to allow `started` → `closed` transition

**Checkpoint**: Room state machine now accepts the new transition

---

## Phase 2: User Story 1 - Clean Room List After Game Ends (Priority: P1) 🎯

**Goal**: Automatically close rooms when games end so finished rooms don't appear in browse list

**Independent Test**: Play a game to completion, verify room disappears from "Browse Active Rooms"

### Implementation for User Story 1

- [x] T002 [US1] Update `endGame()` function in `src/lib/supabase/games.ts` to close room after setting game_over phase
- [x] T003 [P] [US1] Update `src/app/api/games/[gameId]/quest/action/route.ts` to close room when game ends via quest victory/loss
- [x] T004 [P] [US1] Update `src/app/api/games/[gameId]/assassin-guess/route.ts` to close room when game ends via assassin guess

**Checkpoint**: All three game-end paths now close the room automatically

---

## Phase 3: User Story 2 - Game History Preserved (Priority: P2)

**Goal**: Ensure game data remains accessible after room is closed

**Independent Test**: Navigate to a finished game via direct URL, verify all game data is visible

### Implementation for User Story 2

- [x] T005 [US2] Verify that existing game state queries work for closed rooms (no code changes expected)

**Note**: This story validates existing behavior. Room closure only changes `status` - all game data (quests, votes, roles) is preserved by default.

**Checkpoint**: Game history is accessible for closed rooms

---

## Phase 4: Polish & Verification

**Purpose**: Validate the complete implementation

- [x] T006 Run lint and type check on modified files
- [ ] T007 Manual E2E test: Play game to completion via quests → verify room removed from browse list
- [ ] T008 Manual E2E test: Play game to 5 rejections → verify room removed from browse list
- [ ] T009 Manual E2E test: Direct URL to finished game → verify game over screen displays correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies - start immediately, BLOCKS all user stories
- **Phase 2 (US1)**: Depends on Phase 1 completion
- **Phase 3 (US2)**: Depends on Phase 1 completion (can run parallel with US1)
- **Phase 4 (Polish)**: Depends on Phase 2 completion

### Within User Story 1

1. T002 first (adds helper function used by others)
2. T003, T004 in parallel (different API routes)

### Parallel Opportunities

**Phase 2 (US1)**: T003 and T004 can run in parallel - different files, no dependencies

```bash
# After T002 completes, launch these in parallel:
Task: T003 - Update quest/action route
Task: T004 - Update assassin-guess route
```

---

## Implementation Strategy

### MVP (Phases 1-2 Only)

1. Complete Phase 1: Update state machine
2. Complete Phase 2: Add room closure to all game-end paths
3. **VALIDATE**: Play a game to completion, check browse list
4. Deploy

### Total Scope

- **9 tasks total**
- **4 files to modify**
- **No new files**
- **No database changes**

### Estimated Effort

This is a small, focused bug fix:
- Phase 1: ~5 minutes (one line change)
- Phase 2: ~15 minutes (3 files, simple additions)
- Phase 3: ~5 minutes (verification only)
- Phase 4: ~15 minutes (manual testing)
- **Total: ~40 minutes**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- T002 must complete before T003/T004 (they import the helper)
- Room closure is idempotent - safe to call multiple times
- Existing 48h cleanup job handles legacy finished rooms
