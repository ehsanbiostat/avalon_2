# Implementation Tasks: Phase 3 – Quest System

**Feature**: 003-avalon-quest-system
**Total Tasks**: 85
**Created**: 2025-12-03

---

## Legend

- `[ ]` = Pending
- `[~]` = In Progress
- `[X]` = Complete
- `[S]` = Skipped
- `||` = Can be parallelized with adjacent tasks

---

## Phase 3.1: Database & Types (Foundation)

### Database Setup
- [ ] T001 Create enums (game_phase, proposal_status, vote_choice, quest_action_type) in supabase/migrations/007_quest_system.sql
- [ ] T002 Create games table with all columns in supabase/migrations/007_quest_system.sql
- [ ] T003 Create team_proposals table in supabase/migrations/007_quest_system.sql
- [ ] T004 Create votes table with unique constraint in supabase/migrations/007_quest_system.sql
- [ ] T005 Create quest_actions table with unique constraint in supabase/migrations/007_quest_system.sql
- [ ] T006 Create game_events table in supabase/migrations/007_quest_system.sql
- [ ] T007 Create indexes for all new tables in supabase/migrations/007_quest_system.sql
- [ ] T008 Create RLS policies for games table in supabase/migrations/007_quest_system.sql
- [ ] T009 Create RLS policies for team_proposals table in supabase/migrations/007_quest_system.sql
- [ ] T010 Create RLS policies for votes table in supabase/migrations/007_quest_system.sql
- [ ] T011 Create RLS policies for quest_actions table in supabase/migrations/007_quest_system.sql
- [ ] T012 Create RLS policies for game_events table in supabase/migrations/007_quest_system.sql
- [ ] T013 Apply migration to local Supabase (verify schema)

### TypeScript Types
- [ ] T014 || Create GamePhase, ProposalStatus, VoteChoice, QuestActionType types in src/types/game.ts
- [ ] T015 || Create Game interface in src/types/game.ts
- [ ] T016 || Create TeamProposal interface in src/types/game.ts
- [ ] T017 || Create Vote interface in src/types/game.ts
- [ ] T018 || Create QuestAction interface in src/types/game.ts
- [ ] T019 || Create GameEvent interface in src/types/game.ts
- [ ] T020 Create QuestRequirement and QuestResult types in src/types/game.ts
- [ ] T021 Create GameState and GamePlayer types (client state) in src/types/game.ts
- [ ] T022 Update src/types/database.ts with new table types

### Supabase Query Functions
- [ ] T023 Create src/lib/supabase/games.ts with CRUD functions
- [ ] T024 Create createGame function in src/lib/supabase/games.ts
- [ ] T025 Create getGameByRoomId function in src/lib/supabase/games.ts
- [ ] T026 Create updateGamePhase function in src/lib/supabase/games.ts
- [ ] T027 Create updateGameState function in src/lib/supabase/games.ts
- [ ] T028 Create src/lib/supabase/proposals.ts with proposal functions
- [ ] T029 Create createProposal function in src/lib/supabase/proposals.ts
- [ ] T030 Create getCurrentProposal function in src/lib/supabase/proposals.ts
- [ ] T031 Create resolveProposal function in src/lib/supabase/proposals.ts
- [ ] T032 Create src/lib/supabase/votes.ts with vote functions
- [ ] T033 Create submitVote function in src/lib/supabase/votes.ts
- [ ] T034 Create getVotesForProposal function in src/lib/supabase/votes.ts
- [ ] T035 Create getVoteCount function in src/lib/supabase/votes.ts
- [ ] T036 Create src/lib/supabase/quest-actions.ts with action functions
- [ ] T037 Create submitQuestAction function in src/lib/supabase/quest-actions.ts
- [ ] T038 Create getQuestActions function in src/lib/supabase/quest-actions.ts
- [ ] T039 Create src/lib/supabase/game-events.ts with event functions
- [ ] T040 Create logGameEvent function in src/lib/supabase/game-events.ts
- [ ] T041 Create getGameHistory function in src/lib/supabase/game-events.ts

---

## Phase 3.2: Domain Logic

### Quest Configuration
- [ ] T042 Create QUEST_CONFIG constant in src/lib/domain/quest-config.ts
- [ ] T043 Create getQuestRequirement(playerCount, questNumber) function
- [ ] T044 Create getAllQuestRequirements(playerCount) function
- [ ] T045 Write unit tests for quest configuration in tests/unit/domain/quest-config.test.ts

### Seating & Leader
- [ ] T046 Create src/lib/domain/seating.ts
- [ ] T047 Implement shuffleSeating(playerIds) using Fisher-Yates
- [ ] T048 Implement selectRandomLeader(seatingOrder) function
- [ ] T049 Implement rotateLeader(seatingOrder, currentIndex) function
- [ ] T050 Write unit tests for seating in tests/unit/domain/seating.test.ts

### Game State Machine
- [ ] T051 Create src/lib/domain/game-state.ts
- [ ] T052 Implement canTransition(fromPhase, toPhase) validator
- [ ] T053 Implement getNextPhase(currentState) function
- [ ] T054 Write unit tests for state machine in tests/unit/domain/game-state.test.ts

