# Feature Specification: Evil Ring Visibility Mode

**Feature Branch**: `019-evil-ring-visibility`
**Created**: 2025-12-30
**Status**: Draft
**Depends On**: Special Roles (002-avalon-special-roles) ✅ Complete
**Input**: Add a new game configuration in which the evil players are introduced to each other in a ring/chain pattern. If there are three or more evil players in the game, not all of them know each other. For example, with evil players A, B, and C: A knows B, B knows C, and C knows A, but A does not know C and C does not know B.

---

## Problem Statement

In standard Avalon, all evil players (except Oberon) know each other completely. This makes coordination among the evil team relatively easy and predictable.

**Evil Ring Visibility Mode** introduces strategic uncertainty within the evil team itself by limiting each evil player's knowledge to only one other evil teammate. This creates a "ring" or "chain" of visibility:
- Each evil player knows exactly ONE other evil player
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

---

## Scope

### In Scope (This Feature)

- New room configuration toggle: "Evil Ring Visibility" (enabled/disabled)
- Ring visibility logic for evil players (3+ evil players)
- Modified role reveal showing only ONE known evil teammate
- Clear explanation in role reveal about the limited visibility
- Fallback behavior for 2 evil players (standard visibility - both see each other)
- Display of this configuration option in the "Roles in Play" section
- Persistence of ring assignments for the entire game duration
- Compatibility with existing special evil roles (Morgana, Mordred, Assassin, Minion)

### Out of Scope

- Changing Oberon's behavior (Oberon remains completely isolated)
- Changing Merlin's visibility of evil players
- Affecting Lady of the Lake investigations
- Post-game reveal of the ring structure (all roles revealed as normal)
- Combining with other future visibility modification modes
- Player ability to discover the ring order during gameplay (deduction only)

---

## User Scenarios & Testing

### User Story 1 – Enable Evil Ring Visibility Mode (Priority: P1)

As a **room manager**, I want to enable Evil Ring Visibility Mode so that evil players only know one teammate each, creating more strategic uncertainty.

**Why this priority**: Core feature - enables the configuration that affects gameplay.

**Independent Test**: Room manager can enable the Evil Ring Visibility toggle in room creation settings.

**Acceptance Scenarios**:

1. **Given** I am creating a room, **When** I view the game options panel, **Then** I see a toggle for "Evil Ring Visibility" with a description: "Evil players only know one teammate each (ring pattern)."

2. **Given** I have enabled Evil Ring Visibility Mode, **When** any player views the "Roles in Play" section in the lobby, **Then** they see an indicator that Evil Ring Visibility is active.

3. **Given** Evil Ring Visibility Mode is enabled, **When** the expected player count is less than 6 (fewer than 3 evil players possible), **Then** the system shows a warning: "Evil Ring Visibility works best with 3+ evil players (6+ total players)."

4. **Given** Evil Ring Visibility Mode is enabled, **When** I configure the room with 5 players (only 2 evil), **Then** the mode remains enabled but the system explains that both evil players will see each other (standard visibility) due to having only 2 evil players.

---

### User Story 2 – Evil Player Sees One Teammate (Priority: P1)

As an **evil player** (non-Oberon) in a game with Evil Ring Visibility enabled, I want to see exactly one evil teammate during role reveal so that I have partial knowledge of my team.

**Why this priority**: Core gameplay mechanic that defines the feature experience.

**Independent Test**: Distribute roles with Evil Ring Visibility enabled → Evil player sees exactly one teammate in role reveal.

**Acceptance Scenarios**:

1. **Given** I am an evil player (Assassin, Morgana, Mordred, or Minion) in a game with Evil Ring Visibility enabled and 3+ evil players, **When** I view my role reveal, **Then** I see exactly ONE evil teammate (not all of them).

2. **Given** I am an evil player, **When** I view my role reveal with Evil Ring Visibility, **Then** I see an explanation: "In Ring Visibility Mode, you only know one teammate. Other evil players exist but are hidden from you."

3. **Given** Player A, B, and C are evil with ring A→B→C→A, **When** Player A views role reveal, **Then** A sees only B. When B views role reveal, B sees only C. When C views role reveal, C sees only A.

4. **Given** I am an evil player in a game with Evil Ring Visibility enabled but only 2 evil players total, **When** I view my role reveal, **Then** I see my one evil teammate (standard visibility applies since ring requires 3+).

