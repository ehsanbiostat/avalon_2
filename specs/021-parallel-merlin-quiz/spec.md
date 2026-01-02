# Feature Specification: Parallel Merlin Quiz

**Feature Branch**: `021-parallel-merlin-quiz`
**Created**: 2026-01-02
**Status**: Draft
**Input**: User description: "After the game has finished, change the Merlin quiz flow: If evil wins 3 missions, show quiz for everyone except Percival and Merlin. If good wins 3 missions, start quiz for everyone except Assassin immediately while Assassin sees assassination page, to prevent bias from knowing who is being assassinated."

## Clarifications

### Session 2026-01-02

- Q: Should other Evil players (Morgana, Mordred, Oberon, Minions, Lunatic, Brute) participate in the quiz? → A: Yes, all Evil players except Assassin participate in the quiz
- Q: Should quiz be shown when Evil wins via 5 rejections (not just 3 quest failures)? → A: Yes, show quiz on ANY Evil victory (3 failures or 5 rejections)
- Q: Should Percival skip quiz when Morgana is in the game (Percival has uncertainty)? → A: Percival participates in quiz when Morgana is present; skips only when no Morgana
- Q: Is the quiz mandatory or can players skip? → A: Quiz is optional - players can let it timeout without submitting
- Q: What does the waiting screen show? → A: Vote count without names (e.g., "4 of 7 players have voted")
- Q: Should the Assassin be aware that the quiz is happening in parallel? → A: No, Assassin's screen remains unchanged with no indication of parallel quiz
- Q: What happens when Good wins but there's no Assassin role? → A: Good wins immediately, but quiz is still shown for engagement before results
- Q: What is the quiz timeout duration? → A: 60 seconds
- Q: How should quiz results be displayed? → A: Full breakdown showing each player's guess (who voted for whom) plus aggregate statistics, with light and intuitive UI
- Q: When does the game transition to results? → A: Assassin has no timeout (must submit); Quiz has 60-second timeout or all votes in; transition occurs when BOTH conditions are met

## Problem Statement

Currently, when Good wins 3 quests, the game flow is:
1. Assassin phase begins - all players see who the Assassin is targeting
2. Once Assassin makes their choice, the game ends
3. Only then does the Merlin quiz begin for all players

This creates **bias** because non-Assassin players hear the Evil team's discussion and see who is being assassinated before they make their own guess. Their "gut feeling" about who Merlin was gets influenced by the Assassin's logic.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Good Wins: Parallel Quiz and Assassination (Priority: P1)

When Good wins 3 quests, all non-Assassin players immediately see the Merlin quiz while the Assassin simultaneously sees their assassination target selection (unchanged from current UI, with no indication of parallel quiz). This ensures players make unbiased guesses before knowing the Assassin's choice.

**Why this priority**: This is the core feature - preventing bias is the entire purpose of this change.

**Independent Test**: Start a game with Merlin, complete 3 successful quests, verify non-Assassin players see quiz immediately while Assassin sees target selection.

**Acceptance Scenarios**:

1. **Given** a game with Merlin where Good wins 3 quests, **When** the final quest succeeds, **Then** all non-Assassin players (including all Evil teammates) immediately see the Merlin quiz screen
2. **Given** a game with Merlin where Good wins 3 quests, **When** the final quest succeeds, **Then** the Assassin sees their target selection screen (unchanged, no indication of parallel quiz)
3. **Given** a game where the Assassin has not yet chosen, **When** a non-Assassin player submits their quiz guess, **Then** they see a waiting screen showing vote count (e.g., "4 of 7 players have voted")
4. **Given** the quiz is complete (all votes OR 60-second timeout) AND Assassin has submitted, **When** both conditions are met, **Then** all players proceed to the game results screen together
5. **Given** Assassin submits in 20 seconds but quiz is still running, **When** quiz timeout hasn't elapsed, **Then** game waits until quiz completes (all votes or 60 seconds)

---

### User Story 2 - Evil Wins: Quiz for Eligible Players (Priority: P2)

