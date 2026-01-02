# Tasks: Parallel Merlin Quiz

**Input**: Design documents from `/specs/021-parallel-merlin-quiz/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Unit tests included for core domain logic (quiz eligibility).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Type Definitions & Foundation)

**Purpose**: Add new types and extend game phase enum before implementing logic

- [ ] T001 Add `parallel_quiz` to GamePhase type and ParallelQuizState interface in `src/types/game.ts`
- [ ] T002 [P] Add QuizEligibility and QuizEligibilityInput types in `src/types/game.ts`
- [ ] T003 [P] Add IndividualQuizVote and MerlinQuizResultsEnhanced types in `src/types/game.ts`
- [ ] T004 Update GameState interface to include parallel_quiz and quiz_eligibility fields in `src/types/game.ts`

---

## Phase 2: Foundational (Domain Logic Core)

**Purpose**: Core domain logic that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create quiz eligibility domain module with getQuizEligibility() function in `src/lib/domain/quiz-eligibility.ts`
- [ ] T006 [P] Add getEligibleQuizPlayers() helper function in `src/lib/domain/quiz-eligibility.ts`
- [ ] T007 [P] Add unit tests for quiz eligibility logic in `tests/unit/quiz-eligibility.test.ts`
- [ ] T008 Add `parallel_quiz` phase to VALID_TRANSITIONS in `src/lib/domain/game-state-machine.ts`
- [ ] T009 [P] Add isParallelQuizComplete() function in `src/lib/domain/merlin-quiz.ts`
- [ ] T010 [P] Add canCompleteParallelPhase() function in `src/lib/domain/merlin-quiz.ts`
- [ ] T011 Modify checkWinConditions() to trigger parallel_quiz phase instead of assassin in `src/lib/domain/win-conditions.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Good Wins: Parallel Quiz and Assassination (Priority: P1) 🎯 MVP

**Goal**: When Good wins 3 quests, non-Assassin players see quiz immediately while Assassin sees target selection simultaneously

**Independent Test**: Complete 3 successful quests with Merlin+Assassin, verify Assassin sees assassination UI while others see quiz

### Implementation for User Story 1

- [ ] T012 [US1] Update GET /api/games/[gameId] to build ParallelQuizState when phase is parallel_quiz in `src/app/api/games/[gameId]/route.ts`
- [ ] T013 [US1] Add quiz_eligibility computation for current player in GET /api/games/[gameId] route in `src/app/api/games/[gameId]/route.ts`
- [ ] T014 [P] [US1] Create ParallelQuizWaiting component with vote count display in `src/components/game/ParallelQuizWaiting.tsx`
- [ ] T015 [US1] Update GameBoard to route players based on quiz_eligibility during parallel_quiz phase in `src/components/game/GameBoard.tsx`
- [ ] T016 [US1] Update POST /api/games/[gameId]/assassin-guess to check quiz completion before transitioning in `src/app/api/games/[gameId]/assassin-guess/route.ts`
- [ ] T017 [US1] Add assassin_submitted tracking to parallel phase state in `src/app/api/games/[gameId]/assassin-guess/route.ts`
- [ ] T018 [US1] Implement parallel phase transition logic (both conditions met → game_over) in `src/app/api/games/[gameId]/assassin-guess/route.ts`

**Checkpoint**: Good win parallel flow works - Assassin sees assassination, others see quiz

---

## Phase 4: User Story 2 - Evil Wins: Quiz for Eligible Players (Priority: P2)

**Goal**: When Evil wins, show quiz to all except Merlin (and Percival without Morgana)

**Independent Test**: Complete 3 failed quests, verify Merlin sees waiting screen, others see quiz

### Implementation for User Story 2