5. **Given** I am Mordred in Evil Ring Visibility mode, **When** I view my role reveal, **Then** I still see one evil teammate (Mordred's "hidden from Merlin" ability is unaffected, but ring visibility applies).

---

### User Story 3 – Oberon Remains Isolated (Priority: P1)

As **Oberon**, I want to remain completely isolated from the ring so that my unique gameplay is preserved.

**Why this priority**: Oberon's isolation is fundamental to the role and must not be broken.

**Independent Test**: Oberon sees no teammates regardless of Evil Ring Visibility setting.

**Acceptance Scenarios**:

1. **Given** I am Oberon Standard in a game with Evil Ring Visibility enabled, **When** I view my role reveal, **Then** I see no teammates (unchanged from standard Oberon behavior).

2. **Given** I am Oberon Chaos in a game with Evil Ring Visibility enabled, **When** I view my role reveal, **Then** I see no teammates (unchanged from standard Oberon Chaos behavior).

3. **Given** other evil players are in Evil Ring Visibility mode, **When** the ring is formed, **Then** Oberon is NOT included in the ring (the ring only includes visible evil players).

4. **Given** there are 3 non-Oberon evil players (A, B, C) and Oberon, **When** the ring is formed, **Then** the ring is A→B→C→A, and no one in the ring sees Oberon, and Oberon sees no one.

---

### User Story 4 – Ring Assignment Persists (Priority: P2)

As an **evil player**, I want the ring assignment to remain consistent throughout the game so that my knowledge doesn't change mid-game.

**Why this priority**: Important for gameplay consistency but secondary to the core visibility mechanic.

**Independent Test**: Evil player's known teammate remains the same in all role reveal views throughout the game.

**Acceptance Scenarios**:

1. **Given** I am assigned to know Player B in the ring, **When** I view my role again at any point in the game, **Then** I still see Player B as my known teammate.

2. **Given** the game ends with Evil Ring Visibility enabled, **When** I view the game over screen, **Then** all roles are revealed normally (the ring structure itself is not explicitly shown, but all evil players are revealed as evil).

---

### Edge Cases

**Minimum Player Count**:
- With 5 players (2 evil): Ring mode is enabled but both evil players see each other (ring of 2 = standard visibility). System explains this in role reveal.
- With 6+ players (3+ evil): Full ring visibility applies.

**Oberon Interaction**:
- Oberon is always excluded from the ring.
- If Oberon reduces visible evil to 2 players, those 2 see each other normally.
- Example: 3 evil total (Assassin, Morgana, Oberon) → Assassin and Morgana see each other (ring of 2 = standard).

**Mordred Interaction**:
- Mordred participates in the ring normally (still hidden from Merlin, but sees one evil teammate).

**All Special Evil Roles**:
- Assassin, Morgana, Mordred, Minion all participate in the ring equally.
- Ring assignment is random, not based on role importance.

**Ring Formation Algorithm**:
- Ring is formed by shuffling eligible evil players and creating a circular chain.
- The assignment happens during role distribution (same as other visibility assignments).

---

## Requirements

### Functional Requirements

**Configuration & Prerequisites**:
- **FR-001**: System MUST allow room manager to enable/disable Evil Ring Visibility Mode during room creation.
- **FR-002**: System MUST display Evil Ring Visibility Mode status in the role configuration summary.
- **FR-003**: System MUST show Evil Ring Visibility Mode status in the "Roles in Play" section visible to all players.
- **FR-004**: System MUST show a warning when Evil Ring Visibility is enabled with fewer than 6 expected players.
- **FR-005**: System MUST provide a clear description of the Evil Ring Visibility Mode effect.

**Ring Formation**:
- **FR-006**: System MUST form a ring visibility chain among all non-Oberon evil players during role distribution.
- **FR-007**: System MUST randomly determine the ring order (not based on role type, join order, or seating).
- **FR-008**: System MUST persist ring assignments for the entire game duration.
- **FR-009**: System MUST fall back to standard visibility (all see each other) when only 2 non-Oberon evil players exist.
- **FR-010**: System MUST exclude Oberon (both Standard and Chaos) from the ring entirely.

**Role Reveal Display**:
- **FR-011**: System MUST show exactly one evil teammate to each non-Oberon evil player when ring mode is active.
- **FR-012**: System MUST show an explanation message: "Ring Visibility Mode: You only know one teammate."
- **FR-013**: System MUST indicate how many other evil players exist but are hidden (e.g., "X other evil player(s) are hidden from you").
- **FR-014**: System MUST NOT reveal ring order or chain structure during gameplay.

**Oberon Behavior**:
- **FR-015**: System MUST NOT include Oberon in the ring visibility chain.
- **FR-016**: System MUST NOT change Oberon's visibility (remains isolated).
- **FR-017**: System MUST NOT show Oberon to any ring member as their known teammate.

**Game End**:
- **FR-018**: System MUST reveal all roles normally at game end (no special ring reveal).
- **FR-019**: System MUST NOT expose the ring assignment order at game end.

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

- **SC-001**: Room managers can enable Evil Ring Visibility Mode in room creation settings.
- **SC-002**: Evil players in ring mode see exactly ONE teammate in their role reveal (100% accuracy).
- **SC-003**: Ring assignments form a valid circular chain (every participant is known by exactly one other).
- **SC-004**: Oberon is never included in the ring (100% accuracy).
- **SC-005**: Ring assignments remain consistent for the entire game duration.
- **SC-006**: All players can see that Evil Ring Visibility Mode is active in the lobby.
- **SC-007**: Game end reveals all roles normally without exposing ring structure.
- **SC-008**: With only 2 non-Oberon evil players, both see each other (graceful fallback).

---

## Assumptions

- The existing role distribution system can be extended to support ring assignments.
- Ring assignments will be stored similarly to other game configuration data (like split intel groups).
- Players understand that "ring visibility" means partial knowledge, not zero knowledge.
- The random ring formation is sufficiently random (using existing shuffle utilities).
- This mode does not affect any Merlin visibility modes (Decoy, Split Intel, Oberon Split Intel).
