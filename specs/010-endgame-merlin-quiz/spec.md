# Feature Specification: Endgame Merlin Quiz

**Feature Branch**: `010-endgame-merlin-quiz`
**Created**: 2025-12-20
**Status**: Draft
**Input**: User description: "At the end of the game, before showing roles, add a quiz for all players to guess who was Merlin. Display results as a table showing player names and vote counts. Must be carefully designed to not interfere with the Assassin phase mechanics."

## Critical Analysis: Assassin Phase Protection

This feature introduces a "fun quiz" at game end where all players guess who was Merlin. **This MUST NOT interfere with the official Assassin phase mechanics.** Here's the analysis of all game end scenarios:

### Game End Scenarios

| Scenario | Game Flow | Assassin Phase? | Quiz Safe? |
|----------|-----------|-----------------|------------|
| Evil wins (3 quest failures) | quest_result → game_over | No | ✅ Yes |
| Evil wins (5 rejections) | voting → game_over | No | ✅ Yes |
| Good wins 3 quests (Merlin exists) | quest → **assassin** → game_over | **Yes - happens FIRST** | ✅ Yes (after) |
| Good wins 3 quests (no Merlin) | quest → game_over | No (no Merlin to kill) | ❌ N/A - No quiz |

### Protection Guarantee

The quiz is **completely isolated** from the Assassin phase because:

1. **Timing**: Quiz only appears at `game_over` phase - AFTER the Assassin has already made their official guess
2. **No game impact**: Quiz votes do NOT affect the game outcome (which is already decided)
3. **Separate UI**: Quiz is a distinct panel from the Assassin guessing interface
4. **No Merlin = No Quiz**: If Merlin role wasn't in the game, quiz doesn't appear

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - All Players Guess Merlin After Game Ends (Priority: P1)

As a player in a completed game with Merlin, I want to guess who I think was Merlin before seeing the revealed roles, so I can test my deduction skills and compare with other players.

**Why this priority**: This is the core feature - without it, there is no quiz functionality.

**Independent Test**: Can be fully tested by completing a game with Merlin role and verifying all players see the quiz interface and can submit guesses.

**Acceptance Scenarios**:

1. **Given** a game has ended (any win condition) and Merlin was in the game, **When** the game over screen appears, **Then** all players see a "Guess the Merlin" quiz panel before the role reveal section.

2. **Given** a player is viewing the quiz panel, **When** they select a player and submit their guess, **Then** their vote is recorded and they see a "waiting for others" state.

3. **Given** all players have submitted their guesses, **When** the last vote is recorded, **Then** all players see the quiz results table showing each player's name and how many votes they received as "suspected Merlin".

4. **Given** a game ended but Merlin role was NOT in the game, **When** the game over screen appears, **Then** the quiz panel does NOT appear (skip directly to role reveal).

---

### User Story 2 - View Quiz Results Before Role Reveal (Priority: P1)

As a player who has submitted my Merlin guess, I want to see how everyone voted before the actual roles are revealed, so I can compare my deduction with others.

**Why this priority**: The value of the quiz is seeing the results - this completes the core feature loop.

**Independent Test**: Can be tested by having multiple players submit guesses and verifying the results table displays correctly with vote counts.

**Acceptance Scenarios**:

1. **Given** all players have submitted guesses, **When** results are displayed, **Then** I see a table with all player names and their vote counts (e.g., "Alice: 3 votes, Bob: 2 votes, Charlie: 0 votes").

2. **Given** the quiz results are displayed, **When** I view the results, **Then** I can see which player received the most votes as "suspected Merlin" (highlighted or indicated).

3. **Given** the quiz results are displayed, **When** I click "Show Roles" or proceed, **Then** the actual role reveal section appears below the results.

---

### User Story 3 - Continue Without Full Participation (Priority: P2)

As a player who wants to see the game results, I should be able to proceed even if some players don't submit their quiz guesses.

**Why this priority**: Important for usability but not core - prevents the game from being stuck.

**Independent Test**: Can be tested by having some players submit and others not, then triggering the skip/timeout mechanism.

**Acceptance Scenarios**:

1. **Given** the quiz is active and some players haven't submitted, **When** a configurable timeout passes (default: 60 seconds), **Then** the quiz automatically closes and shows results with only submitted votes.

2. **Given** the quiz is active, **When** a player clicks "Skip Quiz" (individual opt-out), **Then** that player's vote is recorded as "no vote" and they wait for results like others.

3. **Given** all remaining connected players have voted or skipped, **When** only disconnected players remain, **Then** the quiz proceeds to results without waiting for disconnected players.

---

### Edge Cases

- **What happens when there's only 1 player connected at game end?** Quiz still shows but auto-completes after their vote or skip.
- **What happens if a player disconnects mid-quiz?** Their pending vote is marked as "no vote" and quiz proceeds.
- **What happens if all players skip?** Results show with 0 votes for all players.
- **What happens if the actual Merlin guesses themselves?** Allowed - it's a fun quiz, no restrictions.
- **Can evil players participate?** Yes - all players participate regardless of alignment.
- **Can the Assassin participate?** Yes - this is separate from the official Assassin phase which already completed.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST only display the Merlin quiz when the game had a Merlin role assigned.
- **FR-002**: System MUST only display the quiz after the game has reached `game_over` phase (ensuring Assassin phase, if applicable, has already completed).
- **FR-003**: System MUST allow all players (good and evil, including Merlin and Assassin) to participate in the quiz.
- **FR-004**: System MUST allow each player to vote for exactly one player as "suspected Merlin" (or skip).
- **FR-005**: System MUST prevent players from voting for themselves in the quiz (players must select another player).
- **FR-006**: System MUST display quiz results as a table showing player names and vote counts.
- **FR-007**: System MUST highlight the player(s) with the most votes in the results.
- **FR-008**: System MUST show the role reveal section only AFTER quiz results are displayed (or quiz is skipped/timed out).
- **FR-009**: System MUST implement a timeout mechanism to prevent quiz from blocking game end indefinitely.
- **FR-010**: System MUST persist quiz votes to allow results to be displayed to all players simultaneously.
- **FR-011**: System MUST NOT allow quiz votes to affect the game outcome in any way.
- **FR-012**: System MUST NOT reveal any role information during the quiz phase.

### Key Entities

- **MerlinQuizVote**: Represents a single player's guess for who they think is Merlin. Attributes: game_id, voter_player_id, suspected_player_id (or null if skipped), submitted_at timestamp.
- **MerlinQuizState**: Represents the current state of the quiz for a game. Attributes: game_id, quiz_active (boolean), votes_submitted_count, total_expected_votes, started_at, timeout_at.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players in a game with Merlin can submit their quiz guess within 60 seconds of game end.
- **SC-002**: Quiz results display within 2 seconds of all votes being submitted or timeout reached.
- **SC-003**: Quiz feature does not appear in games where Merlin role was not assigned.
- **SC-004**: Quiz phase does not delay role reveal by more than 90 seconds maximum (timeout + processing).
- **SC-005**: 100% of Assassin phase mechanics remain unchanged - quiz never appears before or during Assassin phase.

---

## Assumptions

- The quiz is a "fun" social feature and does not affect game mechanics or scoring.
- All players see the same results simultaneously after the quiz completes.
- The host does not need special controls to enable/disable this feature (it's always active when Merlin is in the game).
- Vote counts are anonymous in results (shows "3 votes" not "Alice, Bob, Charlie voted for this player").
- The quiz timeout of 60 seconds is reasonable for casual gameplay.
