# Feature Specification: Center Game Messages

**Feature Branch**: `008-center-game-messages`
**Created**: 2025-12-05
**Status**: Draft
**Input**: User description: "I want a UI change, I want you to remove the 'Round table' in the middle and instead use that area to show the message about the game, like 'Quest 1, select 2 players for the quest', use that area for showing the messages about the game progress."

## Problem Statement

Currently, the center of the player circle displays a static "ROUND TABLE" label that provides no informational value to players. This prime visual real estate could be better utilized to display dynamic game status messages, improving player awareness of the current game state and required actions.

Players must currently look at multiple UI locations to understand what's happening in the game. By consolidating key game status information in the center of the player circle (the natural focal point), we can improve usability and reduce cognitive load.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Current Quest and Phase Information (Priority: P1)

As a player in any role (leader, team member, or observer), I want to see the current quest number and game phase at a glance so I can understand what's happening in the game without searching multiple UI areas.

**Why this priority**: This is the foundational improvement that provides immediate value. Players need to know which quest they're on and what phase is active (team building, voting, quest execution, etc.).

**Independent Test**: Can be fully tested by starting a game, navigating through different phases, and verifying that the center area always displays the current quest number and phase description.

**Acceptance Scenarios**:

1. **Given** a game is in team building phase for Quest 1, **When** any player views the game board, **Then** the center circle displays "Quest 1" and the current phase action
2. **Given** a game advances from Quest 1 to Quest 2, **When** any player views the game board, **Then** the center circle updates to show "Quest 2"
3. **Given** a game transitions from team building to voting phase, **When** any player views the game board, **Then** the center circle message updates to reflect the voting phase

---

### User Story 2 - See Leader and Team Size Context (Priority: P1)

As a non-leader player, I want to see who is currently leading and how many players they need to select so I can understand what to expect and follow the game flow.

**Why this priority**: This provides essential context for team building phases. Players need to know who's making decisions and what the team composition should be.

**Independent Test**: Can be fully tested by observing the center area during team building phase with different leaders and quest requirements.

**Acceptance Scenarios**:

1. **Given** Player A is the leader for Quest 1 requiring 2 players, **When** any player views the game board, **Then** the center displays "[Leader Name] is selecting a team" and "Select 2 players for the quest"
2. **Given** the leader changes to Player B for Quest 2 requiring 3 players, **When** any player views the game board, **Then** the center updates to show Player B's name and the new requirement
3. **Given** a player is the leader themselves, **When** they view the game board, **Then** the center displays "Select [N] players for the quest" in an actionable manner

---

### User Story 3 - Understand Current Player Actions Required (Priority: P2)

As any player, I want to see clear messages about what action is currently needed so I know when it's my turn to act and what I should do.

**Why this priority**: This improves the game flow by making it clear when players need to take action (vote, submit quest action, etc.).

**Independent Test**: Can be fully tested by progressing through a full game and verifying appropriate messages appear for each phase requiring player input.

**Acceptance Scenarios**:

1. **Given** the game is in voting phase, **When** any player views the game board, **Then** the center displays "Vote on the proposed team"
2. **Given** a player is on the quest team during quest execution, **When** they view the game board, **Then** the center displays "Submit your quest action"
3. **Given** the game is in Assassin phase, **When** the Assassin views the game board, **Then** the center displays "Assassin: Select your target"

---

### Edge Cases

- What happens when the player's nickname is very long? (Ensure truncation or wrapping doesn't break the layout)
- How does the center display messages during rapid phase transitions? (Messages should update smoothly without flickering)
- What message is shown during game-over state? (Display final outcome: "Good Wins" or "Evil Wins")
- How are special phases like "Lady of the Lake" indicated? (Show "Lady of the Lake Investigation" or similar)
- What if the center area needs to show multi-line text? (Ensure consistent formatting and readability)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the current quest number in the center circle during all active game phases
- **FR-002**: System MUST show the current game phase description (team building, voting, quest execution, etc.) in the center circle
- **FR-003**: System MUST display the leader's nickname during team building phases
- **FR-004**: System MUST show the required team size for the current quest during team building
- **FR-005**: System MUST update the center message immediately when the game phase changes
- **FR-006**: System MUST display contextual action prompts based on the player's role and current phase (e.g., "Submit your vote", "Select players")
- **FR-007**: System MUST show clear game-over messages when the game ends (Good Wins/Evil Wins)
- **FR-008**: Center messages MUST be readable against the existing background styling (proper contrast and sizing)
- **FR-009**: System MUST truncate or wrap long nicknames to prevent layout breaking
- **FR-010**: System MUST display specific messages for special phases (Assassin phase, Lady of the Lake investigation)

### Key Entities

- **Game Phase**: Represents the current state of the game (team_building, voting, quest, quest_result, assassin, lady_of_lake, game_over)
- **Quest Information**: Quest number, team size requirement, phase context
- **Player Context**: Leader identity, current player's role in the phase

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can identify the current quest number and phase within 1 second of viewing the game board (measured by eye-tracking or user feedback)
- **SC-002**: New players understand whose turn it is without external explanation in 95% of test cases
- **SC-003**: Center messages update within 500ms of game phase transitions (measured client-side)
- **SC-004**: User confusion about game state (measured by support questions or user testing) decreases by at least 40%
- **SC-005**: All center messages are readable (contrast ratio ≥ 4.5:1) across all game phases

## Assumptions

1. The center circle area will maintain its current visual design (brown gradient with border) - only the content changes
2. Messages will be plain text without icons or complex formatting (unless specified later)
3. The player circle layout and positions remain unchanged
4. Messages should be concise (ideally 1-2 lines) to fit the center circle
5. The existing "ROUND TABLE" branding can be completely removed without affecting user expectations
6. All game phases already have clear internal identifiers that can be mapped to display messages
