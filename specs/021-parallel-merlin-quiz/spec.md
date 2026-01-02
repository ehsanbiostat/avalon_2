# Feature Specification: Parallel Merlin Quiz

**Feature Branch**: `021-parallel-merlin-quiz`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "After the game has finished, change the Merlin quiz flow: If evil wins 3 missions, show quiz for everyone except Percival and Merlin. If good wins 3 missions, start quiz for everyone except Assassin immediately while Assassin sees assassination page, to prevent bias from knowing who is being assassinated."

## Problem Statement

Currently, when Good wins 3 quests, the game flow is:
1. Assassin phase begins - all players see who the Assassin is targeting
2. Once Assassin makes their choice, the game ends
3. Only then does the Merlin quiz begin for all players

This creates **bias** because non-Assassin players hear the Evil team's discussion and see who is being assassinated before they make their own guess. Their "gut feeling" about who Merlin was gets influenced by the Assassin's logic.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Good Wins: Parallel Quiz and Assassination (Priority: P1)

When Good wins 3 quests, all non-Assassin players immediately see the Merlin quiz while the Assassin simultaneously sees their assassination target selection. This ensures players make unbiased guesses before knowing the Assassin's choice.

**Why this priority**: This is the core feature - preventing bias is the entire purpose of this change.

**Independent Test**: Start a game with Merlin, complete 3 successful quests, verify non-Assassin players see quiz immediately while Assassin sees target selection.

**Acceptance Scenarios**:

1. **Given** a game with Merlin where Good wins 3 quests, **When** the final quest succeeds, **Then** all non-Assassin players immediately see the Merlin quiz screen
2. **Given** a game with Merlin where Good wins 3 quests, **When** the final quest succeeds, **Then** the Assassin sees their target selection screen (not the quiz)
3. **Given** a game where the Assassin has not yet chosen, **When** a non-Assassin player submits their quiz guess, **Then** they see a waiting screen indicating the Assassin is still choosing
4. **Given** all non-Assassin players have submitted quiz guesses, **When** the Assassin submits their guess, **Then** all players proceed to the game results screen together

---

### User Story 2 - Evil Wins: Quiz for Eligible Players (Priority: P2)

When Evil wins 3 quests, the Merlin quiz is shown to all players except Merlin and Percival (who already know Merlin's identity).

**Why this priority**: Extends the quiz experience to evil victory scenarios, adding engagement for all players.

**Independent Test**: Start a game with Merlin and Percival, complete 3 failed quests, verify quiz appears for non-Merlin/non-Percival players.

**Acceptance Scenarios**:

1. **Given** a game with Merlin where Evil wins 3 quests, **When** the final quest fails, **Then** all players except Merlin and Percival see the Merlin quiz screen
2. **Given** a player who is Merlin, **When** Evil wins 3 quests, **Then** Merlin skips the quiz and sees a waiting screen until others complete
3. **Given** a player who is Percival, **When** Evil wins 3 quests, **Then** Percival skips the quiz and sees a waiting screen until others complete
4. **Given** a game without Percival where Evil wins 3 quests, **When** the final quest fails, **Then** all players except Merlin see the quiz

---

### User Story 3 - Quiz Submission During Parallel Phase (Priority: P2)

Players can submit their quiz guesses at any time during the parallel phase, with immediate feedback and graceful waiting.

**Why this priority**: Good UX is essential for the parallel flow to work smoothly.

**Independent Test**: Submit quiz guess, verify immediate confirmation and waiting state.

**Acceptance Scenarios**:

1. **Given** a player viewing the quiz during the parallel phase, **When** they submit their guess, **Then** they see confirmation that their vote is recorded
2. **Given** a player who has submitted their guess, **When** waiting for others, **Then** they see a clear indication of how many players have voted
3. **Given** all players have completed their actions (quiz + assassination), **When** the last action is submitted, **Then** all players transition to results simultaneously

---

### User Story 4 - Game Results After Parallel Phase (Priority: P3)

After both the quiz and assassination are complete, all players see the game results including quiz statistics and assassination outcome.

**Why this priority**: The results screen is the payoff - showing who guessed correctly.

**Independent Test**: Complete a game, verify results show quiz statistics and assassination outcome together.

**Acceptance Scenarios**:

1. **Given** the parallel phase is complete (quiz votes + assassination), **When** results are displayed, **Then** players see who the Assassin targeted
2. **Given** the parallel phase is complete, **When** results are displayed, **Then** players see quiz statistics (who guessed Merlin correctly)
3. **Given** a Good victory scenario, **When** results are displayed, **Then** the final winner (Good or Evil) is determined by whether Assassin found Merlin

---

### Edge Cases

- What happens if a player disconnects during the parallel quiz phase? → Quiz times out per existing timeout logic; disconnected player's guess is not recorded.
- What happens if Assassin disconnects during parallel phase? → Same as current behavior; game may require manual intervention or timeout.
- What if Merlin doesn't exist in the game? → No quiz is shown (same as current behavior).
- What if a game has no Percival when Evil wins? → All players except Merlin see the quiz.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When Good wins 3 quests and Merlin exists, the system MUST immediately show the quiz to all players except the Assassin
- **FR-002**: When Good wins 3 quests and Merlin exists, the Assassin MUST see the target selection screen instead of the quiz
- **FR-003**: When Evil wins 3 quests and Merlin exists, the system MUST show the quiz to all players except Merlin and Percival
- **FR-004**: Merlin MUST NOT see the quiz (they know who they are)
- **FR-005**: Percival MUST NOT see the quiz when Evil wins (they know who Merlin is via game mechanics)
- **FR-006**: Players who are exempt from the quiz MUST see a waiting screen with progress indication
- **FR-007**: The system MUST track quiz submissions separately from assassination submission
- **FR-008**: The game MUST NOT transition to results until both the Assassin has submitted AND all eligible quiz votes are in (or timed out)
- **FR-009**: Quiz results and assassination outcome MUST be revealed together on the results screen
- **FR-010**: The existing quiz timeout logic MUST apply to the parallel phase
- **FR-011**: Players who submit their quiz guess MUST see their selection confirmed before seeing waiting state
- **FR-012**: The Assassin MUST NOT see other players' quiz submissions while making their choice

### Key Entities

- **ParallelPhaseState**: Tracks whether the game is in parallel quiz/assassination mode, who has submitted, and completion status
- **QuizEligibility**: Determines which players can/should participate in the quiz based on their role and game outcome

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All eligible players can submit their Merlin guess before knowing the Assassin's target (0% bias from assassination reveal)
- **SC-002**: Quiz participation extends to Evil victory scenarios, increasing engagement for all players
- **SC-003**: The parallel flow completes within the existing quiz timeout window (no additional wait time)
- **SC-004**: Players experience smooth transitions between quiz, waiting, and results states with clear progress feedback
