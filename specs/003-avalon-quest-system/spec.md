# Feature Specification: Avalon Online – Phase 3: Quest System

**Feature Branch**: `003-avalon-quest-system`
**Created**: 2025-12-03
**Status**: Draft
**Depends On**: Phase 2 (002-avalon-special-roles) ✅ Complete
**Input**: Implement the core Avalon gameplay loop: team proposals, voting, quests, and win conditions

---

## Problem Statement

With role distribution complete, Avalon Online needs its core gameplay mechanic: **the Quest System**. This is the heart of the game where:

- **Strategic team building**: A leader proposes players for each quest, creating tension and revealing information
- **Social deduction through voting**: All players approve/reject team proposals, allowing analysis of voting patterns
- **Hidden sabotage**: Quest team members secretly choose success or fail, with Evil players able to sabotage
- **Progressive reveals**: Each quest result provides information to both teams
- **Win conditions**: First team to win 3 quests advances to the final phase

Without the quest system, there's no actual game to play after roles are distributed.

---

## Clarifications

### Session 2025-12-03

- Q: How does leader rotation work?
  - A: **Player positions are randomized when game starts** (after all roles confirmed). First leader is chosen **randomly** from the new seating order. Subsequent leaders rotate clockwise through the randomized positions.

- Q: Should failed team votes (5 rejections) auto-lose for Good?
  - A: **Yes** - Standard Avalon rule. 5 consecutive team rejections = Evil wins immediately.

- Q: How should the 4th quest "2 fails required" rule work in 7+ player games?
  - A: **Yes, use standard rule** - Quest 4 in games with 7+ players requires 2 fail cards to fail the quest. Adds strategic depth for Evil team.

- Q: What happens after 3 quest wins for Good - immediate Assassin phase?
  - A: **Defer Assassin phase to Phase 4** - For now, if Good wins 3 quests, display "Good wins!" and end the game. Assassin mechanic will be added in the next phase.

- Q: Should voting be simultaneous (all reveal at once) or sequential?
  - A: **Simultaneous** - All players vote secretly, votes are revealed only after everyone has voted. Prevents influence and is standard Avalon.

- Q: How long should players have to submit their quest action (success/fail)?
  - A: **No timers for Phase 3** - Wait indefinitely for all players. Timeouts may be added in future phases.

---

## User Roles

| Role | Description |
|------|-------------|
| **Player** | A participant with an assigned role who votes on teams and may go on quests |
| **Current Leader** | The player proposing the team for the current quest (rotates each vote) |
| **Quest Team Member** | A player selected to go on the current quest |
| **Room Manager** | Maintains ability to manage room settings (not special game powers) |

---

## Scope

### In Scope (This Phase)

- **Game State Machine**: Track game phases (team_building → voting → quest → results → next_quest/end_game)
- **Quest Configuration**: Define quest requirements per player count (team sizes, fail requirements)
- **Leader System**: Track and rotate the current leader
- **Team Proposal**: Leader selects players for the quest team
- **Team Voting**: All players vote approve/reject on proposed team
- **Vote Tracking**: Record and display vote results after all votes are in
- **Quest Execution**: Team members secretly submit success/fail
- **Quest Results**: Calculate and display quest outcome
- **Game Progress**: Track quest wins/losses for each team
- **Win Condition Detection**: Detect when either team wins 3 quests
- **Vote Track**: Show consecutive rejection count (5 rejections = Evil wins)
- **Game End States**: Handle Evil auto-win (5 rejections) and transition to Assassin phase (Good wins 3)
- **Real-time Updates**: All players see game state changes in real-time

### Out of Scope (Future Phases)

- **Assassin Guess Phase**: Implemented in Phase 4 after quest victory
- **Lady of the Lake Usage**: Token passing and loyalty reveals (Phase 4)
- **Game Chat**: In-game communication between players
- **Spectator Mode**: Watching games without participating
- **Game Replay**: Reviewing completed games
- **Rematch**: Starting new game with same players
- **Player Timeouts**: Auto-actions for disconnected players (MVP: wait indefinitely)

