# Tasks: Real-Time Team Selection Visibility

**Feature**: 007-realtime-team-selection  
**Branch**: `007-realtime-team-selection`  
**Input**: Design documents from `/specs/007-realtime-team-selection/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

**Tests**: Not explicitly requested in specification - omitted per constitution guidelines.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Path Conventions

This project uses Next.js full-stack architecture:
- **Frontend/Backend**: `src/` at repository root (Next.js App Router)
- **Database migrations**: `supabase/migrations/`
- **Components**: `src/components/game/`
- **API routes**: `src/app/api/games/[gameId]/`
- **Types**: `src/types/`
- **Domain logic**: `src/lib/domain/`
- **Database layer**: `src/lib/supabase/`
- **Client API**: `src/lib/api/`
- **Hooks**: `src/hooks/`

---

## User Story Summary

| Story | Priority | Goal | Tasks |
|-------|----------|------|-------|
| **Foundational** | - | Database, types, domain logic | 7 tasks |
| **US1** | P1 🎯 | Real-time visibility for all players | 7 tasks |
| **US2** | P1 🎯 | Visual distinction for selection states | 4 tasks |
| **US3** | P2 | Leader feedback (optimistic UI) | 3 tasks |
| **US4** | P2 | Performance and responsiveness | 5 tasks |
| **Polish** | - | Edge cases, documentation | 3 tasks |

**Total**: 29 tasks

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new infrastructure needed - using existing Next.js/Supabase setup

**Status**: ✅ No tasks required (existing project infrastructure)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, TypeScript types, and domain logic that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Schema

- [ ] T001 Create migration file `supabase/migrations/011_draft_team_selection.sql` with ALTER TABLE to add draft_team column
- [ ] T002 Add column comment documenting draft_team lifecycle in migration file
- [ ] T003 Apply migration 011 to local Supabase database for testing

### TypeScript Types

- [ ] T004 [P] Add `draft_team: string[] | null` to Game interface in `src/types/game.ts`
- [ ] T005 [P] Add `draft_team?: string[] | null` to GameUpdate interface in `src/types/game.ts`
- [ ] T006 [P] Add `draft_team: string[] | null` and `is_draft_in_progress: boolean` to GameState interface in `src/types/game.ts`
- [ ] T007 [P] Create UpdateDraftTeamRequest, UpdateDraftTeamResponse, and DraftValidationResult interfaces in `src/types/game.ts`

### Domain Logic

- [ ] T008 [P] Create `src/lib/domain/team-selection.ts` with validateDraftSelection function
- [ ] T009 [P] Implement isDraftInProgress helper function in `src/lib/domain/team-selection.ts`
- [ ] T010 [P] Implement normalizeDraftTeam function in `src/lib/domain/team-selection.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Real-Time Selection Visibility (Priority: P1) 🎯 MVP

**Goal**: Enable all players to see the leader's team selection process in real-time as they click on players

**Independent Test**: 
1. Leader (Browser 1) selects players during team_building phase
2. Observer (Browser 2) sees selections appear within 3 seconds
3. Leader deselects a player
4. Observer sees deselection within 3 seconds
5. Selection count updates for all players

### Database Layer

- [ ] T011 [P] [US1] Add updateDraftTeam function in `src/lib/supabase/games.ts`
- [ ] T012 [P] [US1] Add clearDraftTeam function in `src/lib/supabase/games.ts`
- [ ] T013 [US1] Modify getGameById in `src/lib/supabase/games.ts` to include draft_team in SELECT query

### API Endpoints

- [ ] T014 [US1] Create `src/app/api/games/[gameId]/draft-team/route.ts` with PUT handler
- [ ] T015 [US1] Implement validation in PUT /draft-team: check phase, verify leader, validate team using domain logic
- [ ] T016 [US1] Add error handling for NOT_LEADER, INVALID_PHASE, INVALID_TEAM_SIZE, INVALID_PLAYER_ID in draft-team route
- [ ] T017 [US1] Modify `src/app/api/games/[gameId]/propose/route.ts` to call clearDraftTeam before updating phase to voting