### Vote Calculator
- [ ] T055 Create src/lib/domain/vote-calculator.ts
- [ ] T056 Implement calculateVoteResult(approveCount, rejectCount, totalPlayers)
- [ ] T057 Implement checkFiveRejections(voteTrack) function
- [ ] T058 Write unit tests for vote calculator in tests/unit/domain/vote-calculator.test.ts

### Quest Resolver
- [ ] T059 Create src/lib/domain/quest-resolver.ts
- [ ] T060 Implement calculateQuestResult(actions, failsRequired)
- [ ] T061 Implement shuffleActions(actions) for display
- [ ] T062 Write unit tests for quest resolver in tests/unit/domain/quest-resolver.test.ts

### Win Conditions
- [ ] T063 Create src/lib/domain/win-conditions.ts
- [ ] T064 Implement checkWinCondition(questResults, voteTrack)
- [ ] T065 Write unit tests for win conditions in tests/unit/domain/win-conditions.test.ts

### Team Validation
- [ ] T066 Create src/lib/domain/team-validation.ts
- [ ] T067 Implement validateTeamProposal(teamIds, requiredSize, validPlayerIds)
- [ ] T068 Implement canPlayerFail(playerId, playerRole) - Good can't fail
- [ ] T069 Write unit tests for team validation in tests/unit/domain/team-validation.test.ts

---

## Phase 3.3: API Endpoints

### Game Start
- [ ] T070 Create POST /api/games/[roomId]/start endpoint in src/app/api/games/[roomId]/start/route.ts
- [ ] T071 Implement manager-only authorization
- [ ] T072 Implement seating randomization on game start
- [ ] T073 Implement random leader selection
- [ ] T074 Create initial game record in database
- [ ] T075 Log game_started event
- [ ] T076 Return game state with seating order

### Team Proposal
- [ ] T077 Create POST /api/games/[gameId]/propose endpoint in src/app/api/games/[gameId]/propose/route.ts
- [ ] T078 Validate caller is current leader
- [ ] T079 Validate team size matches quest requirement
- [ ] T080 Create proposal record
- [ ] T081 Update game phase to 'voting'
- [ ] T082 Log team_proposed event
- [ ] T083 Return proposal details

### Voting
- [ ] T084 Create GET /api/games/[gameId]/proposal/current endpoint
- [ ] T085 Return proposal with vote count (not individual votes until complete)
- [ ] T086 Create POST /api/games/[gameId]/vote endpoint in src/app/api/games/[gameId]/vote/route.ts
- [ ] T087 Validate one vote per player
- [ ] T088 Record vote in database
- [ ] T089 Check if all votes received
- [ ] T090 If all voted: calculate result, update proposal status
- [ ] T091 If approved: update game phase to 'quest'
- [ ] T092 If rejected: increment vote_track, rotate leader, return to team_building
- [ ] T093 If 5 rejections: set winner='evil', phase='game_over'
- [ ] T094 Log vote events

### Quest Execution
- [ ] T095 Create GET /api/games/[gameId]/quest/current endpoint
- [ ] T096 Return quest status without revealing actions
- [ ] T097 Create POST /api/games/[gameId]/quest/action endpoint in src/app/api/games/[gameId]/quest/action/route.ts
- [ ] T098 Validate caller is team member
- [ ] T099 Validate Good players can only submit 'success'
- [ ] T100 Record action in database
- [ ] T101 Check if all actions received
- [ ] T102 If complete: calculate result, update game phase to 'quest_result'
- [ ] T103 Update quest_results in game record
- [ ] T104 Log quest events

### Quest Result & Progression
- [ ] T105 Create POST /api/games/[gameId]/continue endpoint
- [ ] T106 Check win conditions (3 successes or 3 failures)
- [ ] T107 If game over: set winner, update phase
- [ ] T108 If continuing: increment quest number, rotate leader, reset to team_building
- [ ] T109 Reset vote_track after quest completes
- [ ] T110 Log game progression events

### Game State
- [ ] T111 Create GET /api/games/[gameId] endpoint for full state
- [ ] T112 Include all game data needed for UI
- [ ] T113 Include player list with seating positions
- [ ] T114 Include current proposal if any
- [ ] T115 Include quest requirements

### Game History
- [ ] T116 Create GET /api/games/[gameId]/history endpoint
- [ ] T117 Return all past proposals with votes
- [ ] T118 Return all quest results

---

## Phase 3.4: Frontend - Game Board

### Core Layout
- [ ] T119 Create src/components/game/GameBoard.tsx main container
- [ ] T120 Implement responsive layout (desktop: side panels, mobile: stacked)
- [ ] T121 Create game state polling hook src/hooks/useGame.ts

### Quest Track
- [ ] T122 Create src/components/game/QuestTrack.tsx
- [ ] T123 Display 5 quest slots with status (pending/success/fail/current)
- [ ] T124 Show team size requirement for each quest
- [ ] T125 Highlight "2 fails required" for Quest 4 in 7+ games
- [ ] T126 Add animations for quest completion

