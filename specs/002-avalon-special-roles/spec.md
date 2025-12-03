# Feature Specification: Avalon Online – Phase 2: Special Roles & Configurations

**Feature Branch**: `002-avalon-special-roles`
**Created**: 2025-12-03
**Status**: Draft
**Depends On**: MVP (001-avalon-mvp-lobby) ✅ Complete
**Input**: Enhance the Avalon Online game with configurable special character roles and Lady of the Lake setup

---

## Problem Statement

The MVP Avalon Online supports basic Good/Evil role distribution with Merlin and Assassin. However, the full Avalon experience requires:

- **Additional special characters**: Percival, Morgana, Mordred, Oberon each add strategic depth
- **Configurable game setup**: Room managers should customize which roles appear in their game
- **Lady of the Lake**: A loyalty-checking token that adds tension (setup designation in this phase; full mechanic in Phase 3)
- **Role transparency**: Players should know which roles are active in their game without knowing who holds them

This phase extends the role system to support the complete Avalon character roster while keeping the game balanced and the room manager in control of complexity.

---

## Clarifications

### Session 2025-12-03

- Q: How should special roles be configured? → A: Room manager selects which roles to include from a menu when creating the room
- Q: Should Mordred be visible to Merlin? → A: No, Mordred is hidden from Merlin (standard Avalon rules)
- Q: What scope for Lady of the Lake? → A: Setup designation only (show who starts with it); full in-game mechanic deferred to Phase 3 with missions
- Q: Should Assassin guess mechanic be implemented? → A: Defer to Phase 3 when mission win/loss logic is built
- Q: What role info should be shown publicly? → A: Show both active roles list AND Lady of the Lake holder (if applicable)
- Q: How should Oberon work? → A: Configurable - room manager chooses between "Standard" (visible to Merlin) or "Chaos" (invisible to everyone including Merlin)

---

## User Roles

| Role | Description |
|------|-------------|
| **Player** | A participant who has joined a room and will receive a role |
| **Room Manager** | The player who created the room; configures game settings including role selection |

---

## Scope

### In Scope (This Phase)

- Role configuration UI for room managers during room creation
- Support for all standard Avalon special characters:
  - Percival (Good) - sees Merlin candidates
  - Morgana (Evil) - appears as Merlin to Percival
  - Mordred (Evil) - hidden from Merlin
  - Oberon (Evil) - configurable isolation mode
- Configurable Oberon variants (Standard vs Chaos mode)
- Lady of the Lake setup designation (who starts with it)
- Public display of active roles in lobby and game
- Public display of Lady of the Lake holder
- Updated role reveal with character-specific information
- Validation of valid role combinations
- Minimum/maximum player requirements per role configuration

### Out of Scope (Future Phases)

- Lady of the Lake in-game mechanic (loyalty checks after quests)
- Assassin end-game guess mechanic
- Mission selection and team building
- Voting phases
- Quest execution (pass/fail)
- Custom/homebrew roles
- Role preset templates (e.g., "Beginner", "Advanced")

---

## Special Characters Reference

### Good Team Characters