### Game State Hook

- [ ] T018 [US1] Update `src/hooks/useGameState.ts` to include draft_team and is_draft_in_progress in returned GameState

### Client API Layer

- [ ] T019 [US1] Add updateDraftTeam function in `src/lib/api/game.ts` that calls PUT /draft-team endpoint
- [ ] T020 [US1] Update error handling in `src/lib/api/game.ts` to include new error codes (NOT_LEADER, INVALID_PHASE)

**Checkpoint**: At this point, draft selections are stored in database and available via API. Leader can update draft_team, and all players can fetch it via GET /games/{gameId}.

---

## Phase 4: User Story 2 - Visual Distinction for Selection States (Priority: P1) 🎯

**Goal**: Clearly distinguish between players who are tentatively selected (draft) versus officially proposed (submitted team)

**Independent Test**:
1. Leader selects players - verify pulsing cyan borders appear
2. Leader submits team - verify state changes to solid green borders with shield icons
3. All players can distinguish between the two states visually
4. Verify "Selecting team: X/Y" changes to "Team proposed: X/Y"

### PlayerSeats Component - Visual States

- [ ] T021 [P] [US2] Add draftTeam and isDraftInProgress props to PlayerSeats component in `src/components/game/PlayerSeats.tsx`
- [ ] T022 [US2] Implement visual state logic in PlayerSeats: determine default, draft-selected, or proposed state for each player
- [ ] T023 [US2] Add CSS classes for draft-selected state: `border-cyan-400 animate-pulse bg-cyan-900/30` in `src/components/game/PlayerSeats.tsx`
- [ ] T024 [US2] Update "You" label color to match player's current selection state in PlayerSeats component

**Checkpoint**: At this point, visual distinction between draft and proposed selections is clear. Players can observe the leader's selection process with distinct visual states.

---

## Phase 5: User Story 3 - Leader Feedback (Priority: P2)

**Goal**: Provide immediate visual feedback to the leader when selecting/deselecting players (<100ms)

**Independent Test**:
1. Leader clicks a player avatar
2. Visual feedback appears within 100ms (measured in browser DevTools)
3. Leader rapidly toggles same player 5 times
4. No UI lag or missed clicks
5. Final state is accurate after debounce period

### TeamProposal Component - Optimistic UI

- [ ] T025 [US3] Add useDebouncedCallback hook (200ms) to TeamProposal component in `src/components/game/TeamProposal.tsx`
- [ ] T026 [US3] Update handlePlayerClick to keep local state update immediate (optimistic) and call debounced updateDraftTeam API
- [ ] T027 [US3] Add error handling in TeamProposal for draft update failures (show error message, don't block UI)

**Checkpoint**: At this point, the leader experiences instant feedback (<100ms) when selecting players. API calls are debounced to reduce server load and handle rapid toggles.

---

## Phase 6: User Story 4 - Performance and Responsiveness (Priority: P2)

**Goal**: Ensure draft selection updates appear on observer screens quickly (<500ms strategic value via 0-3s polling)

**Independent Test**:
1. Measure time from leader click to observer screen update (should be <3s)
2. Test with 10 players - updates should still propagate accurately
3. Test rapid toggles (5+ per second) - final state should be consistent across all players
4. Test with simulated network throttling - acceptable degradation (still <5s)
5. Verify no dropped updates or selection state mismatches

### Selection Count Display

- [ ] T028 [US4] Add selection count calculation from draft_team in TeamProposal component in `src/components/game/TeamProposal.tsx`
- [ ] T029 [US4] Display "Selecting team: X/Y" when isDraftInProgress, "Team proposed: X/Y" when proposal submitted
- [ ] T030 [US4] Add color coding: cyan for incomplete (count < required), green for complete (count === required)

### GameBoard Integration

- [ ] T031 [US4] Extract draft_team and is_draft_in_progress from gameState in `src/components/game/GameBoard.tsx`
- [ ] T032 [US4] Pass draft_team, isDraftInProgress, and game state to TeamProposal component from GameBoard

### GET API Enhancement

- [ ] T033 [US4] Modify `src/app/api/games/[gameId]/route.ts` to calculate and return is_draft_in_progress (draft_team !== null)
- [ ] T034 [US4] Add backward compatibility handling: treat undefined draft_team as null in GET /games response

**Checkpoint**: At this point, all players see selection counts, and the full real-time visibility feature is functional. Performance meets targets (<3s updates via polling, <100ms leader feedback).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, documentation, and final validation

### Edge Cases

- [ ] T035 [P] Handle disconnected player selection: show disconnect indicator + draft highlight in `src/components/game/PlayerSeats.tsx`
- [ ] T036 [P] Add backward compatibility check in `src/hooks/useGameState.ts`: handle draft_team === undefined gracefully (treat as null)

### Documentation & Validation

- [ ] T037 Run quickstart.md testing scenarios to validate all 8 test cases pass

**Checkpoint**: Feature complete. All user stories independently functional. Ready for deployment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ No tasks (existing infrastructure)
- **Foundational (Phase 2)**: No dependencies - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories CAN proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1) - Real-Time Visibility**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **US2 (P1) - Visual Distinction**: Depends on US1 (needs draft_team API and data) - Should complete after US1
- **US3 (P2) - Leader Feedback**: Depends on US1 (needs updateDraftTeam API) - Should complete after US1
- **US4 (P2) - Performance**: Depends on US1, US2, US3 (integrates all components) - Should complete last

