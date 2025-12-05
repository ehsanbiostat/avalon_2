# Feature Specification: Rematch / Play Again

**Feature Branch**: `005-game-rematch`
**Created**: 2025-12-05
**Status**: Draft
**Input**: User description: "Rematch/Play Again - Allow players to start a new game in the same room after a game ends"

---

## Problem Statement

When a game of Avalon ends (either team wins), players currently have no way to start a new game together without:
1. Everyone leaving the room
2. Creating a new room
3. Sharing a new room code
4. Everyone rejoining

This creates friction and breaks the social flow of playing multiple games in a session. Players want to quickly start another round with the same group.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Room Manager Initiates Rematch (Priority: P1)

As a room manager, after a game ends, I want to start a new game with the same players so we can play another round without recreating the room.

**Why this priority**: This is the core functionality - without it, there's no rematch feature. The room manager is the natural person to control when a new game starts.

**Independent Test**: Can be fully tested by completing one game and clicking "Play Again" as room manager. Delivers immediate value by enabling continuous play sessions.

**Acceptance Scenarios**:

1. **Given** a game has ended (game_over phase with a winner), **When** the room manager clicks "Play Again", **Then** a new game setup begins with all current players
2. **Given** a game has ended, **When** the room manager clicks "Play Again", **Then** all player roles are cleared and players return to the lobby state
3. **Given** a game has ended, **When** the room manager clicks "Play Again", **Then** the room code remains the same so new players can still join
4. **Given** a game has ended and rematch is initiated, **When** a new player joins using the room code, **Then** they can join the new game in the lobby

---

### User Story 2 - Players See Game Over Screen with Options (Priority: P1)

As a player, after a game ends, I want to see a clear game summary and understand what happens next so I know if another game is starting.

**Why this priority**: Players need feedback about the game ending and what options are available. This is essential for good UX.

**Independent Test**: Complete a game and verify the game over screen shows winner, role reveals, and next steps.

**Acceptance Scenarios**:

1. **Given** a game has ended, **When** any player views the game over screen, **Then** they see the winning team (Good/Evil), win reason, and all player roles revealed
2. **Given** a game has ended, **When** a non-manager player views the game over screen, **Then** they see a message indicating they're waiting for the room manager to start a new game
3. **Given** the room manager has initiated a rematch, **When** other players are on the game over screen, **Then** they are automatically redirected to the lobby

---

### User Story 3 - Role Configuration Preserved (Priority: P2)

As a room manager, when starting a rematch, I want the previous role configuration (special roles, Lady of the Lake) preserved so I don't have to reconfigure everything.

**Why this priority**: Reduces friction for repeated games. Players typically want the same setup for consecutive games.

**Independent Test**: Start a game with specific role config, complete it, rematch, and verify the same roles are pre-selected.

**Acceptance Scenarios**:

1. **Given** a game ended with specific special roles enabled (e.g., Percival, Morgana, Lady of Lake), **When** rematch is initiated, **Then** the lobby shows the same role configuration as the previous game
2. **Given** a rematch is initiated with preserved config, **When** the room manager views role settings, **Then** they can still modify the configuration before distributing roles

---

### User Story 4 - Player Can Leave After Game (Priority: P2)

As a player, after a game ends, I want to be able to leave the room if I don't want to play again, without disrupting others.

**Why this priority**: Players should have freedom to leave. This supports natural group dynamics.

**Independent Test**: End a game, click leave, verify player is removed and others can still rematch.

**Acceptance Scenarios**:

1. **Given** a game has ended, **When** a player clicks "Leave Room", **Then** they are removed from the room and returned to the home page
2. **Given** a player leaves after game ends, **When** rematch is initiated, **Then** the game continues with remaining players (if enough remain)
3. **Given** the room manager leaves after game ends, **When** this happens, **Then** manager role transfers to another player (or room closes if last player)

---

### User Story 5 - Game History in Room (Priority: P3)

As a player, I want to see a brief history of games played in this room session so I can track our win/loss record.

**Why this priority**: Nice-to-have feature that adds to the social experience but isn't essential for core rematch functionality.

**Independent Test**: Play 2-3 games in same room and verify history is visible.

**Acceptance Scenarios**:

1. **Given** multiple games have been played in a room, **When** viewing the lobby or game over screen, **Then** players see a summary of past games (e.g., "Game 1: Good Won, Game 2: Evil Won")
2. **Given** game history exists, **When** viewing history, **Then** it shows which team won each game but not individual role reveals

---

### Edge Cases

- What happens if the room manager disconnects during game over? → Manager role transfers to next player
- What happens if all players leave except one? → Room remains open, single player can wait or leave
- What happens if player count drops below 5 during rematch setup? → Game cannot start until 5+ players
- What happens to game history if room is idle for extended period? → History preserved until room expires (24 hours)
- What happens if a player joins mid-game-over screen? → They wait in lobby until rematch starts
- Can players who weren't in the previous game participate in rematch? → Yes, new players can join before roles are distributed

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a "Play Again" button to the room manager when game phase is `game_over`
- **FR-002**: System MUST display a "Waiting for [manager] to start new game" message to non-manager players at game over
- **FR-003**: System MUST reset game state when rematch is initiated (clear roles, votes, quest results, Lady holder)
- **FR-004**: System MUST preserve room code, room players, and room manager during rematch
- **FR-005**: System MUST preserve role configuration from previous game as default for rematch
- **FR-006**: System MUST allow room manager to modify role configuration before starting rematch
- **FR-007**: System MUST redirect all players to lobby state when rematch is initiated
- **FR-008**: System MUST allow players to leave the room after game ends
- **FR-009**: System MUST transfer manager role if current manager leaves
- **FR-010**: System MUST validate minimum player count (5) before allowing role distribution in rematch
- **FR-011**: System MUST reveal all player roles on the game over screen
- **FR-012**: System MUST display winning team and win reason on game over screen
- **FR-013**: System SHOULD store a summary of games played in the room session
- **FR-014**: System SHOULD display game history (won/lost count per team) to players

### Key Entities

- **Room**: Existing entity - gains relationship to multiple games (one-to-many)
- **Game**: Existing entity - already has room_id reference
- **GameHistory**: New concept - aggregated view of games played in a room (can be computed from existing Game records)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Room manager can initiate a rematch within 5 seconds of game ending
- **SC-002**: All players are redirected to lobby within 3 seconds of rematch initiation
- **SC-003**: 95% of rematch attempts succeed without errors
- **SC-004**: Players can complete 5 consecutive games in the same room without needing to recreate
- **SC-005**: Role configuration persists correctly across rematches (verified by same special roles appearing in lobby)
- **SC-006**: Players who leave after game over are cleanly removed without disrupting rematch for others

---

## Assumptions

- Rooms already have a one-to-many relationship capability with games (room_id in games table)
- The existing `games` table stores historical game data that can be queried for room history
- Room expiration (24 hours) continues to apply regardless of number of games played
- The room manager role transfer logic already exists from Phase 1
- Players in the lobby see real-time updates (existing polling mechanism)

---

## Out of Scope

- Statistics across multiple rooms/sessions (player lifetime stats)
- Leaderboards or rankings
- Automated rematch (auto-start new game)
- Vote-based rematch (players voting to play again instead of manager deciding)
- Changing room size (expected players) between games