When Evil wins (3 quest failures OR 5 vote rejections), the Merlin quiz is shown to all players except Merlin. Percival skips only when Morgana is NOT in the game (since Percival has certainty); when Morgana is present, Percival participates (has 50/50 uncertainty).

**Why this priority**: Extends the quiz experience to evil victory scenarios, adding engagement for all players.

**Independent Test**: Start a game with Merlin and Percival, complete 3 failed quests, verify quiz appears for appropriate players.

**Acceptance Scenarios**:

1. **Given** a game with Merlin where Evil wins 3 quests, **When** the final quest fails, **Then** all players except Merlin see the Merlin quiz screen
2. **Given** a game where Evil wins by 5 consecutive vote rejections, **When** the 5th rejection occurs, **Then** all players except Merlin see the Merlin quiz screen
3. **Given** a player who is Merlin, **When** Evil wins, **Then** Merlin skips the quiz and sees a waiting screen with vote count until others complete
4. **Given** a player who is Percival in a game WITHOUT Morgana, **When** Evil wins, **Then** Percival skips the quiz (knows Merlin with certainty)
5. **Given** a player who is Percival in a game WITH Morgana, **When** Evil wins, **Then** Percival participates in the quiz (has uncertainty between Merlin and Morgana)

---

### User Story 3 - Quiz Submission During Parallel Phase (Priority: P2)

Players can submit their quiz guesses at any time during the parallel phase. Quiz is optional - players can let the 60-second timeout elapse without submitting, and the game proceeds regardless.

**Why this priority**: Good UX is essential for the parallel flow to work smoothly.

**Independent Test**: Submit quiz guess, verify immediate confirmation and waiting state.

**Acceptance Scenarios**:

1. **Given** a player viewing the quiz during the parallel phase, **When** they submit their guess, **Then** they see confirmation that their vote is recorded
2. **Given** a player who has submitted their guess, **When** waiting for others, **Then** they see vote count without names (e.g., "4 of 7 players have voted")
3. **Given** a player who does not submit within 60 seconds, **When** the timeout elapses, **Then** their vote is recorded as "no guess" and game proceeds
4. **Given** all eligible players have voted before timeout, **When** the last vote is submitted, **Then** quiz is considered complete (no need to wait for full 60 seconds)

---

### User Story 4 - Good Wins Without Assassin Role (Priority: P2)

In configurations where Merlin exists but Assassin does not, when Good wins 3 quests, Good wins immediately but the quiz is still shown for engagement before revealing results.

**Why this priority**: Edge case that should still provide the quiz engagement experience.

**Independent Test**: Configure game with Merlin but no Assassin, complete 3 successful quests, verify quiz appears for all players.

**Acceptance Scenarios**:

1. **Given** a game with Merlin but no Assassin where Good wins 3 quests, **When** the final quest succeeds, **Then** all players see the Merlin quiz (Good has already won)
2. **Given** the quiz phase in a no-Assassin game, **When** quiz completes (all votes or timeout), **Then** results show Good victory with quiz statistics

---

### User Story 5 - Game Results After Parallel Phase (Priority: P3)

After both the quiz and assassination are complete, all players see the game results including detailed quiz breakdown and assassination outcome.

**Why this priority**: The results screen is the payoff - showing who guessed correctly.

**Independent Test**: Complete a game, verify results show quiz statistics and assassination outcome together.

**Acceptance Scenarios**:

1. **Given** the parallel phase is complete (quiz + assassination), **When** results are displayed, **Then** players see who the Assassin targeted and whether they found Merlin
2. **Given** the parallel phase is complete, **When** results are displayed, **Then** players see full quiz breakdown: each player's guess and who they voted for
3. **Given** the parallel phase is complete, **When** results are displayed, **Then** players see aggregate statistics (e.g., "4 of 7 players guessed correctly")
4. **Given** a Good victory scenario, **When** results are displayed, **Then** the final winner (Good or Evil) is determined by whether Assassin found Merlin
5. **Given** results are displayed, **When** viewing quiz breakdown, **Then** UI is light, intuitive, and easy to understand (not overwhelming)

---

### Edge Cases

