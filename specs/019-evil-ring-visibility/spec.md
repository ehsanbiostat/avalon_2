# Feature Specification: Evil Ring Visibility Mode

**Feature Branch**: `019-evil-ring-visibility`
**Created**: 2025-12-30
**Status**: Draft
**Depends On**: Special Roles (002-avalon-special-roles) ✅ Complete
**Input**: Add a new game configuration in which the evil players are introduced to each other in a ring/chain pattern. If there are three or more evil players in the game, not all of them know each other. For example, with evil players A, B, and C: A knows B, B knows C, and C knows A, but A does not know C and C does not know B.

---

## Clarifications

### Session 2025-12-30

- Q: Can Evil Ring Visibility be combined with Merlin Split Intel Mode? → A: Yes, they are independent mechanics (evil-to-evil vs Merlin-to-evil visibility)
- Q: Can Evil Ring Visibility be combined with Oberon Split Intel Mode? → A: Yes, Oberon is excluded from ring, Split Intel affects Merlin only
- Q: What information does an evil player see about their known teammate? → A: Name ONLY (e.g., "Alice is Evil"), not their specific role
- Q: Should Oberon be included in the "hidden evil" count shown to ring members? → A: Yes, include Oberon in the hidden count
- Q: What if there's only 1 non-Oberon evil player? → A: Evil Ring Visibility requires 3+ non-Oberon evil players to be selectable
- Q: How should the prerequisite be enforced in UI? → A: Toggle is disabled/grayed out with tooltip explaining why
- Q: What do watchers see about the evil ring? → A: Nothing until game ends (same neutral observer experience)
- Q: What happens if enabling Oberon reduces non-Oberon evil below 3? → A: Auto-disable Evil Ring Visibility with notification
- Q: What happens if player count change reduces non-Oberon evil below 3? → A: Auto-disable Evil Ring Visibility with notification
- Q: Can Evil Ring Visibility be combined with Merlin Decoy Mode? → A: Yes, they are independent mechanics

---

## Problem Statement

In standard Avalon, all evil players (except Oberon) know each other completely. This makes coordination among the evil team relatively easy and predictable.

**Evil Ring Visibility Mode** introduces strategic uncertainty within the evil team itself by limiting each evil player's knowledge to only one other evil teammate. This creates a "ring" or "chain" of visibility:
- Each evil player knows exactly ONE other evil player (name only, not their role)
- The visibility forms a circular pattern (A→B→C→A)
- Evil players must deduce who their other teammates are through gameplay

This mode:
- Increases difficulty and intrigue for the evil team
- Prevents instant evil coordination at game start
- Creates opportunities for good players as evil players may accidentally suspect each other
- Adds a unique strategic layer where evil players must "discover" their full team

---

## User Roles

| Role | Description |
|------|-------------|
| **Room Manager** | The player who created the room; configures game settings including Evil Ring Visibility |
| **Evil Players** | Players assigned to the evil team who will have limited visibility of teammates |
| **Good Players** | Players on the good team; unaffected by this mode but benefit from evil team confusion |
| **Oberon** | Special evil role who remains isolated (sees no one and no one sees them, unchanged) |
| **Watchers** | Spectators who see nothing about evil team until game ends |

---

## Scope

### In Scope (This Feature)

- New room configuration toggle: "Evil Ring Visibility" (enabled/disabled)
- Prerequisite: Requires 3+ non-Oberon evil players (toggle disabled otherwise)
- Ring visibility logic for evil players showing name only (not role)
- Modified role reveal showing only ONE known evil teammate's name
- Clear explanation in role reveal about the limited visibility
- Hidden count message including Oberon in the count
- Display of this configuration option in the "Roles in Play" section
- Persistence of ring assignments for the entire game duration
- Compatibility with existing special evil roles (Morgana, Mordred, Assassin, Minion)
- Auto-disable when configuration changes make prerequisite invalid

### Out of Scope

- Changing Oberon's behavior (Oberon remains completely isolated)
- Changing Merlin's visibility of evil players
- Affecting Lady of the Lake investigations
- Post-game reveal of the ring structure (all roles revealed as normal)
- Player ability to discover the ring order during gameplay (deduction only)

### Mode Compatibility