---

## Game Rules Reference

### Quest Requirements by Player Count

| Players | Quest 1 | Quest 2 | Quest 3 | Quest 4 | Quest 5 |
|---------|---------|---------|---------|---------|---------|
| 5       | 2       | 3       | 2       | 3       | 3       |
| 6       | 2       | 3       | 4       | 3       | 4       |
| 7       | 2       | 3       | 3       | 4†      | 4       |
| 8       | 3       | 4       | 4       | 5†      | 5       |
| 9       | 3       | 4       | 4       | 5†      | 5       |
| 10      | 3       | 4       | 4       | 5†      | 5       |

† = **Two fails required** for quest to fail (7+ player games, Quest 4 only)

### Seating Order & Leader Rotation

1. **When game starts** (all roles confirmed), player positions are **randomized** into a "seating order"
2. First leader is **randomly selected** from the seating order
3. After each team vote (pass or fail), leadership passes **clockwise** through the seating order
4. Leadership continues to rotate even if same player proposes again after rejection
5. Seating order is visible to all players (shows rotation direction)

### Team Voting Rules

1. Leader proposes a team of exact size required for quest
2. All players (including leader) vote simultaneously: Approve or Reject
3. Votes are revealed only after all players have voted
4. **Majority approves**: Team goes on the quest
5. **Tie or majority rejects**: Team is rejected, leadership passes, vote track increments
6. **5 consecutive rejections**: Evil team wins immediately

### Quest Execution Rules

1. Selected team members simultaneously submit their action: Success or Fail
2. **Good players** can only submit Success
3. **Evil players** can submit Success or Fail (strategic choice)
4. Actions are shuffled and revealed (no player attribution)
5. **Quest Success**: All actions are Success
6. **Quest Failure**: One or more Fail actions (or 2+ for Quest 4 in 7+ games)

### Win Conditions (Phase 3)

| Condition | Winner | Next Phase |
|-----------|--------|------------|
| 3 Quests Succeed | Good | Game Over (Phase 4 adds Assassin) |
| 3 Quests Fail | Evil | Game Over |
| 5 Consecutive Rejections | Evil | Game Over |

_Note: Assassin phase (Merlin guess after Good wins) deferred to Phase 4._

---

## User Stories

### US1: View Game Board

**As a** player in an active game,
**I want to** see the current game state at a glance,
**So that** I can understand what's happening and make informed decisions.

**Acceptance Criteria:**

- [ ] AC1.1: Display 5 quest slots showing: pending, in progress, succeeded, failed
- [ ] AC1.2: Show current quest number (1-5)
- [ ] AC1.3: Display required team size for current quest
- [ ] AC1.4: Show special rules (e.g., "2 fails required") when applicable
- [ ] AC1.5: Display current leader with visual indicator
- [ ] AC1.6: Show vote track (0-5 rejections, 5 = Evil wins)
- [ ] AC1.7: Display all players in **seating order** (randomized at game start)
- [ ] AC1.8: Show score: Quests Won (Good) vs Quests Lost (Evil)
- [ ] AC1.9: Game board updates in real-time as state changes
- [ ] AC1.10: Show direction indicator for leader rotation (clockwise through seating)

---

### US2: Propose Quest Team (Leader)

**As the** current leader,
**I want to** select players for the quest team,
**So that** we can vote on my proposed team.

**Acceptance Criteria:**

- [ ] AC2.1: Only current leader sees team selection controls
- [ ] AC2.2: Display all players as selectable options
- [ ] AC2.3: Show required team size (e.g., "Select 3 players")
- [ ] AC2.4: Leader can select/deselect players (including themselves)
- [ ] AC2.5: Visual feedback shows selected players
- [ ] AC2.6: Cannot select more players than required
- [ ] AC2.7: "Propose Team" button enabled only when exact count selected
- [ ] AC2.8: After proposal, game transitions to voting phase
- [ ] AC2.9: All players see the proposed team in real-time

