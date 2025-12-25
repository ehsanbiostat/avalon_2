# Feature Specification: Watcher Mode

**Feature Branch**: `015-watcher-mode`
**Created**: 2024-12-25
**Status**: Draft
**Input**: User description: "Add watcher/spectator mode for non-players to observe games without interaction"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Join as Watcher (Priority: P1) 🎯 MVP

A user wants to watch an ongoing Avalon game without participating. They have the room code and want to observe how their friends are playing.

**Why this priority**: Core functionality - without this, the feature doesn't exist. Enables the primary use case of spectating friends' games.

**Independent Test**: Navigate to home page → enter room code → select "Watch" option → see live game state with disabled controls

**Acceptance Scenarios**:

1. **Given** a game is in progress, **When** a user enters the room code and selects "Watch", **Then** they are taken to the game view as a spectator
2. **Given** a game has not started yet (waiting room), **When** a user tries to watch, **Then** they see a message "Game hasn't started yet - watching will be available once the game begins"
3. **Given** 10 watchers are already watching, **When** an 11th user tries to watch, **Then** they see a message "This game has reached the maximum number of spectators (10)"
4. **Given** a user is watching a game, **When** they view the game board, **Then** all interactive controls (vote buttons, team selection, etc.) are disabled/hidden

---

### User Story 2 - Spectator View Experience (Priority: P1) 🎯 MVP

A watcher wants to follow the game in real-time, seeing the same information that would be visible to a neutral observer (no hidden roles, no unrevealed votes).

**Why this priority**: Defines what watchers actually see - critical for the feature to be useful and fair.

**Independent Test**: Watch a game → see player positions, current phase, quest track, and revealed information only

**Acceptance Scenarios**:

1. **Given** a watcher is viewing a game, **When** the game is in team_building phase, **Then** they see the leader, proposed team members, but NO player roles
2. **Given** a watcher is viewing a game, **When** players are voting, **Then** they see who has voted (checkmarks) but NOT the vote choices until reveal
3. **Given** a watcher is viewing a game, **When** votes are revealed, **Then** they see all vote choices (same as players)
4. **Given** a watcher is viewing a game, **When** a quest is in progress, **Then** they see who is on the quest but NOT individual success/fail choices until reveal
5. **Given** a watcher is viewing a game, **When** the quest result is revealed, **Then** they see the shuffled success/fail counts (same as players)
6. **Given** a watcher is viewing a game, **When** Lady of the Lake investigates, **Then** they see WHO was investigated but NOT the result (only the Lady holder knows)

---

### User Story 3 - Watcher Lifecycle (Priority: P2)

A watcher may need to leave and rejoin a game, or stay until the game ends.

**Why this priority**: Important for usability but not core to the watching experience itself.

**Independent Test**: Watch a game → leave → rejoin with same nickname → continue watching from current state

**Acceptance Scenarios**:

1. **Given** a watcher is viewing a game, **When** they close the browser or navigate away, **Then** they are removed from the watcher list (freeing up a slot)
2. **Given** a watcher previously left, **When** they rejoin with the same nickname, **Then** they see the current game state (no replay of missed events)
3. **Given** a game ends, **When** a watcher is viewing, **Then** they see the game over screen with all roles revealed (same as players)
4. **Given** a watcher is viewing, **When** they click a "Stop Watching" button, **Then** they are returned to the home page

---

### User Story 4 - Watcher Entry Flow (Priority: P2)

A user with a room code needs a clear way to choose between joining as a player or watching as a spectator.

**Why this priority**: UX flow - important for discoverability but secondary to core functionality.

**Independent Test**: Enter room code on home page → see option to "Join" or "Watch"

**Acceptance Scenarios**:

1. **Given** a user enters a valid room code, **When** the game is in progress, **Then** they see two options: "Join Room" (disabled with tooltip "Game in progress") and "Watch Game"
2. **Given** a user enters a valid room code, **When** the game hasn't started, **Then** they see "Join Room" enabled and "Watch Game" disabled with tooltip "Available after game starts"
3. **Given** a user has not entered a nickname, **When** they try to watch, **Then** they are prompted to enter a nickname first (same rules as players: 3-20 characters)

---

### Edge Cases

- What happens if a watcher's nickname matches a player's nickname?
  - Allow it - watchers and players are separate lists, nicknames can overlap
- What happens if the game is cancelled/room closes while watching?
  - Watcher sees "Game ended" message and is redirected to home
- What happens if a watcher loses connection?
  - Same as players - they can rejoin by entering the room code again
- What happens if room code is invalid?
  - Same error as players: "Room not found"
- What happens during Assassin phase (sensitive game moment)?
  - Watchers see the same as neutral observer: Assassin is selecting, but no hint about who Merlin is

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to watch a game by entering a valid room code and selecting "Watch"
- **FR-002**: System MUST require watchers to have a registered nickname (3-20 characters) before watching
- **FR-003**: System MUST only allow watching after the game has started (not during waiting room)
- **FR-004**: System MUST limit watchers to a maximum of 10 per game
- **FR-005**: System MUST display game state to watchers in read-only mode (no interactive controls)
- **FR-006**: System MUST show watchers the same information visible to a neutral observer:
  - Current game phase
  - Quest track and results
  - Vote counts after reveal
  - Quest results after reveal
  - Player positions and leader indicator
  - Who has voted (but not how)
  - Who is on a quest team
- **FR-007**: System MUST NOT show watchers any hidden information:
  - Player roles
  - Individual vote choices before reveal
  - Individual quest actions before reveal
  - Lady of the Lake investigation results
- **FR-008**: System MUST keep watchers invisible to players (no watcher count or names shown to players)
- **FR-009**: System MUST allow watchers to leave and rejoin freely (subject to 10-watcher limit)
- **FR-010**: System MUST show watchers the same game over screen as players when game ends
- **FR-011**: System MUST NOT allow watcher actions to modify any game state
- **FR-012**: System MUST provide a "Stop Watching" button for watchers to exit

### Key Entities

- **Watcher**: A registered user (with nickname) observing a game without participation. Has: nickname, connection status, joined_at timestamp. Relationship: many watchers to one game.
- **Game**: Existing entity, extended to track associated watchers (separate from players)
- **WatcherSession**: Tracks active watcher connections for a game. Used for enforcing 10-watcher limit and cleanup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can join as a watcher within 5 seconds of entering room code and selecting "Watch"
- **SC-002**: Watcher game state updates within 5 seconds of actual game events (same polling interval as players)
- **SC-003**: 100% of watcher actions result in read-only display (no game state modifications possible)
- **SC-004**: Watchers see vote/quest reveals at the same time as players (no information leak)
- **SC-005**: Players cannot detect the presence of watchers through any UI element
- **SC-006**: System correctly enforces 10-watcher limit with clear feedback when limit is reached
- **SC-007**: Watchers can complete full game observation from start to finish without errors