Evil Ring Visibility CAN be combined with:
- ✅ Merlin Split Intel Mode (independent mechanics)
- ✅ Oberon Split Intel Mode (Oberon excluded from ring anyway)
- ✅ Merlin Decoy Mode (independent mechanics)
- ✅ Lady of the Lake (unaffected)

---

## User Scenarios & Testing

### User Story 1 – Enable Evil Ring Visibility Mode (Priority: P1)

As a **room manager**, I want to enable Evil Ring Visibility Mode so that evil players only know one teammate each, creating more strategic uncertainty.

**Why this priority**: Core feature - enables the configuration that affects gameplay.

**Independent Test**: Room manager can enable the Evil Ring Visibility toggle in room creation settings when prerequisites are met.

**Acceptance Scenarios**:

1. **Given** I am creating a room with 7+ expected players (3+ evil), **When** I view the game options panel, **Then** I see an enabled toggle for "Evil Ring Visibility" with description: "Evil players only know one teammate each (chain pattern)."

2. **Given** I am creating a room with 5-6 expected players (2 evil), **When** I view the game options panel, **Then** I see a disabled/grayed out toggle for "Evil Ring Visibility" with tooltip: "Requires 3+ non-Oberon evil players (7+ total players)."

3. **Given** I have enabled Evil Ring Visibility Mode, **When** any player views the "Roles in Play" section in the lobby, **Then** they see an indicator that Evil Ring Visibility is active.

4. **Given** Evil Ring Visibility is enabled with 7 players (3 evil), **When** I enable Oberon (reducing non-Oberon evil to 2), **Then** Evil Ring Visibility is automatically disabled with a notification explaining why.

5. **Given** Evil Ring Visibility is enabled with 7 players, **When** I change expected players to 5 (reducing evil to 2), **Then** Evil Ring Visibility is automatically disabled with a notification explaining why.

---

### User Story 2 – Evil Player Sees One Teammate (Priority: P1)

As an **evil player** (non-Oberon) in a game with Evil Ring Visibility enabled, I want to see exactly one evil teammate's name during role reveal so that I have partial knowledge of my team.

**Why this priority**: Core gameplay mechanic that defines the feature experience.

**Independent Test**: Distribute roles with Evil Ring Visibility enabled → Evil player sees exactly one teammate's name (not role) in role reveal.

**Acceptance Scenarios**:

1. **Given** I am an evil player (Assassin, Morgana, Mordred, or Minion) in a game with Evil Ring Visibility enabled and 3+ non-Oberon evil players, **When** I view my role reveal, **Then** I see exactly ONE evil teammate's name (e.g., "Alice is Evil") without their specific role.

2. **Given** I am an evil player, **When** I view my role reveal with Evil Ring Visibility, **Then** I see an explanation: "Ring Visibility Mode: You only know one teammate."

3. **Given** I am an evil player, **When** I view my role reveal, **Then** I see a hidden count message: "X other evil player(s) are hidden from you" (including Oberon if present).

4. **Given** Player A, B, and C are evil with ring A→B→C→A, **When** Player A views role reveal, **Then** A sees only "B is Evil" (not B's actual role like Morgana). When B views role reveal, B sees only "C is Evil". When C views role reveal, C sees only "A is Evil".

5. **Given** I am Mordred in Evil Ring Visibility mode, **When** I view my role reveal, **Then** I still see one evil teammate's name (Mordred's "hidden from Merlin" ability is unaffected, but ring visibility applies).

---

### User Story 3 – Oberon Remains Isolated (Priority: P1)

As **Oberon**, I want to remain completely isolated from the ring so that my unique gameplay is preserved.

**Why this priority**: Oberon's isolation is fundamental to the role and must not be broken.

**Independent Test**: Oberon sees no teammates regardless of Evil Ring Visibility setting.

**Acceptance Scenarios**:

1. **Given** I am Oberon Standard in a game with Evil Ring Visibility enabled, **When** I view my role reveal, **Then** I see no teammates (unchanged from standard Oberon behavior).

2. **Given** I am Oberon Chaos in a game with Evil Ring Visibility enabled, **When** I view my role reveal, **Then** I see no teammates (unchanged from standard Oberon Chaos behavior).