**Recommended Order**: Foundational → US1 → US2 → US3 → US4 → Polish

### Within Each User Story

- **US1**: Database layer → API endpoints → Client API → Game state hook
- **US2**: PlayerSeats props → Visual state logic → CSS classes
- **US3**: Debounce hook → Optimistic UI → Error handling
- **US4**: Selection count → GameBoard integration → GET API enhancement

### Parallel Opportunities

**Within Foundational Phase**:
- T004, T005, T006, T007 (TypeScript types) can run in parallel
- T008, T009, T010 (Domain logic functions) can run in parallel

**Within US1**:
- T011, T012 (Database layer functions) can run in parallel
- T019, T020 (Client API layer) can run in parallel after API endpoints complete

**Within US2**:
- T021 (props) must complete before T022-T024
- T022, T023, T024 can be done in quick succession (same file)

**Within US4**:
- T028, T029, T030 (selection count) can be done together
- T033, T034 (GET API) can run in parallel with T028-T030

**Cross-Phase**:
- Once Foundational completes, US1 and parts of US2 can start in parallel (different files)
- US3 can start as soon as US1's T019 (client API) completes

---

## Parallel Example: Foundational Phase

```bash
# Launch all TypeScript type updates together:
Task T004: "Add draft_team to Game interface in src/types/game.ts"
Task T005: "Add draft_team to GameUpdate interface in src/types/game.ts"
Task T006: "Add draft_team and is_draft_in_progress to GameState interface in src/types/game.ts"
Task T007: "Create API request/response interfaces in src/types/game.ts"

# Launch all domain logic functions together (after types complete):
Task T008: "Create validateDraftSelection in src/lib/domain/team-selection.ts"
Task T009: "Implement isDraftInProgress in src/lib/domain/team-selection.ts"
Task T010: "Implement normalizeDraftTeam in src/lib/domain/team-selection.ts"
```

---

## Parallel Example: User Story 1