| Character | Ability | Knows | Visible To |
|-----------|---------|-------|------------|
| **Merlin** | Sees evil players | All evil except Mordred | Percival, Morgana (indistinguishable) |
| **Percival** | Sees Merlin candidates | Merlin + Morgana (can't tell apart) | No one |
| **Loyal Servant** | None | Nothing special | No one |

### Evil Team Characters

| Character | Ability | Knows | Visible To |
|-----------|---------|-------|------------|
| **Assassin** | End-game Merlin guess (Phase 3) | Other evil (except Oberon) | Merlin, other evil |
| **Morgana** | Appears as Merlin to Percival | Other evil (except Oberon) | Merlin, other evil, Percival |
| **Mordred** | Hidden from Merlin | Other evil (except Oberon) | Other evil only (NOT Merlin) |
| **Oberon (Standard)** | Isolated from evil team | Nothing | Merlin only |
| **Oberon (Chaos)** | Fully isolated | Nothing | No one |
| **Minion** | Basic evil | Other evil (except Oberon) | Merlin, other evil |

### Lady of the Lake (Token)

| Property | Value |
|----------|-------|
| Type | Token (not a role) |
| Starting Holder | Player to the left of room manager |
| Phase 2 Scope | Display only (who has it) |
| Phase 3 Scope | Full loyalty-check mechanic |
| Player Count | 7+ players recommended |

---

## User Scenarios & Testing

### User Story 1 – Configure Game Roles (Priority: P1)

As a **room manager**, I want to select which special roles are in my game so that I can control the complexity and strategy depth.

**Why this priority**: Core feature of this phase - enables customizable role selection.

**Independent Test**: Room manager can create a room with a custom role configuration.

**Acceptance Scenarios**:

1. **Given** I am creating a room with 7 players, **When** I open the role configuration panel, **Then** I see all available roles organized by team (Good/Evil) with checkboxes to include/exclude.

2. **Given** I am configuring a 5-player game, **When** I try to add more evil roles than allowed (2 evil for 5 players), **Then** the system shows an error and prevents invalid configuration.

3. **Given** I have selected Percival, **When** I view the role configuration, **Then** the system suggests adding Morgana for balance (optional recommendation, not required).

4. **Given** I select Oberon, **When** I view the Oberon options, **Then** I can choose between "Standard" (visible to Merlin) and "Chaos" (fully hidden) modes.

5. **Given** I have completed role configuration, **When** I view the room summary, **Then** I see a list of all selected roles that will be distributed.

---

### User Story 2 – Lady of the Lake Setup (Priority: P2)

As a **room manager**, I want to optionally include Lady of the Lake in my game so that players know who starts with the loyalty-checking token.

**Why this priority**: Setup feature for future game mechanics.

**Independent Test**: Room manager can enable Lady of the Lake and see who is designated as the starting holder.

**Acceptance Scenarios**:

1. **Given** I am creating a room with 7+ players, **When** I view the game options, **Then** I see a toggle to enable Lady of the Lake.

2. **Given** I have enabled Lady of the Lake, **When** roles are distributed, **Then** the player to the left of the room manager is designated as the Lady of the Lake holder.

3. **Given** Lady of the Lake is enabled, **When** I view the lobby after role distribution, **Then** I see a badge indicating who holds the Lady of the Lake token.

4. **Given** I am creating a room with fewer than 7 players, **When** I try to enable Lady of the Lake, **Then** I see a warning that it's recommended for 7+ players (but can still enable it).

5. **Given** Lady of the Lake is enabled, **When** any player views their role, **Then** they see whether they hold the Lady of the Lake token (if applicable).

---

### User Story 3 – View Active Roles (Priority: P1)

As a **player**, I want to see which roles are active in my game so that I can strategize accordingly without knowing who has each role.

**Why this priority**: Transparency about game configuration is essential for strategy.

**Independent Test**: All players in a room can see the list of active roles.

**Acceptance Scenarios**:

1. **Given** I am in a room where roles have been distributed, **When** I view the lobby, **Then** I see a "Roles in Play" section listing all active special roles (e.g., "Merlin, Percival, Assassin, Morgana").

2. **Given** I am in a room with Lady of the Lake enabled, **When** I view the lobby, **Then** I see the Lady of the Lake holder's name displayed.

3. **Given** roles have NOT been distributed yet, **When** I view the lobby, **Then** I see "Roles in Play" showing the configured roles that will be assigned.

4. **Given** Oberon is in the game in "Chaos" mode, **When** I view the roles in play, **Then** it shows "Oberon (Chaos)" to indicate the variant.

---

### User Story 4 – Percival Role Reveal (Priority: P1)

As **Percival**, I want to see who might be Merlin so that I can protect them while being wary of Morgana.

**Why this priority**: Core Percival ability.

**Independent Test**: Percival sees exactly 2 players (Merlin + Morgana) marked as "Merlin candidates" without knowing which is real.

**Acceptance Scenarios**:

1. **Given** I am assigned Percival and Morgana is in the game, **When** I view my role, **Then** I see 2 players listed as "One of these is Merlin" without indication of which is real.

2. **Given** I am assigned Percival and Morgana is NOT in the game, **When** I view my role, **Then** I see only Merlin listed (since there's no Morgana to confuse me).

3. **Given** I am assigned Percival, **When** I view my role card, **Then** I see clear instructions: "Protect Merlin, but beware - Morgana appears the same to you!"

---

### User Story 5 – Morgana Role Reveal (Priority: P1)

As **Morgana**, I want to know my role and teammates so that I can deceive Percival effectively.

**Why this priority**: Core Morgana ability setup.

**Independent Test**: Morgana sees evil teammates and knows she appears as Merlin to Percival.

**Acceptance Scenarios**:

1. **Given** I am assigned Morgana, **When** I view my role, **Then** I see my evil teammates (except Oberon) and a note: "You appear as Merlin to Percival."

2. **Given** I am assigned Morgana and Percival is NOT in the game, **When** I view my role, **Then** I see a note: "Percival is not in this game, so your disguise ability has no effect."

---

### User Story 6 – Mordred Role Reveal (Priority: P1)

As **Mordred**, I want to know I am hidden from Merlin so that I can operate more boldly.

**Why this priority**: Core Mordred ability setup.

**Independent Test**: Mordred sees evil teammates and knows Merlin cannot see them.

**Acceptance Scenarios**:

1. **Given** I am assigned Mordred, **When** I view my role, **Then** I see my evil teammates and a note: "Merlin does not know you are evil."

2. **Given** I am assigned Mordred, **When** Merlin views their role, **Then** Merlin does NOT see Mordred in their evil player list.

---

### User Story 7 – Oberon Role Reveal (Priority: P1)

As **Oberon**, I want to understand my isolated position so that I can strategize accordingly.

**Why this priority**: Core Oberon ability setup.

**Independent Test**: Oberon sees appropriate information based on variant mode.

**Acceptance Scenarios**:

1. **Given** I am assigned Oberon (Standard mode), **When** I view my role, **Then** I see: "You are evil but work alone. You don't know your teammates, and they don't know you. Merlin can see you."

2. **Given** I am assigned Oberon (Chaos mode), **When** I view my role, **Then** I see: "You are evil but completely hidden. No one knows you are evil - not even Merlin!"

3. **Given** Oberon (Standard) is in the game, **When** Merlin views their role, **Then** Merlin sees Oberon in their evil player list.

4. **Given** Oberon (Chaos) is in the game, **When** Merlin views their role, **Then** Merlin does NOT see Oberon in their evil player list.

5. **Given** Oberon is in the game (either mode), **When** other evil players view their roles, **Then** they do NOT see Oberon in their teammate list.

---

### User Story 8 – Updated Merlin Reveal (Priority: P1)

As **Merlin**, I want to see only the evil players who are visible to me so that I can guide my team accurately.

**Why this priority**: Merlin's ability must respect Mordred/Oberon visibility rules.

**Independent Test**: Merlin sees evil players correctly based on game configuration.

**Acceptance Scenarios**:

1. **Given** Mordred is in the game, **When** I (as Merlin) view my role, **Then** I do NOT see Mordred in my evil player list.

2. **Given** Oberon (Standard) is in the game, **When** I (as Merlin) view my role, **Then** I see Oberon in my evil player list.

3. **Given** Oberon (Chaos) is in the game, **When** I (as Merlin) view my role, **Then** I do NOT see Oberon in my evil player list.

4. **Given** both Mordred and Oberon (Chaos) are in the game, **When** I (as Merlin) view my role, **Then** I see a warning: "Two evil players are hidden from you!"

---

### Edge Cases

**Role Configuration**:
- Manager tries to select more special roles than players allow → System prevents and shows error
- Manager selects Percival without Merlin → System warns (optional, not blocking)
- Manager selects Morgana without Percival → System notes "Morgana's ability won't be useful without Percival"
- Manager changes player count after configuring roles → System re-validates configuration

**Lady of the Lake**:
- Room has fewer than 7 players with Lady enabled → Show warning but allow
- Lady holder is the room manager → Valid (holder is player to manager's left, which wraps around if needed)
- Lady holder disconnects → Token designation remains with that player (they keep it on rejoin)

**Oberon Visibility**:
- Oberon (Standard) + Mordred → Merlin sees Oberon but not Mordred
- Oberon (Chaos) + Mordred → Merlin sees neither
- Only Oberon as evil with 2-evil game → Valid but chaotic (other evil slot filled by Minion who doesn't know Oberon)

---

## Requirements

### Functional Requirements

**Role Configuration (Room Creation)**:
- **FR-101**: System MUST allow room manager to select which special roles to include when creating a room.
- **FR-102**: System MUST validate role configurations against player count constraints (see Role Constraints below).
- **FR-103**: System MUST show role recommendations/warnings for unbalanced configurations (e.g., Percival without Morgana).
- **FR-104**: System MUST persist role configuration as part of room settings.

**Special Character Visibility**:
- **FR-105**: System MUST implement Percival's ability: sees Merlin and Morgana as indistinguishable "Merlin candidates".
- **FR-106**: System MUST implement Morgana's disguise: appears in Percival's Merlin candidate list.
- **FR-107**: System MUST implement Mordred's concealment: hidden from Merlin's evil player list.
- **FR-108**: System MUST implement Oberon Standard mode: visible to Merlin, invisible to/from other evil.
- **FR-109**: System MUST implement Oberon Chaos mode: invisible to everyone including Merlin.
- **FR-110**: System MUST allow room manager to choose Oberon mode (Standard or Chaos) when Oberon is selected.

**Lady of the Lake Setup**:
- **FR-111**: System MUST allow room manager to enable/disable Lady of the Lake for games with 7+ players.
- **FR-112**: System MUST allow Lady of the Lake for games with fewer than 7 players (with warning).
- **FR-113**: System MUST automatically designate Lady of the Lake holder as the player to the left of the room manager.
- **FR-114**: System MUST display Lady of the Lake holder publicly in the lobby after role distribution.
- **FR-115**: System MUST show Lady of the Lake designation on the holder's role card.

**Public Role Information**:
- **FR-116**: System MUST display list of active special roles in the lobby (visible to all players).
- **FR-117**: System MUST indicate Oberon mode (Standard/Chaos) in the active roles display when applicable.
- **FR-118**: System MUST display Lady of the Lake holder name in lobby when enabled.

**Role Distribution Updates**:
- **FR-119**: System MUST assign configured special roles during role distribution.
- **FR-120**: System MUST ensure role distribution respects all visibility rules.
- **FR-121**: System MUST update role reveal modal with character-specific information.

### Role Constraints

**Good/Evil Ratios (unchanged from MVP)**:

| Players | Good | Evil |
|---------|------|------|
| 5 | 3 | 2 |
| 6 | 4 | 2 |
| 7 | 4 | 3 |
| 8 | 5 | 3 |
| 9 | 6 | 3 |
| 10 | 6 | 4 |

**Required Roles**:
- Merlin MUST always be included (Good)
- Assassin MUST always be included (Evil)

**Optional Good Roles**:
- Percival (max 1)

**Optional Evil Roles**:
- Morgana (max 1, recommended with Percival)
- Mordred (max 1)
- Oberon (max 1, Standard or Chaos mode)

**Constraints**:
- Total Good special roles ≤ Good player count
- Total Evil special roles ≤ Evil player count
- Remaining slots filled with Loyal Servants (Good) or Minions (Evil)

### Key Entities (Updated)

- **Room** (extended):
  - `role_config`: JSON object storing selected roles and variants
  - `lady_of_lake_enabled`: boolean
  - `lady_of_lake_holder_id`: player ID (set after distribution)

- **PlayerRole** (extended):
  - `special_role`: enum including new roles (percival, morgana, mordred, oberon_standard, oberon_chaos)
  - `has_lady_of_lake`: boolean

---

## Success Criteria

### Measurable Outcomes

- **SC-101**: Room managers can configure roles for 100% of supported player counts (5-10).
- **SC-102**: All 6 special characters (Merlin, Percival, Assassin, Morgana, Mordred, Oberon) function correctly per Avalon rules.
- **SC-103**: Percival sees exactly the correct "Merlin candidates" (Merlin + Morgana if present, or just Merlin).
- **SC-104**: Merlin's visible evil list excludes Mordred and Oberon (Chaos) correctly.
- **SC-105**: Evil team visibility correctly excludes Oberon in all modes.
- **SC-106**: Lady of the Lake holder is correctly designated and displayed.
- **SC-107**: Active roles are publicly visible to all players in the room.
- **SC-108**: Role configuration validation prevents all invalid combinations.

---

## Assumptions

- MVP implementation (001-avalon-mvp-lobby) is complete and deployed
- Current special_role column in database supports string values (migration may be needed for new enum values)
- Room configuration can be stored as JSON in the rooms table
- Lady of the Lake in-game mechanics (loyalty checks) will be implemented in Phase 3 with missions
- Assassin guess mechanic will be implemented in Phase 3 with mission win/loss detection

---

## Technical Notes (for planning phase)

### Database Changes Anticipated
- Add `role_config` JSONB column to `rooms` table
- Add `lady_of_lake_enabled` boolean to `rooms` table  
- Add `lady_of_lake_holder_id` UUID to `rooms` table
- Extend `special_role` enum with: `percival`, `morgana`, `mordred`, `oberon_standard`, `oberon_chaos`
- Add `has_lady_of_lake` boolean to `player_roles` table

### API Changes Anticipated
- Update `POST /api/rooms` to accept role configuration
- Update `GET /api/rooms/[code]/role` to return character-specific visibility data
- Add validation endpoint or logic for role configurations

### UI Changes Anticipated
- Role configuration panel in CreateRoomModal
- Updated RoleRevealModal for each special character
- "Roles in Play" section in Lobby component
- Lady of the Lake badge display