- What happens if a player disconnects during the parallel quiz phase? → Quiz proceeds; disconnected player's guess is recorded as "no guess" when timeout elapses.
- What happens if Assassin disconnects during parallel phase? → Game waits indefinitely for Assassin (no timeout); may require manual intervention.
- What if Merlin doesn't exist in the game? → No quiz is shown (same as current behavior).
- What if a game has no Percival when Evil wins? → All players except Merlin see the quiz.
- What if a player skips the quiz intentionally? → Their "no guess" is recorded; they appear in results as "did not vote."

## Requirements *(mandatory)*

### Functional Requirements

**Quiz Eligibility:**
- **FR-001**: When Good wins 3 quests and Merlin exists, the system MUST immediately show the quiz to all players except the Assassin (including all Evil teammates)
- **FR-002**: When Good wins 3 quests and Merlin exists, the Assassin MUST see the target selection screen (unchanged from current, no indication of parallel quiz)
- **FR-003**: When Evil wins (3 quest failures OR 5 vote rejections) and Merlin exists, the system MUST show the quiz to all players except Merlin
- **FR-004**: Merlin MUST NOT see the quiz (they know who they are)
- **FR-005**: Percival MUST skip the quiz when Evil wins AND Morgana is NOT in the game (has certainty)
- **FR-006**: Percival MUST participate in the quiz when Evil wins AND Morgana IS in the game (has uncertainty)
- **FR-007**: When Good wins but no Assassin role exists, the system MUST show quiz to all players (Good has already won)

**Waiting & Progress:**
- **FR-008**: Players who are exempt from the quiz MUST see a waiting screen showing vote count without names (e.g., "4 of 7 players have voted")
- **FR-009**: Players who submit their quiz guess MUST see their selection confirmed, then transition to waiting screen with vote count

**Timing & Transitions:**
- **FR-010**: Quiz phase MUST have a 60-second timeout
- **FR-011**: Assassin phase MUST have no timeout - game waits indefinitely for Assassin's choice
- **FR-012**: The game MUST NOT transition to results until BOTH conditions are met: (1) Assassin has submitted, AND (2) quiz is complete (all votes OR 60-second timeout)
- **FR-013**: Quiz is optional - players MAY let it timeout without submitting a guess

**Results Display:**
- **FR-014**: Quiz results and assassination outcome MUST be revealed together on the results screen
- **FR-015**: Results MUST show full breakdown: each player's guess (who voted for whom)
- **FR-016**: Results MUST show aggregate statistics (e.g., "X of Y players guessed correctly")
- **FR-017**: Results UI MUST be light, intuitive, and easy to understand
- **FR-018**: Players who did not submit a guess MUST appear in results as "did not vote"

**Isolation:**
- **FR-019**: The Assassin MUST NOT see any indication that the quiz is happening in parallel
- **FR-020**: The Assassin MUST NOT see other players' quiz submissions while making their choice

### Key Entities

- **ParallelPhaseState**: Tracks whether the game is in parallel quiz/assassination mode, includes:
  - `quiz_votes`: Map of player_id → guessed_player_id (or null for no vote)
  - `quiz_start_time`: Timestamp when quiz began (for 60-second timeout)
  - `assassin_submitted`: Boolean indicating if Assassin has made their choice
  - `eligible_quiz_players`: List of player IDs who should see the quiz

- **QuizEligibility**: Determines which players participate based on:
  - Game outcome (Good win vs Evil win)
  - Player role (Merlin always skips, Assassin skips on Good win)
  - Presence of Morgana (affects Percival eligibility on Evil win)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All eligible players can submit their Merlin guess before knowing the Assassin's target (0% bias from assassination reveal)
- **SC-002**: Quiz participation extends to Evil victory scenarios (both 3 failures and 5 rejections), increasing engagement for all players
- **SC-003**: The parallel flow completes within 60 seconds of quiz start (plus Assassin decision time)
- **SC-004**: Players experience smooth transitions between quiz, waiting, and results states with clear progress feedback (vote count visible)
- **SC-005**: Results screen clearly shows individual guesses and aggregate statistics in an intuitive, non-overwhelming format