---

### US3: Vote on Team Proposal

**As a** player in a game during voting phase,
**I want to** vote to approve or reject the proposed team,
**So that** I can influence which players go on quests.

**Acceptance Criteria:**

- [ ] AC3.1: All players see "Approve" and "Reject" voting buttons
- [ ] AC3.2: Player can only vote once per proposal
- [ ] AC3.3: Player's own vote is confirmed with visual feedback
- [ ] AC3.4: Show which players have voted (without revealing their vote)
- [ ] AC3.5: Votes are hidden until all players have voted
- [ ] AC3.6: When all votes are in, reveal all votes simultaneously
- [ ] AC3.7: Show vote breakdown (X Approve, Y Reject)
- [ ] AC3.8: If approved (majority), transition to quest phase
- [ ] AC3.9: If rejected, increment vote track and pass leadership
- [ ] AC3.10: If 5th rejection, Evil wins immediately

---

### US4: Execute Quest (Team Member)

**As a** player on the quest team,
**I want to** secretly choose Success or Fail,
**So that** I can contribute to (or sabotage) the quest.

**Acceptance Criteria:**

- [ ] AC4.1: Only quest team members see action selection
- [ ] AC4.2: Good players see only "Success" option (cannot fail)
- [ ] AC4.3: Evil players see both "Success" and "Fail" options
- [ ] AC4.4: Player can only submit once per quest
- [ ] AC4.5: Show which team members have submitted (not what they chose)
- [ ] AC4.6: Non-team players see waiting state
- [ ] AC4.7: Actions are not revealed until all team members submit
- [ ] AC4.8: When all submitted, reveal shuffled results (not who played what)

---

### US5: View Quest Results

**As a** player in a game,
**I want to** see the quest results clearly,
**So that** I can analyze what happened and adjust my strategy.

**Acceptance Criteria:**

- [ ] AC5.1: Display total Success and Fail cards played (shuffled, anonymous)
- [ ] AC5.2: Clearly indicate if quest Succeeded or Failed
- [ ] AC5.3: For Quest 4 in 7+ games, show "2 fails required" reminder
- [ ] AC5.4: Update quest tracker with result (green checkmark or red X)
- [ ] AC5.5: Update game score
- [ ] AC5.6: Show brief results summary before continuing
- [ ] AC5.7: "Continue" button (or auto-advance after delay) to proceed
- [ ] AC5.8: Reset vote track to 0 after successful quest vote
- [ ] AC5.9: Pass leadership to next player for next quest

---

### US6: Win/Lose Game

**As a** player in a game,
**I want to** know when the game ends and who won,
**So that** I can celebrate or commiserate appropriately.

**Acceptance Criteria:**

- [ ] AC6.1: Detect when either team has won 3 quests
- [ ] AC6.2: Detect when 5 consecutive team rejections occur
- [ ] AC6.3: Display prominent "Game Over" screen
- [ ] AC6.4: Show winning team (Good or Evil)
- [ ] AC6.5: For 5-rejection loss, show "Evil wins by chaos!"
- [ ] AC6.6: For 3 quest wins by Evil, show "Evil wins by sabotage!"
- [ ] AC6.7: For 3 quest wins by Good, show "Good wins!" (Assassin phase in Phase 4)
- [ ] AC6.8: Reveal all player roles at game end
- [ ] AC6.9: Show game summary (quest results, key moments)
- [ ] AC6.10: Option to return to lobby or leave room

---

### US7: Track Game History

**As a** player in an active game,
**I want to** see history of past events,
**So that** I can review voting patterns and make deductions.

**Acceptance Criteria:**

