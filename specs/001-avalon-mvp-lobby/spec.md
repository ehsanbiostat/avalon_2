# Feature Specification: Avalon Online – MVP Lobby & Role Distribution

**Feature Branch**: `001-avalon-mvp-lobby`
**Created**: 2025-12-02
**Status**: Draft
**Input**: MVP web app for playing Avalon online – room creation, lobby, and role distribution

---

## Problem Statement

Groups who want to play the social deduction game "Avalon" online currently lack a simple, dedicated tool to:
- Gather players in a shared virtual space
- Coordinate game setup (player count, room management)
- Privately distribute roles without revealing them to other players
- Maintain consistent game state across all participants

This MVP addresses the foundational needs: identity, room management, lobby coordination, and private role distribution. Full game mechanics (missions, voting, assassin) are deferred to future phases.

---

## Clarifications

### Session 2025-12-02

- Q: What is the Good/Evil role distribution ratio per player count? → A: Standard Avalon ratios: 5p=3G/2E, 6p=4G/2E, 7p=4G/3E, 8p=5G/3E, 9p=6G/3E, 10p=6G/4E
- Q: How does the system recognize a returning player for rejoin? → A: Browser localStorage stores unique player ID (MVP); future phases will migrate to database-backed user accounts
- Q: What is the room lifecycle/cleanup policy? → A: Auto-delete "waiting" rooms after 24h of inactivity; "started" rooms after 48h of inactivity
- Q: Should all rooms be publicly visible on the Active Rooms page? → A: Yes, all waiting rooms are public (MVP simplicity); private rooms deferred to future phase

---

## User Roles

| Role | Description |
|------|-------------|
| **Visitor** | Any person who accesses the app but has not yet identified themselves |
| **Player** | A visitor who has provided a nickname and can join/create rooms |
| **Room Manager** | The player who created a room; has elevated privileges (distribute roles, start game) |

---

## Scope

### In Scope (This MVP)

- Lightweight identity via nickname (no account creation required)
- Room creation with configurable player count (5–10)
- Unique, non-guessable room codes
- Active rooms listing page
- Joining rooms by code or from the listing
- Rejoining a room after disconnection (same identity preserved)
- Real-time lobby updates (players joining/leaving)
- Room manager designation and privileges
- Role distribution (simplified: "Good" and "Evil" sides)
- Private role reveal to each player
- Role confirmation by each player
- "Start Game" button after all confirmations (transitions to placeholder state)
- Multi-room isolation (no cross-room data leakage)

### Out of Scope (Future Phases)

- Full user accounts with email/password or OAuth
- Mission selection and team building
- Voting phases (approve/reject teams)
- Mission execution (pass/fail cards)
- Assassin guess mechanic
- Advanced role variants (Merlin, Percival, Mordred, Morgana, Oberon)
- Game history and statistics
- Chat or voice communication
- Spectator mode
- Private rooms (invite-only)
- Room deletion or archival
- Mobile-native applications

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 – Create a Room (Priority: P1)

As a **player**, I want to create a new game room so that I can invite friends to play Avalon together.

**Why this priority**: Without room creation, no game can begin. This is the foundational capability.

**Independent Test**: A single player can create a room and see themselves in an empty lobby with a shareable room code.

**Acceptance Scenarios**:

1. **Given** I am on the landing page with a nickname entered, **When** I click "Create Room" and select 7 players, **Then** a new room is created with a unique 6-character code, I become the room manager, and I am placed in the lobby.

2. **Given** I am creating a room, **When** I select a player count outside 5–10, **Then** the system prevents room creation and shows an error message.

3. **Given** I have created a room, **When** I view the lobby, **Then** I see my nickname, "Room Manager" badge, the room code with a copy button, and "1/7 players".

---

### User Story 2 – View Active Rooms (Priority: P2)

As a **player**, I want to see a list of active rooms so that I can find and join games that need more players.

**Why this priority**: Enables discovery of existing games, reducing friction to join.

