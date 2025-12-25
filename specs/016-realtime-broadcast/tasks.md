# Tasks: Real-Time Broadcast Updates

**Input**: Design documents from `/specs/016-realtime-broadcast/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/broadcast-events.md

**Tests**: Not explicitly requested in specification. Manual E2E testing outlined in quickstart.md.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- All file paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create base broadcast module structure and types

- [x] T001 Create broadcast module directory at `src/lib/broadcast/`
- [x] T002 [P] Create TypeScript type definitions in `src/types/broadcast.ts` (BroadcastEventType, payload interfaces, BroadcastMessage union)
- [x] T003 [P] Create event type constants and helpers in `src/lib/broadcast/event-types.ts`
- [x] T004 [P] Create debounce utility in `src/lib/broadcast/debounce.ts` (50ms minimum between broadcasts)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core broadcast infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create server-side broadcaster base module in `src/lib/broadcast/broadcaster.ts` with `broadcastEvent()` function
- [x] T006 Create channel manager in `src/lib/broadcast/channel-manager.ts` (track active channels, 2-hour timeout)
- [x] T007 Create client-side subscription hook in `src/hooks/useBroadcastChannel.ts` (subscribe to game channel, handle events)
- [x] T008 Add connection event logging to `src/lib/broadcast/broadcaster.ts` (FR-015: log connect, disconnect, errors)
- [x] T009 Export all broadcast modules from `src/lib/broadcast/index.ts`

**Checkpoint**: Broadcast foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Instant Draft Team Visibility (Priority: P1) 🎯 MVP

**Goal**: When the leader selects players, all other players see the selection highlighted immediately (<200ms)

**Independent Test**: Leader selects player → other players see blue highlight within 200ms

### Implementation for User Story 1

- [x] T010 [US1] Add `broadcastDraftUpdate()` function to `src/lib/broadcast/broadcaster.ts`
- [x] T011 [US1] Modify `src/app/api/games/[gameId]/draft-team/route.ts` to call `broadcastDraftUpdate()` after successful DB write
- [x] T012 [US1] Add `draft_update` event handler to `src/hooks/useBroadcastChannel.ts`
- [x] T013 [US1] Integrate `useBroadcastChannel` into `src/hooks/useGameState.ts` with draft_update handler
- [x] T014 [US1] Update local state immediately on `draft_update` broadcast receive in `useGameState.ts`

**Checkpoint**: Draft team selection broadcasts working - other players see selections instantly

---

## Phase 4: User Story 2 - Real-Time Vote Status (Priority: P2)

**Goal**: During voting, players see "voted" badges appear immediately when others vote (<200ms)

**Independent Test**: Player submits vote → other players see "voted" badge within 200ms

### Implementation for User Story 2

- [x] T015 [US2] Add `broadcastVoteSubmitted()` function to `src/lib/broadcast/broadcaster.ts`
- [x] T016 [US2] Modify `src/app/api/games/[gameId]/vote/route.ts` to call `broadcastVoteSubmitted()` after successful vote record
- [x] T017 [US2] Add `vote_submitted` event handler to `src/hooks/useBroadcastChannel.ts`
- [x] T018 [US2] Update `useGameState.ts` to handle vote_submitted (update votes_submitted count, mark player as voted)

**Checkpoint**: Vote status broadcasts working - players see who voted instantly

---

## Phase 5: User Story 3 - Real-Time Quest Action Status (Priority: P2)

**Goal**: During quest phase, players see action submission progress update instantly (<200ms)

**Independent Test**: Team member submits action → all players see "X/Y actions submitted" update within 200ms

### Implementation for User Story 3

- [x] T019 [US3] Add `broadcastActionSubmitted()` function to `src/lib/broadcast/broadcaster.ts`
- [x] T020 [US3] Modify `src/app/api/games/[gameId]/quest/action/route.ts` to call `broadcastActionSubmitted()` after successful action record
- [x] T021 [US3] Add `action_submitted` event handler to `src/hooks/useBroadcastChannel.ts`
- [x] T022 [US3] Update `useGameState.ts` to handle action_submitted (update actions_submitted count)

**Checkpoint**: Quest action broadcasts working - players see progress instantly

---

## Phase 6: Phase Transitions & Game Over Broadcasts (Priority: P2)

**Goal**: All players transition between game phases simultaneously, game over is announced in real-time

**Independent Test**: When voting completes, all players move to quest phase simultaneously

### Implementation for Phase Transitions

- [x] T023 Add `broadcastPhaseTransition()` function to `src/lib/broadcast/broadcaster.ts`
- [x] T024 Add `broadcastGameOver()` function to `src/lib/broadcast/broadcaster.ts`
- [x] T025 Modify `src/app/api/games/[gameId]/vote/route.ts` to broadcast phase_transition on team approval/rejection
- [x] T026 Modify `src/app/api/games/[gameId]/quest/action/route.ts` to broadcast phase_transition and game_over as appropriate
- [x] T027 Modify `src/app/api/games/[gameId]/propose/route.ts` to broadcast phase_transition (team_building→voting)
- [x] T028 Modify `src/app/api/games/[gameId]/continue/route.ts` to broadcast phase_transition (quest_result→next phase)
- [x] T029 Add `phase_transition` and `game_over` event handlers to `src/hooks/useBroadcastChannel.ts`
- [x] T030 Update `useGameState.ts` to trigger immediate refetch on phase_transition/game_over broadcasts

**Checkpoint**: All phase changes broadcast - players stay synchronized

---

## Phase 7: User Story 4 - Graceful Degradation (Priority: P3)

**Goal**: If real-time connection fails, system falls back to polling seamlessly

**Independent Test**: Disconnect WebSocket → player still receives updates via polling within 3 seconds

### Implementation for User Story 4

- [x] T031 [US4] Add connection error handling to `src/hooks/useBroadcastChannel.ts` (log errors, don't block)
- [x] T032 [US4] Ensure `useGameState.ts` maintains polling regardless of broadcast connection status
- [x] T033 [US4] Add auto-reconnect logic to `useBroadcastChannel.ts` (Supabase handles this, ensure we don't interfere)
- [x] T034 [US4] Add debug logging for connection events (SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED)

**Checkpoint**: Fallback working - game playable even without real-time connection

---

## Phase 8: User Story 5 - Watcher Real-Time Updates (Priority: P3)

**Goal**: Watchers (spectators) also receive real-time updates for all game actions

**Independent Test**: Watcher observes game → sees draft selections, vote badges within 200ms

### Implementation for User Story 5

- [x] T035 [US5] Integrate `useBroadcastChannel` into `src/hooks/useWatcherState.ts`
- [x] T036 [US5] Add handlers for all broadcast events (draft_update, vote_submitted, action_submitted, phase_transition, game_over) in `useWatcherState.ts`
- [x] T037 [US5] Ensure watcher channel subscription uses same channel name format as players (`game:${gameId}`)

**Checkpoint**: Watchers receive broadcasts - same smooth experience as players

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [x] T038 [P] Add barrel export for broadcast types in `src/types/index.ts`
- [x] T039 [P] Verify debounce is applied consistently across all broadcast functions
- [x] T040 [P] Verify no sensitive information (vote values, action types, roles) in any broadcast payload
- [x] T041 [P] Run lint and type check on all new files
- [ ] T042 Manual E2E test: Leader selects player → verify other players see highlight <200ms
- [ ] T043 Manual E2E test: Player votes → verify "voted" badge appears on other screens <200ms
- [ ] T044 Manual E2E test: Disconnect network → verify polling fallback continues working
- [ ] T045 Manual E2E test: Watcher observes game → verify they see broadcasts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 (can run parallel with US1)
- **Phase 5 (US3)**: Depends on Phase 2 (can run parallel with US1, US2)
- **Phase 6 (Transitions)**: Depends on Phase 2 (can run parallel with US1-US3)
- **Phase 7 (US4)**: Depends on Phase 2 (can run parallel with others)
- **Phase 8 (US5)**: Depends on Phase 2 (can run after US1-US3 to verify handler patterns)
- **Phase 9 (Polish)**: Depends on all user stories

### User Story Dependencies

- **US1 (Draft)**: Independent - uses Phase 2 foundation only
- **US2 (Vote)**: Independent - uses Phase 2 foundation only
- **US3 (Quest)**: Independent - uses Phase 2 foundation only
- **US4 (Fallback)**: Enhances useBroadcastChannel - can run anytime after Phase 2
- **US5 (Watcher)**: Uses same patterns as US1-US3 - best done after seeing player implementation

### Within Each User Story

1. Broadcaster function first (server-side)
2. API route modification second (trigger broadcast)
3. Event handler in hook third (receive broadcast)
4. State update logic fourth (apply to UI)

### Parallel Opportunities per Phase

**Phase 1**: T002, T003, T004 can all run in parallel (different files)

**Phase 2**: Sequential (T005 → T006 → T007 → T008 → T009) - build on each other

**Phase 3-8**: Once Phase 2 is complete, US1, US2, US3, US4, US5 can all be worked in parallel by different developers

**Phase 9**: T038-T041 can run in parallel

---

## Parallel Example: After Foundation

```bash
# Once Phase 2 is complete, launch all user stories in parallel:

# Developer A: User Story 1 (Draft Team)
Task: T010 - Add broadcastDraftUpdate()
Task: T011 - Modify draft-team API route
Task: T012 - Add draft_update handler
Task: T013 - Integrate into useGameState
Task: T014 - Update state on receive

# Developer B: User Story 2 (Vote Status)
Task: T015 - Add broadcastVoteSubmitted()
Task: T016 - Modify vote API route
Task: T017 - Add vote_submitted handler
Task: T018 - Update state on receive

# Developer C: User Story 3 (Quest Action)
Task: T019 - Add broadcastActionSubmitted()
Task: T020 - Modify quest/action API route
Task: T021 - Add action_submitted handler
Task: T022 - Update state on receive
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundation (T005-T009)
3. Complete Phase 3: US1 Draft Team (T010-T014)
4. **STOP and VALIDATE**: Test draft selection broadcasts
5. Deploy/demo if ready - instant draft visibility working

### Incremental Delivery

1. Setup + Foundation → Broadcast infrastructure ready
2. Add US1 (Draft) → Test → Deploy (MVP: instant draft selection)
3. Add US2 (Vote) → Test → Deploy (instant vote status)
4. Add US3 (Quest) → Test → Deploy (instant quest progress)
5. Add Phase 6 (Transitions) → Test → Deploy (synchronized phase changes)
6. Add US4 (Fallback) → Test → Deploy (reliability)
7. Add US5 (Watcher) → Test → Deploy (complete feature)

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

This delivers the most impactful improvement (instant draft team visibility) with minimal implementation, allowing quick validation of the broadcast approach before expanding to other events.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- All broadcasts MUST happen AFTER successful DB write (FR-011)
- Never include vote values, action types, or role info in broadcasts (FR-008)
- Polling continues as fallback - never disable it
- Channel cleanup handled by Supabase automatically (no cleanup tasks needed)
- Commit after each task or logical group
- Test each user story independently before moving to next