- [ ] AC7.1: Show log of past quests with results
- [ ] AC7.2: Show voting record for each team proposal (who approved/rejected)
- [ ] AC7.3: Show who was on each quest team
- [ ] AC7.4: Show quest outcomes (Success/Fail card counts)
- [ ] AC7.5: History is scrollable and doesn't clutter main game view
- [ ] AC7.6: Voting records help players identify suspicious patterns

---

### US8: Handle Disconnections

**As a** player in an active game,
**I want** the game to handle disconnections gracefully,
**So that** temporary issues don't ruin the game.

**Acceptance Criteria:**

- [ ] AC8.1: If a player disconnects, show disconnected status to others
- [ ] AC8.2: Game pauses if disconnected player needs to act (voting, quest action)
- [ ] AC8.3: Reconnecting player resumes with their current state
- [ ] AC8.4: Show waiting message while player is disconnected
- [ ] AC8.5: (Future) Timer for auto-action if disconnected too long

---

## State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GAME STATES                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                   │
│  │   STARTED    │ (all roles confirmed)                             │
│  └──────┬───────┘                                                   │
│         │ randomize seating, pick leader                            │
│         ▼                                                            │
│  ┌──────────────┐     propose team                                  │
│  │TEAM_BUILDING │ ──────────────────┐                               │
│  └──────────────┘                   │                               │
│         ▲                           ▼                               │
│         │                    ┌──────────────┐                       │
│         │                    │   VOTING     │                       │
│         │                    └──────┬───────┘                       │
│         │                           │                               │
│         │            ┌──────────────┼──────────────┐                │
│         │            │              │              │                │
│         │       rejected      5th reject      approved              │
│         │            │              │              │                │
│         │            ▼              ▼              ▼                │
│         │     (pass leader)  ┌──────────────┐ ┌──────────────┐     │
│         └────────────────────│  EVIL_WINS   │ │    QUEST     │     │
│                              │  (5 rejects) │ │  (executing) │     │
│                              └──────────────┘ └──────┬───────┘     │
│                                                      │              │
│                                          ┌───────────┴───────────┐  │
│                                          │                       │  │
│                                     succeeded               failed  │
│                                          │                       │  │
│                                          ▼                       ▼  │
│                              ┌──────────────────────────────────┐   │
│                              │          QUEST_RESULT            │   │
│                              └──────────────┬───────────────────┘   │
│                                             │                       │
│                    ┌────────────────────────┼────────────────────┐  │
│                    │                        │                    │  │
│              3 successes              < 3 each             3 failures│
│                    │                        │                    │  │
│                    ▼                        ▼                    ▼  │
│         ┌──────────────────┐     ┌──────────────┐    ┌───────────┐  │
│         │    GOOD_WINS     │     │ TEAM_BUILDING│    │ EVIL_WINS │  │
│         │   (game over)    │     │ (next quest) │    │(3 failures)│  │
│         └──────────────────┘     └──────────────┘    └───────────┘  │
│                                                                      │
│  Note: Phase 4 will add ASSASSIN_PHASE between GOOD_WINS check      │
│        and actual game end                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Leader selects themselves for team | Allowed - valid strategy |
| All Evil players on same team | Allowed - Evil can choose to all succeed |
| Leader disconnects during team building | Wait for reconnection (no timeout in Phase 3) |
| Player votes then disconnects | Vote is recorded, game continues |
| Quest member disconnects before submitting | Wait for reconnection |
| Last quest with team of 5 | All players are on quest team |
| Vote exactly tied (even players) | Rejection (majority required to approve) |
| Evil player on Quest 4 (2 fails required) | Can still choose single Fail - just needs ally |
| Player refreshes during voting | Should see their vote was already cast |
| Browser tab inactive | Game state syncs on return |

---

## Functional Requirements

### Game State Management

- FR-301: System MUST track game phase (team_building, voting, quest, quest_result, assassin_phase, game_over)
- FR-302: System MUST track current quest number (1-5)
- FR-303: System MUST track current leader (player ID)
- FR-304: System MUST track vote rejection count (0-5)
- FR-305: System MUST track quest results (array of success/fail)
- FR-306: System MUST enforce state transitions based on game rules