- [ ] T019 [US2] Add Evil win detection to trigger parallel_quiz phase in win-conditions or quest action route in `src/lib/domain/win-conditions.ts`
- [ ] T020 [US2] Add 5-rejections Evil win trigger for parallel_quiz phase in `src/app/api/games/[gameId]/vote/route.ts` (if exists) or relevant vote handling
- [ ] T021 [US2] Update quiz eligibility for Percival based on Morgana presence in `src/lib/domain/quiz-eligibility.ts`
- [ ] T022 [US2] Update ParallelQuizWaiting to show role-specific messages (Merlin vs Percival) in `src/components/game/ParallelQuizWaiting.tsx`
- [ ] T023 [US2] Handle Evil win parallel phase completion (no Assassin needed) in `src/app/api/games/[gameId]/merlin-quiz/route.ts`

**Checkpoint**: Evil win quiz flow works - Merlin/Percival(certain) wait, others take quiz

---

## Phase 5: User Story 3 - Quiz Submission During Parallel Phase (Priority: P2)

**Goal**: Players can submit quiz votes with real-time progress updates and 60-second timeout

**Independent Test**: Submit quiz vote, verify confirmation shown and vote count updates

### Implementation for User Story 3

- [ ] T024 [US3] Update POST /api/games/[gameId]/merlin-quiz to validate eligibility for parallel phase in `src/app/api/games/[gameId]/merlin-quiz/route.ts`
- [ ] T025 [US3] Add parallel_quiz_vote broadcast event when vote submitted in `src/app/api/games/[gameId]/merlin-quiz/route.ts`
- [ ] T026 [US3] Update MerlinQuiz component to support parallel mode with isParallelMode prop in `src/components/game/MerlinQuiz.tsx`
- [ ] T027 [US3] Add real-time vote count listener in MerlinQuiz component in `src/components/game/MerlinQuiz.tsx`
- [ ] T028 [US3] Implement 60-second countdown timer with timeout handling in `src/components/game/MerlinQuiz.tsx`
- [ ] T029 [US3] Add quiz completion check (all votes OR timeout) in merlin-quiz route in `src/app/api/games/[gameId]/merlin-quiz/route.ts`
- [ ] T030 [US3] Trigger parallel phase transition when quiz completes in `src/app/api/games/[gameId]/merlin-quiz/route.ts`

**Checkpoint**: Quiz submission works with real-time updates and proper timeout handling

---

## Phase 6: User Story 4 - Good Wins Without Assassin Role (Priority: P2)

**Goal**: When Good wins with no Assassin, show quiz to all players, Good wins immediately after quiz

**Independent Test**: Configure game without Assassin, win 3 quests, verify all players see quiz and Good wins

### Implementation for User Story 4

- [ ] T031 [US4] Handle missing Assassin case in quiz eligibility (all players eligible) in `src/lib/domain/quiz-eligibility.ts`
- [ ] T032 [US4] Update parallel phase completion to skip assassination check when no Assassin in `src/lib/domain/merlin-quiz.ts`
- [ ] T033 [US4] Update GameBoard routing to handle no-Assassin parallel phase (no AssassinPhase shown) in `src/components/game/GameBoard.tsx`
- [ ] T034 [US4] Ensure Good victory is persisted when quiz completes (no Assassin case) in `src/app/api/games/[gameId]/merlin-quiz/route.ts`

**Checkpoint**: No-Assassin Good win works - all see quiz, Good wins after quiz completes

---

## Phase 7: User Story 5 - Game Results After Parallel Phase (Priority: P3)

**Goal**: Show detailed quiz breakdown with individual votes and aggregate statistics on results screen

**Independent Test**: Complete a game, verify results show each player's guess and aggregate stats

### Implementation for User Story 5

- [ ] T035 [US5] Add individual_votes field to merlin-quiz results API response in `src/app/api/games/[gameId]/merlin-quiz/route.ts`
- [ ] T036 [US5] Create calculateEnhancedQuizResults() function with individual vote breakdown in `src/lib/domain/merlin-quiz.ts`
- [ ] T037 [P] [US5] Update MerlinQuizResults component to show individual vote breakdown table in `src/components/game/MerlinQuizResults.tsx`
- [ ] T038 [P] [US5] Add aggregate statistics display (X of Y correct, percentage) in `src/components/game/MerlinQuizResults.tsx`
- [ ] T039 [US5] Style quiz results with light, intuitive UI per spec requirements in `src/components/game/MerlinQuizResults.tsx`
- [ ] T040 [US5] Handle "did not vote" display for players who timed out in `src/components/game/MerlinQuizResults.tsx`
- [ ] T041 [US5] Update GameOver component to properly integrate enhanced quiz results in `src/components/game/GameOver.tsx`

