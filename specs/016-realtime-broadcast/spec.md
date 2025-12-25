# Feature Specification: Real-Time Broadcast Updates

**Feature Branch**: `016-realtime-broadcast`
**Created**: 2025-12-25
**Status**: Draft
**Input**: User description: "Implement Supabase Broadcast for real-time game updates to reduce latency for draft team selection, voting status, and other game actions"

## Overview

Currently, players experience noticeable delays (up to 3 seconds) when observing game state changes made by other players. This is because the system uses HTTP polling every 3 seconds to fetch updates. This feature introduces Supabase Broadcast channels to push updates instantly to all connected players, dramatically reducing perceived latency.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Draft Team Visibility (Priority: P1)

When the leader selects players for a quest team, all other players see the selection highlighted (blue circles) immediately, without waiting for the next poll cycle.

**Why this priority**: Draft team selection is the most visually noticeable delay in the current system. Players see the leader make selections, but their own screens don't update for several seconds, creating a disconnected experience.

**Independent Test**: Can be fully tested by having the leader select players and observing that other players see the blue highlights within 200ms.

**Acceptance Scenarios**:

1. **Given** a game in team_building phase with 7 players connected, **When** the leader clicks on a player to add them to the draft team, **Then** all 6 other players see that player's avatar highlighted within 200ms
2. **Given** a leader has selected 2 players for the draft team, **When** the leader clicks on a selected player to remove them, **Then** all other players see the highlight removed within 200ms
3. **Given** a player has a slow network connection, **When** the leader makes a selection, **Then** that player still sees the update within 500ms

---

### User Story 2 - Real-Time Vote Status (Priority: P2)

During the voting phase, players see "voted" badges appear on other players' avatars immediately after they submit their votes, rather than waiting for the next poll.

**Why this priority**: Seeing who has voted creates anticipation and engagement. Delayed updates make the voting phase feel sluggish.

**Independent Test**: Can be tested by having players vote and observing that the "voted" badge appears on other screens within 200ms.

**Acceptance Scenarios**:

1. **Given** a game in voting phase with a pending proposal, **When** a player submits their vote, **Then** all other players see the "voted" badge appear on that player within 200ms
2. **Given** 5 of 7 players have voted, **When** the 6th player votes, **Then** all players see the vote count update instantly and the "voted" badge appear

---

### User Story 3 - Real-Time Quest Action Status (Priority: P2)

During the quest phase, team members and observers see the action submission progress update instantly when a team member submits their success/fail action.

**Why this priority**: Similar to voting, quest action progress is important for game flow and anticipation.

**Independent Test**: Can be tested by having team members submit actions and observing progress updates within 200ms.

**Acceptance Scenarios**:

1. **Given** a game in quest phase with 3 team members, **When** a team member submits their action, **Then** all players see the "X/3 actions submitted" count update within 200ms
2. **Given** all team members have submitted actions, **When** the last action is submitted, **Then** all players transition to the quest_result phase simultaneously

---

### User Story 4 - Graceful Degradation (Priority: P3)

If the real-time connection fails or is unavailable, the system falls back to polling without user intervention, ensuring the game remains playable.

**Why this priority**: Reliability is essential - the game must work even if real-time features fail.

**Independent Test**: Can be tested by simulating connection loss and verifying polling continues to work.

**Acceptance Scenarios**:

1. **Given** a player's real-time connection drops, **When** game state changes occur, **Then** the player still receives updates via polling within 3 seconds
2. **Given** a player reconnects after connection loss, **When** the real-time connection is restored, **Then** updates resume instantly without manual refresh

---

### User Story 5 - Watcher Real-Time Updates (Priority: P3)

Watchers (spectators) also receive real-time updates for all game actions they are observing.

**Why this priority**: Watchers should have the same smooth experience as players.

**Independent Test**: Can be tested by having a watcher observe a game and verifying they see updates within 200ms.

**Acceptance Scenarios**:

1. **Given** a watcher is observing an active game, **When** the leader selects draft team members, **Then** the watcher sees the selections within 200ms
2. **Given** a watcher is observing during voting phase, **When** players vote, **Then** the watcher sees vote badges appear within 200ms