**Independent Test**: A player can view the active rooms page and see room details without joining.

**Acceptance Scenarios**:

1. **Given** there are 3 active rooms, **When** I navigate to the "Active Rooms" page, **Then** I see all 3 rooms listed with room code, manager name, and player count (e.g., "3/5 players").

2. **Given** a room is full (5/5 players), **When** I view the active rooms list, **Then** that room shows as "Full" and the Join button is disabled.

3. **Given** a room's game has started, **When** I view the active rooms list, **Then** that room no longer appears (only rooms in "waiting" status are shown).

4. **Given** no active rooms exist, **When** I view the active rooms page, **Then** I see an empty state message: "No active rooms. Create one!"

---

### User Story 3 – Join a Room (Priority: P1)

As a **player**, I want to join an existing room so that I can participate in a game with others.

**Why this priority**: Core functionality – players must be able to join rooms to play together.

**Independent Test**: A player can enter a valid room code and appear in that room's lobby alongside other players.

**Acceptance Scenarios**:

1. **Given** I have entered my nickname and have a valid room code, **When** I enter the code and click "Join", **Then** I am added to the room and see the lobby with all current players.

2. **Given** I enter an invalid room code, **When** I click "Join", **Then** I see an error: "Room not found. Please check the code."

3. **Given** I try to join a full room, **When** I click "Join", **Then** I see an error: "Room is full."

4. **Given** I click "Join" on a room from the active rooms list, **When** the action completes, **Then** I am added to that room's lobby.

5. **Given** I am already in a room, **When** I try to join another room, **Then** I must first leave my current room or the system prevents double-joining.

---

### User Story 4 – Rejoin a Room (Priority: P2)

As a **player** who disconnected, I want to rejoin my room so that I don't lose my place in the game.

**Why this priority**: Network issues are common; players should not be permanently locked out.

**Independent Test**: A player can close their browser, reopen the app, and rejoin their previous room with the same identity.

**Acceptance Scenarios**:

1. **Given** I was in room "ABC123" and closed my browser, **When** I return to the app and enter "ABC123", **Then** I rejoin as the same participant (same nickname, same position in player list).

2. **Given** I disconnected from a room, **When** another player views the lobby, **Then** my name shows as "Disconnected" (not removed) for a grace period.

3. **Given** the grace period has expired without rejoining, **When** I try to rejoin, **Then** I am added as a new participant (if space available).

4. **Given** I was the room manager and disconnected, **When** I rejoin within the grace period, **Then** I retain room manager privileges.

---

### User Story 5 – Room Lobby Experience (Priority: P1)

As a **player** in a room, I want to see who else is in the lobby and the room status so that I know when the game can start.

**Why this priority**: The lobby is the central coordination point before gameplay.

**Independent Test**: Multiple players in the same room all see identical, real-time lobby state.

**Acceptance Scenarios**:

1. **Given** I am in a room with 3 other players, **When** a 4th player joins, **Then** within 2 seconds I see their name appear in the player list.

2. **Given** I am viewing the lobby, **When** I look at the room info, **Then** I see: room code (with copy button), player list, manager indicator, and "X/Y players" count.

3. **Given** I am the room manager and player count equals expected count, **When** I view the lobby, **Then** I see a "Distribute Roles" button.

4. **Given** I am NOT the room manager, **When** player count equals expected count, **Then** I do NOT see the "Distribute Roles" button.

5. **Given** a player leaves the room, **When** I view the lobby, **Then** their name is removed and the player count updates.

---

### User Story 6 – Distribute Roles (Priority: P1)

As a **room manager**, I want to distribute roles to all players so that the game setup is complete.

**Why this priority**: Role distribution is essential for Avalon gameplay.

**Independent Test**: The manager can trigger role distribution and each player receives a private role.

**Acceptance Scenarios**:

1. **Given** I am the room manager and all players are present (7/7), **When** I click "Distribute Roles", **Then** the system randomly assigns roles to all players and each player sees only their own role.

