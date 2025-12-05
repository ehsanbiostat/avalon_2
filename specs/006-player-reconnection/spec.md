# Feature Specification: Player Recovery & Reconnection

**Feature Branch**: `006-player-reconnection`
**Created**: 2025-12-05
**Status**: Draft
**Input**: User description: "Enable players to rejoin games after disconnect, browser change, or device switch using globally unique nicknames"

---

## Problem Statement

Currently, player identity is tied to browser localStorage. If a player:
- Opens a different browser
- Switches devices (phone ↔ laptop)
- Clears browser data
- Uses incognito mode

...they **cannot rejoin** their game. This causes:
1. Games to get stuck (waiting for a player who can never return)
2. Frustration for players who lose access mid-game
3. Wasted time for all other players in the room

### Root Cause
Player identity (`player_id`) is a UUID generated and stored in localStorage. Different browsers/devices have separate localStorage, creating separate identities.

### Solution
Make nicknames **globally unique** across the entire system. When a player loses their session, they can reclaim their seat by proving they own that unique nickname (entering room code + nickname).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register with Unique Nickname (Priority: P1)

As a new player, I must choose a globally unique nickname when first using the app, so my identity can be recovered later if I lose my browser session.

**Why this priority**: Foundation for the entire reconnection system. Without unique nicknames, recovery is impossible.

**Independent Test**: New player enters nickname → System validates uniqueness → Player registered or shown "nickname taken" error.

**Acceptance Scenarios**:

1. **Given** a new visitor with no localStorage, **When** they enter a nickname that doesn't exist in the system, **Then** they are registered successfully and can proceed
2. **Given** a new visitor, **When** they enter a nickname that already exists (case-insensitive), **Then** they see "Nickname already taken, please choose another"
3. **Given** an existing player returning on the same browser, **When** they open the app, **Then** they are automatically recognized (localStorage intact) and skip registration
4. **Given** a player trying to register, **When** they enter a nickname with invalid characters or length, **Then** they see appropriate validation errors

---

### User Story 2 - Reclaim Seat After Disconnect (Priority: P1)

As a player who lost my browser session (different device/browser), I want to reclaim my seat in an ongoing game by entering my unique nickname and room code.

**Why this priority**: Core recovery mechanism. This enables game continuation after player device/browser issues.

**Independent Test**: Player disconnects → Opens different browser → Enters room code + nickname → Reclaims seat → Can continue playing.

**Acceptance Scenarios**:

1. **Given** a player who was in a game but lost their session, **When** they enter the room code and their unique nickname on a different browser/device, **Then** they are asked "A player named [nickname] is in this game. Reclaim this seat?"
2. **Given** a player reclaiming their seat, **When** they confirm the reclaim action, **Then** they take over that seat and can continue the game
3. **Given** a player reclaiming their seat, **When** reclaim succeeds, **Then** their old session is invalidated (if still connected, it shows "Session taken over")
4. **Given** a player trying to reclaim, **When** they enter a nickname that is NOT in the specified room, **Then** they see "No player with this nickname found in room [code]"

---

### User Story 3 - Disconnect Detection (Priority: P1)

As a player in a game, I want to see when other players disconnect so I know if the game can continue or if we're waiting for someone.

**Why this priority**: Essential for game state awareness. Players need to know why the game is paused.

**Independent Test**: Player closes browser → Other players see them marked as "Disconnected" within 60 seconds.

**Acceptance Scenarios**:

1. **Given** a player stops sending activity (closes tab, loses connection), **When** 60 seconds pass with no activity, **Then** they are marked as "Disconnected" for all other players
2. **Given** a player is marked as "Disconnected", **When** they (or someone reclaiming their seat) reconnect, **Then** they are immediately marked as "Connected"
3. **Given** a player is disconnected, **When** viewing the player list or game board, **Then** their avatar shows a visual "disconnected" indicator (grayed out, icon)

---

### User Story 4 - Activity Heartbeat (Priority: P2)

As a player in a room or game, my connection status should be tracked automatically so disconnects are detected without manual action.

**Why this priority**: Enables automatic disconnect detection without requiring explicit "leave" actions.

**Independent Test**: Player is active → System records activity → Player goes idle → Marked as disconnected after timeout.

**Acceptance Scenarios**:

1. **Given** a player has the game open, **When** they are on the page (tab focused), **Then** an activity heartbeat is sent every 30 seconds
2. **Given** a player switches away from the tab for extended time, **When** no heartbeat received for 60 seconds, **Then** they are marked as disconnected
3. **Given** a player returns to the tab after being away, **When** they interact with the page, **Then** a heartbeat is sent and they are marked as connected again

---

### User Story 5 - Rejoin from Home Page (Priority: P2)

As a player who lost my session, I want to find and rejoin my active game from the home page without needing to remember the room code.

**Why this priority**: Improves UX by not requiring players to remember/write down room codes.

**Independent Test**: Player loses session → Opens app in new browser → Enters nickname → Sees "You have an active game in room [CODE]" → Can rejoin.

**Acceptance Scenarios**:

1. **Given** a player enters their nickname on the home page, **When** that nickname exists and has an active room membership, **Then** they see "You're in an active game! Room: [CODE]" with a "Rejoin" button
2. **Given** a player clicks "Rejoin", **When** confirmed, **Then** they reclaim their seat and are redirected to the game
3. **Given** a player's nickname is not in any active game, **When** they search, **Then** they see "No active games found for this nickname"

