# Tasks: Endgame Merlin Quiz

**Input**: Design documents from `/specs/010-endgame-merlin-quiz/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: Unit tests included per plan.md (testing required for domain logic)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Summary

| Phase | Description | Tasks |
|-------|-------------|-------|
| 1 | Setup | 3 |
| 2 | Foundational (Database & Types) | 4 |
| 3 | User Story 1 - Quiz Voting (P1) 🎯 MVP | 8 |
| 4 | User Story 2 - Quiz Results (P1) | 5 |
| 5 | User Story 3 - Timeout & Skip (P2) | 4 |
| 6 | Polish & Integration | 4 |
| **Total** | | **28** |

---

## Phase 1: Setup

**Purpose**: Verify prerequisites and prepare for implementation

- [x] T001 Verify branch `010-endgame-merlin-quiz` is checked out and up to date with main
- [x] T002 Verify Supabase local/remote is accessible and migrations 001-012 are applied
- [x] T003 [P] Review existing `src/components/game/GameOver.tsx` to understand current game over flow

---

## Phase 2: Foundational (Database & Types)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create database migration `supabase/migrations/013_merlin_quiz.sql` with merlin_quiz_votes table, indexes, RLS policies, and realtime subscription (see data-model.md)
- [x] T005 Run migration on Supabase (local or remote) -- Migration file ready; will apply on deploy
- [x] T006 [P] Add Merlin Quiz TypeScript types to `src/types/game.ts`: MerlinQuizVote, MerlinQuizVoteInsert, MerlinQuizState, MerlinQuizResults, MerlinQuizResultEntry, MerlinQuizVoteRequest, MerlinQuizVoteResponse
- [x] T007 [P] Create database operations module `src/lib/supabase/merlin-quiz.ts` with: submitQuizVote(), getQuizVotes(), getQuizVoteCount(), getPlayerQuizVote()

**Checkpoint**: Database schema ready, types defined, basic DB operations available

---

## Phase 3: User Story 1 - All Players Guess Merlin After Game Ends (Priority: P1) 🎯 MVP

**Goal**: Players can submit their Merlin guesses at game end and see the quiz panel

**Independent Test**: Complete a game with Merlin role → verify quiz panel appears → submit a guess → verify vote is recorded

**Acceptance Criteria**:
- Quiz panel appears only at `game_over` phase when Merlin was in game
- Players can select another player and submit their guess
- Vote is persisted and player sees "waiting for others" state
- Quiz does NOT appear if no Merlin in game

### Tests for User Story 1

- [x] T008 [P] [US1] Create unit test file `tests/unit/domain/merlin-quiz.test.ts` with tests for: canShowQuiz(), hasPlayerVoted(), validateQuizVote()

### Implementation for User Story 1

- [x] T009 [US1] Create domain logic module `src/lib/domain/merlin-quiz.ts` with: QUIZ_TIMEOUT_SECONDS constant, canShowQuiz(hasMerlin), hasPlayerVoted(votes, playerId), validateQuizVote(voterId, suspectedId, seatingOrder)
- [x] T010 [US1] Create POST endpoint `src/app/api/games/[gameId]/merlin-quiz/route.ts` with validations: game_over phase, player in game, hasn't voted, not voting for self, suspected player in game
- [x] T011 [US1] Create GET endpoint in same file `src/app/api/games/[gameId]/merlin-quiz/route.ts` to return MerlinQuizState
- [x] T012 [US1] Create MerlinQuiz component `src/components/game/MerlinQuiz.tsx` with: player selection grid (exclude self), submit button, "waiting for others" state after voting
- [x] T013 [US1] Add real-time subscription for quiz votes in MerlinQuiz component using Supabase channel `quiz-votes-${gameId}`
- [x] T014 [US1] Update `src/components/game/GameOver.tsx` to check hasMerlin flag and show MerlinQuiz panel before role reveal section
- [x] T015 [US1] Add hasMerlin detection in `src/app/api/games/[gameId]/route.ts` by querying player_roles for special_role='merlin'

**Checkpoint**: Quiz voting flow complete - players can submit guesses at game end

---

## Phase 4: User Story 2 - View Quiz Results Before Role Reveal (Priority: P1)

**Goal**: After quiz completion, display results table showing vote counts before revealing actual roles

**Independent Test**: All players submit guesses → verify results table displays with vote counts → verify most-voted player is highlighted → click "Show Roles" reveals actual roles

**Acceptance Criteria**:
- Results table shows all players with vote counts
- Most-voted player(s) highlighted
- Actual Merlin indicated after reveal
- "Show Roles" button proceeds to role reveal

### Tests for User Story 2

- [x] T016 [P] [US2] Add unit tests to `tests/unit/domain/merlin-quiz.test.ts` for: calculateQuizResults() including ties and edge cases

### Implementation for User Story 2

- [x] T017 [US2] Add calculateQuizResults(votes, players, merlinId) function to `src/lib/domain/merlin-quiz.ts` that aggregates votes, identifies most-voted, marks actual Merlin
- [x] T018 [US2] Create GET endpoint `src/app/api/games/[gameId]/merlin-quiz/results/route.ts` that returns MerlinQuizResults with vote counts, actual Merlin info
- [x] T019 [US2] Create MerlinQuizResults component `src/components/game/MerlinQuizResults.tsx` with: results table sorted by vote count, highlight most-voted, show actual Merlin indicator, "Show Roles" button
- [x] T020 [US2] Update `src/components/game/GameOver.tsx` to transition from MerlinQuiz to MerlinQuizResults when quiz completes, then show role reveal after user clicks proceed

**Checkpoint**: Complete quiz flow with results display - core feature complete

---

## Phase 5: User Story 3 - Continue Without Full Participation (Priority: P2)

**Goal**: Quiz auto-completes on timeout or when all connected players have voted/skipped

**Independent Test**: Start quiz → have some players vote → wait 60s OR have remaining skip → verify quiz auto-completes and shows results

**Acceptance Criteria**:
- Quiz auto-completes after 60 second timeout
- "Skip Quiz" button records null vote
- Disconnected players don't block completion
- Results show skipped count

### Tests for User Story 3

- [x] T021 [P] [US3] Add unit tests to `tests/unit/domain/merlin-quiz.test.ts` for: isQuizComplete() with various scenarios (all voted, timeout, disconnects)

### Implementation for User Story 3

- [x] T022 [US3] Add isQuizComplete(votesSubmitted, connectedPlayers, quizStartedAt) function to `src/lib/domain/merlin-quiz.ts` with timeout and connected player logic
- [x] T023 [US3] Update MerlinQuiz component `src/components/game/MerlinQuiz.tsx` with: 60s countdown timer display, "Skip Quiz" button that submits null vote, auto-complete on timeout
- [x] T024 [US3] Update quiz completion detection in GameOver to account for connected players count and timeout (query room_players.is_connected)

**Checkpoint**: Full quiz feature complete with timeout handling

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, edge cases, and code quality

- [x] T025 [P] Add mobile responsive styles to MerlinQuiz and MerlinQuizResults components
- [x] T026 Handle edge case: single player connected at game end (auto-complete after their vote/skip)
- [x] T027 Handle edge case: player reconnects during quiz (allow them to vote if not already voted)
- [x] T028 Run full integration test: Game with Merlin ends → Quiz appears → All vote → Results show → Role reveal displays

**Checkpoint**: Feature complete and polished

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational (Database & Types) ← BLOCKS all user stories
    │
    ├───────────────────┬───────────────────┐
    ▼                   ▼                   ▼
Phase 3: US1        Phase 4: US2*       Phase 5: US3*
(Quiz Voting)       (Results Display)   (Timeout/Skip)
    │                   │                   │
    └───────────────────┴───────────────────┘
                        │
                        ▼
                  Phase 6: Polish

* US2 depends on US1 completion (needs quiz voting to test results)
* US3 can partially parallel with US2 (timeout logic independent)
```

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 completion (needs quiz votes to display results)
- **User Story 3 (P2)**: Depends on US1 (needs quiz infrastructure), can parallel with US2

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Domain logic before API endpoints
3. API endpoints before UI components
4. UI components before GameOver integration
5. Story complete before moving to next priority