---

### Edge Cases

- What happens when a player joins mid-game? (They should receive current state immediately and subscribe to future updates)
- How does the system handle rapid successive updates? (Updates should be batched or debounced appropriately)
- What happens if two players make conflicting actions simultaneously? (Server state is authoritative; broadcast reflects server-confirmed state)
- How does the system handle players on very slow connections? (Polling fallback ensures they eventually receive updates)
- What happens when a player's browser tab is backgrounded? (Connection may throttle; polling backup ensures updates)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST broadcast draft team selection changes to all players in the game room within 200ms of the change being confirmed by the server
- **FR-002**: System MUST broadcast vote submission events to all players, showing who has voted without revealing the vote itself
- **FR-003**: System MUST broadcast quest action submission progress to all players
- **FR-004**: System MUST create a Supabase Realtime channel when a game starts (phase transitions to team_building) and destroy it when the game ends (game_over) or after 2 hours of inactivity
- **FR-005**: System MUST automatically subscribe players to the game channel when they join/view a game
- **FR-006**: System MUST automatically unsubscribe players from the game channel when they leave or disconnect
- **FR-007**: System MUST fall back to HTTP polling (existing 3-second interval) if real-time connection fails
- **FR-008**: System MUST NOT reveal hidden information through broadcast messages (no vote values, no role information)
- **FR-009**: System MUST include watchers in broadcast subscriptions with the same restrictions as players
- **FR-010**: System MUST debounce rapid broadcasts to prevent message flooding (minimum 50ms between broadcasts)
- **FR-011**: System MUST use server-confirmed state as the source of truth (broadcast after successful DB write, not before)
- **FR-012**: System MUST handle channel reconnection automatically without user intervention
- **FR-013**: System MUST broadcast phase transitions (e.g., team_building→voting, voting→quest, quest→quest_result) so all players transition simultaneously
- **FR-014**: System MUST broadcast game over announcement including winner and win reason for synchronized end-game experience
- **FR-015**: System MUST log connection events (connect, disconnect, reconnect) and errors for debugging purposes

### Key Entities

- **Game Channel**: A Supabase Realtime Broadcast channel uniquely identified by game ID, used to push updates to all connected clients
- **Broadcast Message**: A lightweight payload containing the event type (draft_update, vote_submitted, action_submitted) and minimal relevant data
- **Channel Subscription**: A client-side subscription to a game channel that receives broadcast messages

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see draft team selection changes within 200ms of the leader's action (down from up to 3 seconds)
- **SC-002**: Vote submission badges appear within 200ms for all players (down from up to 3 seconds)
- **SC-003**: Quest action progress updates within 200ms for all players (down from up to 3 seconds)
- **SC-004**: System maintains real-time connection for 99% of active game sessions (measured over typical game duration)
- **SC-005**: Fallback to polling occurs within 5 seconds of connection loss, ensuring no player is left without updates
- **SC-006**: No increase in server resource usage beyond 10% compared to polling-only approach
- **SC-007**: User-perceived responsiveness improves (qualitative - game feels more "live" and synchronized)

## Clarifications

### Session 2025-12-25

- Q: When should the game channel be created and destroyed? → A: Create when game starts (phase changes to team_building), destroy when game ends (game_over) OR after 2 hours of inactivity
- Q: How should channel subscriptions be authorized? → A: No authorization needed - broadcast messages contain no sensitive data (FR-008 ensures no hidden information is revealed)
- Q: Should other game events also be broadcast? → A: Yes, include phase transitions (voting→quest, quest→result, etc.) AND game over announcement with final results
- Q: Should players see a connection status indicator? → A: No visible indicator - fallback to polling is seamless and should not worry users
- Q: What level of observability is needed? → A: Log connection events and errors (connect, disconnect, reconnect, failures) for debugging

## Assumptions

- Supabase Realtime Broadcast is available on the current plan and within rate limits
- Players are using modern browsers that support WebSocket connections
- Network latency for most users is under 100ms to Supabase servers
- The existing polling mechanism will be retained as a fallback, not removed
- Broadcast messages will be small (< 1KB) to minimize bandwidth