---

### User Story 6 - Prevent Seat Stealing (Priority: P2)

As a legitimate player, I want protection against someone else claiming my seat while I'm still actively playing.

**Why this priority**: Security against abuse. Without this, anyone could kick players by claiming their nickname.

**Independent Test**: Player A is actively playing → Player B tries to reclaim A's seat → B is denied because A is active.

**Acceptance Scenarios**:

1. **Given** a player is marked as "Connected" (recent activity), **When** someone else tries to reclaim their seat, **Then** the reclaim is denied with "This player is currently active"
2. **Given** a player is marked as "Disconnected" for less than 30 seconds, **When** someone tries to reclaim, **Then** they see "Please wait [X] seconds before reclaiming this seat" (grace period)
3. **Given** a player is marked as "Disconnected" for more than 30 seconds, **When** someone with matching nickname tries to reclaim, **Then** the reclaim is allowed

---

### Edge Cases

- What if two people legitimately have the same nickname idea? → First-come-first-served; suggest alternatives
- What if original player returns after someone reclaimed? → Their session shows "Session taken over by another device"
- What if player tries to reclaim during critical game action (voting, quest)? → **Allow reclaim anytime** — new session inherits all pending actions and can continue seamlessly
- What if nickname is offensive? → Future: Add basic profanity filter (out of scope for this phase)
- What if room expires while player is disconnected? → Normal room expiration rules apply (24h)
- What happens to the old localStorage identity after reclaim? → **Remains orphaned** — old player record exists but has no room memberships
- What if existing players have duplicate nicknames (pre-migration)? → **Auto-rename**: Keep first-registered, append `_N` suffix to duplicates
- What if player minimizes browser for extended time? → **Marked as disconnected** after 60s; immediate heartbeat on tab focus reconnects them

---

## Requirements *(mandatory)*

### Functional Requirements

**Nickname Uniqueness**
- **FR-001**: System MUST enforce globally unique nicknames (case-insensitive)
- **FR-002**: System MUST validate nickname uniqueness at registration time
- **FR-003**: _(Covered by FR-001)_ Global uniqueness ensures no duplicate nicknames can exist system-wide
- **FR-004**: System MUST allow 3-20 alphanumeric characters, underscores, and hyphens for nicknames

**Disconnect Detection**
- **FR-005**: System MUST track last activity timestamp for each player session
- **FR-006**: System MUST mark players as "Disconnected" after 60 seconds of no activity
- **FR-007**: System MUST update activity timestamp via heartbeat (30s interval sufficient; implicit API activity tracking deferred)
- **FR-008**: System MUST send heartbeat from client every 30 seconds while page is active

**Seat Reclaim**
- **FR-009**: System MUST allow seat reclaim via room code + nickname combination
- **FR-010**: System MUST verify nickname matches a player in the specified room
- **FR-011**: System MUST require 30-second grace period before allowing reclaim of recently disconnected player
- **FR-012**: System MUST deny reclaim if target player is currently marked as "Connected"
- **FR-013**: System MUST transfer all game state (role, team membership, votes) to the reclaiming session
- **FR-014**: System MUST invalidate the old session after successful reclaim

**Session Management**
- **FR-015**: System MUST display "Session taken over" message to invalidated sessions
- **FR-016**: System MUST show visual indicator for disconnected players in UI
- **FR-017**: System MUST automatically reconnect player if same localStorage session returns _(handled by existing identity check on page load)_

**Find My Game**
- **FR-018**: System SHOULD allow players to find their active game by entering nickname on home page
- **FR-019**: System SHOULD show room code and "Rejoin" option if active game found

### Key Entities

- **Player**: Extended with `last_activity_at` timestamp for tracking connection status
- **Room Player**: Uses existing `is_connected` and `disconnected_at` fields (currently unused)
- **Session**: Conceptual - represents a browser/device session tied to a `player_id`

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of seat reclaim attempts succeed within 10 seconds
- **SC-002**: Disconnect detection occurs within 90 seconds of actual disconnect
- **SC-003**: Players can reclaim their seat from a different device within 2 minutes of losing original session
- **SC-004**: Zero games get permanently stuck due to unreachable players (reclaim enables continuation)
- **SC-005**: Nickname collision rate at registration is under 5% (good namespace)
- **SC-006**: Active players are never incorrectly kicked due to false disconnect detection

---

## Assumptions

- Nicknames are intended to be memorable and personal (players will remember their nickname)
- Players may not remember room codes, hence the "Find My Game" feature
- A 30-second grace period is sufficient to prevent accidental reclaims while allowing legitimate recovery
- The 60-second inactivity threshold balances responsiveness with avoiding false positives
- Players will have the tab/app open while actively playing (for heartbeat to work)
- Offensive nickname filtering can be addressed in a future phase

---

## Out of Scope

- Email/phone-based account recovery
- Password-protected nicknames
- Persistent player accounts with login
- Profanity filter for nicknames
- Multiple simultaneous sessions for same player
- Automated game continuation if player doesn't return (e.g., AI takeover)
- Nickname change functionality (once registered, nickname is permanent for this phase)