2. **Given** roles have been distributed, **When** I (as any player) view my role, **Then** I see: role name, role description, and (if Evil) a list of my Evil teammates.

3. **Given** roles have been distributed, **When** I try to see another player's role, **Then** it is impossible – roles are private.

4. **Given** not all players are present (5/7), **When** I click "Distribute Roles", **Then** the button is disabled or shows an error.

---

### User Story 7 – Confirm Role (Priority: P1)

As a **player**, I want to confirm that I have seen my role so that the game knows everyone is ready.

**Why this priority**: Ensures all players have acknowledged their roles before game start.

**Independent Test**: Each player can confirm their role, and the system tracks confirmation status.

**Acceptance Scenarios**:

1. **Given** I have seen my role card, **When** I click "Confirm Role", **Then** my confirmation status is recorded and visible to the system.

2. **Given** 5 of 7 players have confirmed, **When** the room manager views the lobby, **Then** they see confirmation progress: "5/7 players confirmed".

3. **Given** all players have confirmed their roles, **When** the room manager views the lobby, **Then** they see a "Start Game" button.

4. **Given** I have not yet confirmed my role, **When** I try to leave the role screen, **Then** I am reminded to confirm before proceeding.

---

### User Story 8 – Start Game (Priority: P2)

As a **room manager**, I want to start the game after all roles are confirmed so that gameplay can begin.

**Why this priority**: Transitions from setup to gameplay (even if gameplay is placeholder in MVP).

**Independent Test**: Manager can click "Start Game" and all players see the game state transition.

**Acceptance Scenarios**:

1. **Given** all players have confirmed roles, **When** I (as room manager) click "Start Game", **Then** the room state changes to "started" and all players see a "Game Started" screen.

2. **Given** the game has started, **When** new players try to join, **Then** they cannot join (room is no longer in waiting state).

3. **Given** the game has started, **When** the room appears in searches, **Then** it is no longer listed in active rooms.

---

### Edge Cases

**Player Disconnection**:
- Player disconnects mid-lobby: Show as "Disconnected" for 5-minute grace period, then remove if not rejoined.
- Player disconnects during role distribution: Their role is still assigned; they see it upon rejoining.
- Player disconnects after confirming role: Confirmation status is preserved.

**Room Manager Disconnection**:
- Manager disconnects before distributing roles: Retain manager status during grace period; if grace period expires, transfer manager role to the longest-present player.
- Manager disconnects after distributing roles but before starting: Same as above.

**Concurrent Actions**:
- Two players try to join the last spot simultaneously: Only one succeeds; the other sees "Room is full."
- Manager clicks "Distribute Roles" while a player is joining: System waits for join to complete or rejects late joiner.

**Room State Conflicts**:
- Room fills up while player is on "Join" confirmation screen: Show error on submission.
- Player tries to create a room with a nickname already in use in that room: Prevent or append suffix.

**Data Integrity**:
- Browser refresh during role reveal: Role is preserved and shown again.
- Two browser tabs for the same player: Both tabs show consistent state; actions from either tab work.

---

## Requirements *(mandatory)*

### Functional Requirements

**Identity**:
- **FR-001**: System MUST allow visitors to enter a nickname (3–20 characters, alphanumeric and spaces).
- **FR-002**: System MUST persist player identity via browser localStorage (unique player ID) to enable rejoining. Future phases will migrate to database-backed accounts.
- **FR-003**: System MUST prevent duplicate nicknames within the same room.

**Room Management**:
- **FR-004**: System MUST allow players to create rooms with a configurable player count (5–10).
- **FR-005**: System MUST generate unique, non-sequential room codes (6 alphanumeric characters).
- **FR-006**: System MUST designate the room creator as the room manager.
- **FR-007**: System MUST track room status: "waiting", "roles_distributed", "started".
- **FR-008**: System MUST prevent players from joining rooms that are full or not in "waiting" status.