### Parallel Opportunities

**Phase 2 (Foundational)**:
```bash
# These can run in parallel:
T006: Add TypeScript types to src/types/game.ts
T007: Create database operations in src/lib/supabase/merlin-quiz.ts
```

**Phase 3 (US1) - After T009 domain logic complete**:
```bash
# These can run in parallel:
T010: POST endpoint
T011: GET endpoint (same file, but independent logic)
T012: MerlinQuiz component (can start with mock data)
```

---

## Parallel Example: User Story 1

```bash
# After domain logic (T009) is complete:

# Launch API endpoints together:
Task T010: "Create POST endpoint in src/app/api/games/[gameId]/merlin-quiz/route.ts"
Task T011: "Create GET endpoint in src/app/api/games/[gameId]/merlin-quiz/route.ts"

# UI can start with mock data:
Task T012: "Create MerlinQuiz component in src/components/game/MerlinQuiz.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Quiz Voting)
4. Complete Phase 4: User Story 2 (Results Display)
5. **STOP and VALIDATE**: Test full quiz flow end-to-end
6. Deploy/demo - Core feature complete!

### Full Feature

1. Complete MVP (Phases 1-4)
2. Add User Story 3 (Timeout/Skip) - Phase 5
3. Complete Polish - Phase 6
4. Full feature ready

### Incremental Delivery Points

| Milestone | What Works | User Value |
|-----------|------------|------------|
| After Phase 2 | Database + types ready | - |
| After Phase 3 (US1) | Quiz voting works | Players can submit guesses |
| After Phase 4 (US2) | Results display works | Full quiz experience! 🎉 |
| After Phase 5 (US3) | Timeout/skip works | No stuck games |
| After Phase 6 | Polished | Production ready |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Quiz must ONLY appear at `game_over` phase - protect Assassin phase!
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