3. **Given** other evil players are in Evil Ring Visibility mode, **When** the ring is formed, **Then** Oberon is NOT included in the ring (the ring only includes non-Oberon evil players).

4. **Given** there are 3 non-Oberon evil players (A, B, C) and Oberon, **When** the ring is formed, **Then** the ring is A→B→C→A, no one in the ring sees Oberon, Oberon sees no one, but Oberon IS counted in the "hidden from you" message for ring members.

---

### User Story 4 – Ring Assignment Persists (Priority: P2)

As an **evil player**, I want the ring assignment to remain consistent throughout the game so that my knowledge doesn't change mid-game.

**Why this priority**: Important for gameplay consistency but secondary to the core visibility mechanic.

**Independent Test**: Evil player's known teammate remains the same in all role reveal views throughout the game.

**Acceptance Scenarios**:

1. **Given** I am assigned to know Player B in the ring, **When** I view my role again at any point in the game, **Then** I still see "B is Evil" as my known teammate.

2. **Given** the game ends with Evil Ring Visibility enabled, **When** I view the game over screen, **Then** all roles are revealed normally with full role information (the ring structure itself is not explicitly shown, but all evil players are revealed with their actual roles).

---

### User Story 5 – Watcher Experience (Priority: P2)

As a **watcher**, I want to observe the game without seeing evil team information until the game ends.

**Why this priority**: Maintains watcher neutrality and doesn't give unfair advantage if watcher later joins as player.

**Independent Test**: Watcher sees no evil team information during active game.

**Acceptance Scenarios**:

1. **Given** I am watching a game with Evil Ring Visibility enabled, **When** I view the game during play, **Then** I see no information about who is evil or the ring structure.

2. **Given** I am watching a game with Evil Ring Visibility enabled, **When** the game ends, **Then** I see all roles revealed normally (same as players see at game end).

---

### Edge Cases

**Prerequisite Validation**:
- Evil Ring Visibility toggle is disabled when fewer than 3 non-Oberon evil players would exist.
- In Avalon: 5-6 players = 2 evil, 7-9 players = 3 evil, 10 players = 4 evil.
- If Oberon is enabled, subtract 1 from the non-Oberon evil count for prerequisite check.

**Auto-Disable Scenarios**:
- If Evil Ring Visibility is enabled and room manager then enables Oberon (reducing non-Oberon evil below 3), Evil Ring Visibility is automatically disabled with notification.
- If Evil Ring Visibility is enabled and room manager reduces expected player count (reducing evil below 3), Evil Ring Visibility is automatically disabled with notification.

**Oberon Interaction**:
- Oberon is always excluded from the ring.
- Oberon IS included in the "X other evil player(s) are hidden from you" count.
- Example: 4 evil total (Assassin, Morgana, Minion, Oberon) → Ring is Assassin→Morgana→Minion→Assassin. Each ring member's hidden count = 2 (one ring member + Oberon).