### Vote Track
- [ ] T127 Create src/components/game/VoteTrack.tsx
- [ ] T128 Display 5 rejection markers
- [ ] T129 Show current rejection count
- [ ] T130 Add warning styling as count increases

### Seating Circle
- [ ] T131 Create src/components/game/SeatingCircle.tsx
- [ ] T132 Create src/components/game/PlayerSeat.tsx
- [ ] T133 Arrange players in circular layout
- [ ] T134 Show leader indicator (crown)
- [ ] T135 Show team selection state
- [ ] T136 Show voted/not-voted indicator during voting
- [ ] T137 Add rotation direction indicator

---

## Phase 3.5: Frontend - Team Building

### Team Selection (Leader View)
- [ ] T138 Create src/components/game/TeamSelection.tsx
- [ ] T139 Show selectable player list
- [ ] T140 Implement multi-select up to required team size
- [ ] T141 Show selected count vs required
- [ ] T142 "Propose Team" button (enabled when exact count)
- [ ] T143 Submit proposal to API

### Team Proposal (All Players View)
- [ ] T144 Create src/components/game/TeamProposal.tsx
- [ ] T145 Display proposed team members
- [ ] T146 Show leader who proposed
- [ ] T147 Highlight proposed players in SeatingCircle

---

## Phase 3.6: Frontend - Voting

### Voting Panel
- [ ] T148 Create src/components/game/VotingPanel.tsx
- [ ] T149 Display Approve/Reject buttons
- [ ] T150 Show confirmation after voting
- [ ] T151 Disable buttons after vote submitted
- [ ] T152 Show waiting state for other voters

### Vote Reveal
- [ ] T153 Create src/components/game/VoteReveal.tsx
- [ ] T154 Display all votes with player names
- [ ] T155 Show approve/reject counts
- [ ] T156 Show result (approved/rejected)
- [ ] T157 Add reveal animation

---

## Phase 3.7: Frontend - Quest Execution

### Quest Execution (Team Member View)
- [ ] T158 Create src/components/game/QuestExecution.tsx
- [ ] T159 Display Success button (all players)
- [ ] T160 Display Fail button (evil players only)
- [ ] T161 Show confirmation after submission
- [ ] T162 Show waiting for other team members

### Quest Waiting (Non-Team View)
- [ ] T163 Create src/components/game/QuestWaiting.tsx
- [ ] T164 Show "Quest in progress" message
- [ ] T165 Show submission progress (X of Y submitted)

### Quest Result
- [ ] T166 Create src/components/game/QuestResult.tsx
- [ ] T167 Display shuffled success/fail cards
- [ ] T168 Animate card reveal
- [ ] T169 Show quest outcome (success/fail)
- [ ] T170 "Continue" button to proceed

---

## Phase 3.8: Frontend - Game End & History

### Game Over Screen
- [ ] T171 Create src/components/game/GameOverScreen.tsx
- [ ] T172 Display winner (Good/Evil)
- [ ] T173 Display win reason message
- [ ] T174 Reveal all player roles
- [ ] T175 Show final quest track
- [ ] T176 "Return to Lobby" button
- [ ] T177 Add victory/defeat animations

### Game History Panel
- [ ] T178 Create src/components/game/GameHistory.tsx
- [ ] T179 Display collapsible event log
- [ ] T180 Show past team proposals with votes
- [ ] T181 Show quest results
- [ ] T182 Scrollable with newest at top

---

## Phase 3.9: Integration & Polish

### Page Integration
- [ ] T183 Update src/app/game/[code]/page.tsx with GameBoard
- [ ] T184 Implement game state loading
- [ ] T185 Handle game not found / not started errors
- [ ] T186 Add "Start Game" button to Lobby for manager

### Real-time Updates
- [ ] T187 Implement game state polling in useGame hook
- [ ] T188 Optimize polling frequency based on phase
- [ ] T189 Add connection status indicator

### Error Handling
- [ ] T190 Handle API errors gracefully
- [ ] T191 Show error toasts for failed actions
- [ ] T192 Handle disconnection/reconnection

### Mobile Responsiveness
- [ ] T193 Test and fix SeatingCircle on mobile
- [ ] T194 Stack layout for small screens
- [ ] T195 Touch-friendly team selection

---

## Phase 3.10: Testing

### E2E Tests
- [ ] T196 Create tests/e2e/quest-game.spec.ts
- [ ] T197 Test complete game flow (Good wins 3 quests)
- [ ] T198 Test Evil win by 3 quest failures
- [ ] T199 Test Evil win by 5 rejections
- [ ] T200 Test reconnection during game

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 3.1 | T001-T041 | Database & Types |
| 3.2 | T042-T069 | Domain Logic |
| 3.3 | T070-T118 | API Endpoints |
| 3.4 | T119-T137 | Game Board UI |
| 3.5 | T138-T147 | Team Building UI |
| 3.6 | T148-T157 | Voting UI |
| 3.7 | T158-T170 | Quest Execution UI |
| 3.8 | T171-T182 | Game End & History UI |
| 3.9 | T183-T195 | Integration & Polish |
| 3.10 | T196-T200 | E2E Testing |

**Total: 200 tasks**


