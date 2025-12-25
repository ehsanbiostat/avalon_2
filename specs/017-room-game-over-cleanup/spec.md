# Feature Specification: Room Game-Over Cleanup

**Feature Branch**: `017-room-game-over-cleanup`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "Auto-close rooms when game ends - fix issue where finished game rooms show as 'Full' in browse active rooms instead of being properly closed"

## Overview

Currently, when a game ends (phase becomes `game_over`), the room status remains `started`, causing finished rooms to appear in the "Browse Active Rooms" list as "Full" waiting rooms. Users cannot join or watch these rooms, creating a confusing experience.

This feature ensures that when a game ends, the room is automatically marked as `closed`, removing it from the active rooms list and providing a cleaner user experience.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Room List After Game Ends (Priority: P1)

As a user browsing active rooms, I want finished game rooms to be removed from the list so I only see rooms I can actually join or watch.

**Why this priority**: This is the core fix - prevents confusion and clutter in the room list.

**Independent Test**: Play a game to completion, then browse active rooms. The finished room should not appear in the list.

**Acceptance Scenarios**:

1. **Given** a game is in progress (room status: `started`), **When** the game ends (any win condition), **Then** the room status automatically changes to `closed`
2. **Given** a room with `closed` status, **When** a user browses active rooms, **Then** the room does not appear in the list
3. **Given** a finished game room, **When** a user tries to access it via direct URL, **Then** they see a "Game Over" summary page (not an error)

---

### User Story 2 - Game History Preserved (Priority: P2)

As a player who finished a game, I want to be able to view the game results (who won, final scores) even after the room is closed.

**Why this priority**: Ensures game data is not lost when room is closed.

**Independent Test**: After a game ends, navigate to the game page. All game data (winner, quests, players, roles) should still be visible.

**Acceptance Scenarios**:

1. **Given** a room is closed after game over, **When** players view the game page, **Then** they see the complete game history and results
2. **Given** a closed room, **When** the game data is queried, **Then** all historical data (quests, votes, actions) is preserved

---

### Edge Cases

- What happens if the server crashes mid-game-end? → The cleanup should be triggered again on next relevant API call or periodic cleanup job
- What happens if multiple game-end triggers fire simultaneously? → Should be idempotent (closing an already closed room is a no-op)
- What happens to watchers when game ends? → They should see the game over screen, then be able to leave gracefully

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically change room status from `started` to `closed` when game phase becomes `game_over`
- **FR-002**: System MUST NOT show rooms with `closed` status in the "Browse Active Rooms" list
- **FR-003**: System MUST preserve all game data (games, quests, votes, actions, roles) when room is closed
- **FR-004**: System MUST allow valid state transition from `started` → `closed` in the room state machine
- **FR-005**: Room closure MUST be triggered immediately when game ends, not deferred to cleanup job
- **FR-006**: Players and watchers on a closed room MUST be able to view the game over screen
- **FR-007**: Direct URL access to a closed room MUST show game results (not an error page)

### Key Entities

- **Room**: Add valid transition `started` → `closed` when game ends
- **Game**: No changes - `game_over` phase and `ended_at` timestamp already exist
- **RoomStatus**: Existing values (`waiting`, `roles_distributed`, `started`, `closed`) are sufficient

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of finished game rooms are marked as `closed` within 1 second of game ending
- **SC-002**: 0 finished game rooms appear in "Browse Active Rooms" list
- **SC-003**: All game history data is accessible for closed rooms
- **SC-004**: No user errors or broken states when accessing finished game rooms