### Team Building Phase

- FR-310: System MUST only accept team proposals from current leader
- FR-311: System MUST validate team size matches quest requirement
- FR-312: System MUST allow any player (including leader) to be on team
- FR-313: System MUST broadcast proposed team to all players

### Voting Phase

- FR-320: System MUST accept exactly one vote per player per proposal
- FR-321: System MUST hide individual votes until all votes received
- FR-322: System MUST reveal all votes simultaneously when complete
- FR-323: System MUST calculate approval (majority approve = pass)
- FR-324: System MUST handle tie as rejection
- FR-325: System MUST increment rejection count on rejected vote
- FR-326: System MUST reset rejection count after approved team goes on quest
- FR-327: System MUST trigger Evil win if rejection count reaches 5

### Quest Phase

- FR-330: System MUST only accept quest actions from team members
- FR-331: System MUST restrict Good players to Success action only
- FR-332: System MUST allow Evil players Success or Fail action
- FR-333: System MUST accept exactly one action per team member
- FR-334: System MUST hide actions until all team members submit
- FR-335: System MUST shuffle and reveal actions (no attribution)
- FR-336: System MUST calculate quest result (fail if any Fail cards, or 2+ for Quest 4 in 7+)

### Win Conditions

- FR-340: System MUST track quest success count for Good team
- FR-341: System MUST track quest failure count for Evil team
- FR-342: System MUST trigger Good win (game over) when Good reaches 3 successes (Phase 4 adds Assassin)
- FR-343: System MUST trigger Evil win when Evil reaches 3 failures
- FR-344: System MUST trigger Evil win when rejection count reaches 5
- FR-345: System MUST reveal all player roles at game end

### Seating Order & Leader Rotation

- FR-350: System MUST randomize player seating order when game starts (after all roles confirmed)
- FR-351: System MUST select first leader randomly from seating order
- FR-352: System MUST rotate leader clockwise (through seating order) after each vote
- FR-353: System MUST persist leader through quest execution
- FR-354: System MUST display seating order to all players (shows rotation direction)
- FR-355: System MUST rotate leader after quest completes to next player in seating order

### Real-time Updates

- FR-360: System MUST broadcast state changes to all connected players
- FR-361: System MUST sync game state for reconnecting players
- FR-362: System MUST show connection status for all players

---

## Non-Functional Requirements

- NFR-301: Game state updates must reach all clients within 3 seconds
- NFR-302: Quest action submission must be cryptographically shuffled (no timing attacks)
- NFR-303: Vote reveals must be atomic (no partial reveals)
- NFR-304: Game state must be recoverable from database (no client-only state)
- NFR-305: Support concurrent games without interference

---

## Key Entities

| Entity | Attributes |
|--------|------------|
| Game | room_id, current_quest (1-5), current_leader_id, phase, vote_track (0-5), quest_results[], seating_order[] |
| Quest | game_id, quest_number, team_size, fails_required, status, team_members[], result |
| TeamProposal | game_id, quest_number, proposal_number, leader_id, team_member_ids[], status |
| Vote | proposal_id, player_id, vote (approve/reject), created_at |
| QuestAction | quest_id, player_id, action (success/fail), created_at |
| SeatingOrder | game_id, player_id, position (1-N), is_current_leader |

---

## Open Questions

1. Should we implement a game timer for phases (e.g., 2 min to vote)?
2. Should observers be able to watch games?
3. How should we handle a player who leaves mid-game permanently?
4. Should game chat be included in this phase?
5. What analytics/stats should we track for future features?

---

## Success Metrics

- Players can complete a full 5-quest game without errors
- Game state remains consistent across all clients
- No accidental information leaks (votes, quest actions revealed early)
- Average game completion time is reasonable (15-30 minutes)
- Disconnection/reconnection works smoothly