**Checkpoint**: Results display complete with individual breakdown and aggregate stats

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Integration testing, edge cases, and final polish

- [ ] T042 Add parallel_phase_complete broadcast event for all players in relevant API routes
- [ ] T043 [P] Handle player disconnection during parallel phase gracefully
- [ ] T044 [P] Add watcher mode support for parallel_quiz phase in `src/components/game/WatcherGameBoard.tsx`
- [ ] T045 Verify backward compatibility with legacy `assassin` phase (existing games)
- [ ] T046 [P] Update useGameState hook to handle parallel_quiz state in `src/hooks/useGameState.ts`
- [ ] T047 Run quickstart.md validation scenarios manually
- [ ] T048 Code cleanup: remove any console.logs, add proper error handling

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Core flow, must complete first
  - US2-4 (P2): Can proceed in parallel after US1
  - US5 (P3): Depends on quiz infrastructure from US1-3
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Core parallel flow
- **User Story 2 (P2)**: Can start after US1 - Uses same eligibility infrastructure
- **User Story 3 (P2)**: Can start after US1 - Uses same quiz submission infrastructure
- **User Story 4 (P2)**: Can start after US1 - Edge case variation
- **User Story 5 (P3)**: Depends on US1-3 completion - Enhances results display

### Within Each User Story

- API route changes before component changes
- Domain logic before API routes (where applicable)
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003 can run in parallel (different type definitions)
- T006, T007, T009, T010 can run in parallel (different functions/files)
- T014 can run in parallel with API changes (new component)
- T037, T038 can run in parallel (different parts of results display)
- T043, T044, T046 can run in parallel (different files)

---

## Parallel Example: Phase 2 Foundational

```bash
# After T005 completes, launch these in parallel:
Task T006: "Add getEligibleQuizPlayers() helper in quiz-eligibility.ts"
Task T007: "Add unit tests for quiz eligibility in quiz-eligibility.test.ts"
Task T009: "Add isParallelQuizComplete() in merlin-quiz.ts"
Task T010: "Add canCompleteParallelPhase() in merlin-quiz.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (domain logic)
3. Complete Phase 3: User Story 1 (Good wins parallel flow)
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy/demo if ready - core bias prevention achieved

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → Deploy (MVP - bias prevention works!)
3. Add User Story 2 → Test → Deploy (Evil win quiz)
4. Add User Story 3 → Test → Deploy (Real-time updates)
5. Add User Story 4 → Test → Deploy (No-Assassin edge case)
6. Add User Story 5 → Test → Deploy (Enhanced results)

### Suggested MVP Scope

**Minimum Viable Product**: Complete through User Story 1 (Phase 3)
- Types defined
- Eligibility logic works
- Good win parallel flow functional
- Assassin sees assassination, others see quiz
- Game transitions correctly when both complete

---

## Summary

| Phase | Tasks | Stories | Description |
|-------|-------|---------|-------------|
| 1 | 4 | - | Setup: Type definitions |
| 2 | 7 | - | Foundational: Domain logic |
| 3 | 7 | US1 | Good wins parallel flow |
| 4 | 5 | US2 | Evil wins quiz flow |
| 5 | 7 | US3 | Quiz submission & timeout |
| 6 | 4 | US4 | No-Assassin edge case |
| 7 | 7 | US5 | Enhanced results display |
| 8 | 7 | - | Polish & cross-cutting |

**Total Tasks**: 48
**Total User Stories**: 5
**Parallel Opportunities**: 14 tasks marked [P]

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backward compatibility with legacy `assassin` phase maintained