**Mordred Interaction**:
- Mordred participates in the ring normally (still hidden from Merlin, but sees one evil teammate's name).

**All Special Evil Roles**:
- Assassin, Morgana, Mordred, Minion all participate in the ring equally.
- Ring assignment is random, not based on role importance.
- Known teammate is shown as "Name is Evil" without revealing their actual role.

**Ring Formation Algorithm**:
- Ring is formed by shuffling eligible (non-Oberon) evil players and creating a circular chain.
- The assignment happens during role distribution (same as other visibility assignments).

---

## Requirements

### Functional Requirements

**Configuration & Prerequisites**:
- **FR-001**: System MUST allow room manager to enable/disable Evil Ring Visibility Mode during room creation.
- **FR-002**: System MUST disable (gray out) Evil Ring Visibility toggle when fewer than 3 non-Oberon evil players would exist.
- **FR-003**: System MUST show tooltip explaining prerequisite when toggle is disabled: "Requires 3+ non-Oberon evil players."
- **FR-004**: System MUST display Evil Ring Visibility Mode status in the role configuration summary.
- **FR-005**: System MUST show Evil Ring Visibility Mode status in the "Roles in Play" section visible to all players.
- **FR-006**: System MUST provide toggle description: "Evil players only know one teammate each (chain pattern)."

**Auto-Disable Logic**:
- **FR-007**: System MUST auto-disable Evil Ring Visibility with notification when Oberon is enabled and reduces non-Oberon evil below 3.
- **FR-008**: System MUST auto-disable Evil Ring Visibility with notification when expected player count is changed and reduces evil below 3.

**Ring Formation**:
- **FR-009**: System MUST form a ring visibility chain among all non-Oberon evil players during role distribution.
- **FR-010**: System MUST randomly determine the ring order (not based on role type, join order, or seating).
- **FR-011**: System MUST persist ring assignments for the entire game duration.
- **FR-012**: System MUST exclude Oberon (both Standard and Chaos) from the ring entirely.

**Role Reveal Display**:
- **FR-013**: System MUST show exactly one evil teammate's NAME to each non-Oberon evil player when ring mode is active.
- **FR-014**: System MUST NOT show the known teammate's specific role (only "Name is Evil").
- **FR-015**: System MUST show explanation message: "Ring Visibility Mode: You only know one teammate."
- **FR-016**: System MUST show hidden count: "X other evil player(s) are hidden from you" (including Oberon in count).
- **FR-017**: System MUST NOT reveal ring order or chain structure during gameplay.

**Oberon Behavior**:
- **FR-018**: System MUST NOT include Oberon in the ring visibility chain.
- **FR-019**: System MUST NOT change Oberon's visibility (remains isolated).
- **FR-020**: System MUST NOT show Oberon to any ring member as their known teammate.
- **FR-021**: System MUST include Oberon in the "hidden from you" count for ring members.

**Watcher Behavior**:
- **FR-022**: System MUST NOT show evil team information to watchers during active gameplay.
- **FR-023**: System MUST show all roles to watchers at game end (same as players).

**Mode Compatibility**:
- **FR-024**: System MUST allow Evil Ring Visibility to be enabled alongside Merlin Split Intel Mode.
- **FR-025**: System MUST allow Evil Ring Visibility to be enabled alongside Oberon Split Intel Mode.
- **FR-026**: System MUST allow Evil Ring Visibility to be enabled alongside Merlin Decoy Mode.

**Game End**:
- **FR-027**: System MUST reveal all roles normally at game end (with actual role names, not just "Evil").
- **FR-028**: System MUST NOT expose the ring assignment order at game end.

### Key Entities

- **Room** (extended):
  - `role_config.evil_ring_visibility_enabled`: boolean (default: false)

- **Game** (extended):
  - `evil_ring_assignments`: Record<playerId, knownPlayerId> | null
    - Maps each participating evil player to their one known teammate
    - NULL if ring mode disabled or game hasn't started
    - Only stored server-side, never sent to clients in full

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Room managers can enable Evil Ring Visibility Mode when 3+ non-Oberon evil players exist.
- **SC-002**: Toggle is disabled with tooltip when prerequisites not met.
- **SC-003**: Evil Ring Visibility auto-disables with notification when Oberon/player count changes make it invalid.
- **SC-004**: Evil players in ring mode see exactly ONE teammate's name (not role) in their role reveal (100% accuracy).
- **SC-005**: Ring assignments form a valid circular chain (every participant is known by exactly one other).
- **SC-006**: Oberon is never included in the ring (100% accuracy).
- **SC-007**: Oberon IS included in the "hidden from you" count (100% accuracy).
- **SC-008**: Ring assignments remain consistent for the entire game duration.
- **SC-009**: All players can see that Evil Ring Visibility Mode is active in the lobby.
- **SC-010**: Watchers see no evil team information until game ends.
- **SC-011**: Game end reveals all roles normally with actual role names without exposing ring structure.
- **SC-012**: Evil Ring Visibility can be combined with Merlin Split Intel, Oberon Split Intel, and Merlin Decoy modes.

---

## Assumptions

- The existing role distribution system can be extended to support ring assignments.
- Ring assignments will be stored similarly to other game configuration data (like split intel groups).
- Players understand that "ring visibility" means partial knowledge, not zero knowledge.
- The random ring formation is sufficiently random (using existing shuffle utilities).
- This mode does not affect any Merlin visibility modes (Decoy, Split Intel, Oberon Split Intel).
- The auto-disable notification pattern follows existing UI patterns for mutual exclusivity.