**Active Rooms**:
- **FR-009**: System MUST provide a page listing all rooms in "waiting" status (all rooms are publicly visible in MVP).
- **FR-010**: System MUST display for each room: code, manager name, current/expected player count.
- **FR-011**: System MUST update the active rooms list in real-time (within 2 seconds of changes).

**Joining & Rejoining**:
- **FR-012**: System MUST allow players to join by entering a room code directly.
- **FR-013**: System MUST allow players to join by clicking "Join" on the active rooms list.
- **FR-014**: System MUST recognize returning players within a grace period and restore their session.
- **FR-015**: System MUST show disconnected players as "Disconnected" in the lobby during grace period.

**Lobby**:
- **FR-016**: System MUST display lobby information: room code, player list, manager badge, player count.
- **FR-017**: System MUST provide a "Copy Room Code" function.
- **FR-018**: System MUST update lobby state in real-time for all participants (within 2 seconds).
- **FR-019**: System MUST show "Distribute Roles" button only to room manager when room is full.

**Role Distribution**:
- **FR-020**: System MUST randomly assign roles when manager triggers distribution.
- **FR-021**: System MUST support simplified roles: "Good" (Loyal Servants) and "Evil" (Minions) with standard Avalon ratios: 5p=3G/2E, 6p=4G/2E, 7p=4G/3E, 8p=5G/3E, 9p=6G/3E, 10p=6G/4E.
- **FR-022**: System MUST ensure role assignments are private – each player sees only their own role.
- **FR-023**: System MUST show Evil players the identities of other Evil players.
- **FR-024**: System MUST provide a "Confirm Role" button for each player.
- **FR-025**: System MUST track role confirmation status for all players.

**Game Start**:
- **FR-026**: System MUST show "Start Game" button to manager only after all players confirm roles.
- **FR-027**: System MUST transition room to "started" state when manager clicks "Start Game".
- **FR-028**: System MUST display a placeholder "Game Started" screen (actual gameplay out of scope).

**Multi-Room Isolation**:
- **FR-029**: System MUST ensure players cannot access data from rooms they are not members of.
- **FR-030**: System MUST scope all queries and real-time updates by room.

**Room Lifecycle**:
- **FR-031**: System MUST auto-delete "waiting" rooms after 24 hours of inactivity.
- **FR-032**: System MUST auto-delete "started" rooms after 48 hours of inactivity.
- **FR-033**: System MUST track last activity timestamp for each room (updated on any player action).

### Key Entities

- **Player**: Represents a participant; attributes include nickname, unique player ID (generated client-side, stored in localStorage), connection status, current room (if any).

- **Room**: Represents a game instance; attributes include unique code, manager reference, expected player count, current status, list of players, last activity timestamp (for cleanup).

- **Role Assignment**: Represents a player's role in a specific room; attributes include player reference, room reference, role type (Good/Evil), confirmation status.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a room and receive a shareable code in under 5 seconds.
- **SC-002**: Users can join a room by code in under 3 seconds.
- **SC-003**: Lobby updates (player joins/leaves) appear for all participants within 2 seconds.
- **SC-004**: 95% of users successfully complete the flow: create room → share code → friends join → distribute roles → all confirm → start game.
- **SC-005**: System supports at least 50 concurrent active rooms without degradation.
- **SC-006**: System supports at least 10 players per room (even though MVP limits to 10 max).
- **SC-007**: Role distribution completes in under 2 seconds for all players.
- **SC-008**: 100% of role reveals are private – no player can see another player's role.
- **SC-009**: Disconnected players can rejoin their room successfully 90% of the time within the grace period.
- **SC-010**: Zero cross-room data leakage incidents (complete room isolation).

---

## Assumptions

- Players have stable internet connections (brief disconnections are handled, but prolonged outages may result in removal).
- Players will use modern web browsers (Chrome, Firefox, Safari, Edge – latest 2 versions).
- The grace period for reconnection is 5 minutes (can be adjusted based on user feedback).
- Default role distribution for MVP uses standard Avalon ratios (see FR-021).
- Room codes are case-insensitive for user convenience.
- A player can only be in one room at a time.