```bash
# Database layer functions (parallel):
Task T011: "Add updateDraftTeam function in src/lib/supabase/games.ts"
Task T012: "Add clearDraftTeam function in src/lib/supabase/games.ts"

# After API endpoints complete (T014-T017), launch client API tasks (parallel):
Task T019: "Add updateDraftTeam function in src/lib/api/game.ts"
Task T020: "Update error handling in src/lib/api/game.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

**Why**: US1 + US2 together provide the core value - real-time visibility with clear visual distinction.

1. Complete Phase 2: Foundational (T001-T010) ✅
2. Complete Phase 3: User Story 1 (T011-T020) ✅
3. Complete Phase 4: User Story 2 (T021-T024) ✅
4. **STOP and VALIDATE**: Test real-time visibility and visual states
5. Deploy/demo if ready (minimum viable feature)

**MVP Delivers**:
- ✅ All players see draft selections in real-time
- ✅ Clear visual distinction between draft and proposed teams
- ✅ Strategic information restored to digital gameplay

**Deferred for Later**:
- US3 (Leader Feedback): Nice to have but not critical - leader can still select without optimistic UI
- US4 (Performance): Can validate and optimize after MVP proves value

### Incremental Delivery

1. **Foundation**: Complete Foundational → Database, types, domain logic ready
2. **MVP (US1+US2)**: Real-time visibility + visual states → Test independently → Deploy/Demo 🎯
3. **Enhanced (US3)**: Add optimistic UI for leader → Test independently → Deploy/Demo
4. **Optimized (US4)**: Performance tuning + selection count → Test independently → Deploy/Demo
5. **Polished**: Edge cases + documentation → Final validation → Deploy

### Parallel Team Strategy

With 2-3 developers:

1. **Together**: Complete Foundational phase (T001-T010)
2. **Once Foundational done**:
   - **Developer A**: US1 (T011-T020) - Core API and data flow
   - **Developer B**: US2 setup (T021) - Prepare PlayerSeats props
3. **After US1 completes**:
   - **Developer A**: US3 (T025-T027) - Optimistic UI
   - **Developer B**: US2 completion (T022-T024) - Visual states
   - **Developer C** (if available): US4 setup (T028-T030)
4. **Final**: All converge on US4 integration (T031-T034) and Polish (T035-T037)

---

## Testing Notes

**Manual Testing** (per quickstart.md):
- Test 1: Basic real-time visibility (3s latency)
- Test 2: Deselection propagation
- Test 3: Rapid toggles (debouncing)
- Test 4: State transition (draft → proposed)
- Test 5: Leader navigation persistence
- Test 6: Disconnected player selection
- Test 7: Page refresh persistence
- Test 8: Non-leader authorization check

**Automated Tests**: Not requested in specification per constitution. If needed later:
- Unit tests for domain logic (`lib/domain/team-selection.ts`)
- API endpoint tests for PUT /draft-team (validation, authorization)
- Component tests for PlayerSeats (visual state logic)

**Performance Benchmarks**:
- Leader feedback: <100ms (measure with `performance.now()`)
- Observer updates: <3s (measure from leader click to screen update)
- API response: <500ms (check Network tab)

---

## Migration Checklist

Before deploying to production:

- [ ] Apply migration 011 to production Supabase database
- [ ] Verify draft_team column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'draft_team'`
- [ ] Test backward compatibility: Deploy code before migration, verify no errors
- [ ] Smoke test: Create room, start game, select team, verify all players see selections
- [ ] Monitor: Track API error rates for `/api/games/{gameId}/draft-team` (target: <1%)

---

## Rollback Plan

If issues arise post-deployment:

1. **Code rollback**: Revert to previous deployment (feature gracefully degrades)
2. **Database rollback** (if needed): `ALTER TABLE games DROP COLUMN draft_team;`
3. **Impact**: Lose draft visibility, but existing games continue normally

---

## Success Metrics (Post-Launch)

Track for 1 week after deployment:

- **Latency**: Actual time from leader click to observer update (target: <3s avg)
- **Accuracy**: Dropped updates or state mismatches (target: <5% error rate)
- **API Errors**: PUT /draft-team endpoint errors (target: <1%)
- **User Satisfaction**: Survey question "Does real-time selection improve your experience?" (target: >80% yes)

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] labels**: Map tasks to user stories for traceability
- **Commit strategy**: Commit after each task or logical group (e.g., all types, all domain logic)
- **Checkpoints**: Stop at any checkpoint to validate story independently before proceeding
- **Backward compatibility**: All code handles draft_team === undefined gracefully
- **Polling**: Existing 3-second polling is sufficient; no need to implement Supabase Realtime for MVP
- **Visual testing**: Verify pulsing animations work across browsers (Chrome, Safari, Firefox)
- **Mobile**: Touch targets maintained, responsive design preserved (constitution requirement)

