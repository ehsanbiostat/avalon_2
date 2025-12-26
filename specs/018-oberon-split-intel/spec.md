# Feature Specification: Oberon Split Intel Mode

**Feature Branch**: `018-oberon-split-intel`
**Created**: 2025-12-26
**Status**: Draft
**Depends On**: Merlin Split Intel Mode (011-merlin-split-intel) ✅ Complete, Special Roles (002-avalon-special-roles) ✅ Complete
**Input**: Add a new game option similar to Merlin Split Intel Mode, but with the key difference that the Mixed Intel group MUST always contain Oberon (standard) and one randomly picked good player. The Certain Evil group contains Morgana and Assassin. This mode is ONLY available when Oberon Standard is enabled (not available with Oberon Chaos or no Oberon).

---

## Problem Statement

The existing Merlin Split Intel Mode divides Merlin's information into two groups:
- **Certain Evil Group**: 1-2 guaranteed evil players
- **Mixed Intel Group**: 1 evil player (any visible evil) + 1 good player

This creates strategic depth, but the random selection of which evil player goes to the mixed group doesn't leverage the unique nature of specific roles.

**Oberon Split Intel Mode** introduces a variant where:
- **Oberon is ALWAYS in the Mixed Intel Group** - This makes thematic sense because Oberon works alone and is already isolated from the evil team
- **The Certain Evil Group contains the coordinated evil players** (Morgana, Assassin) who know each other
- This creates a clear strategic dynamic: Merlin knows for certain who the "team evil" core is, but Oberon (the lone wolf) is mixed with an innocent

This mode:
- Provides a clear thematic split between "organized evil" and "lone wolf evil"
- Makes Oberon's role more interesting - they're hidden in a 50/50 with a good player
- Gives Merlin actionable intel on the coordinated evil while creating uncertainty around Oberon
- Only works when Oberon Standard is in play (visible to Merlin type)

---

## User Roles

| Role | Description |
|------|-------------|
| **Room Manager** | The player who created the room; configures game settings including the Oberon Split Intel option |
| **Merlin** | The good player who sees the coordinated evil team clearly, but sees Oberon mixed with a good player |
| **Oberon** | The lone wolf evil player who is always placed in the Mixed Intel group |
| **Other Players** | All other participants in the game |

---

## Scope

### In Scope (This Feature)

- New room configuration toggle: "Oberon Split Intel Mode" (enabled/disabled)
- **Prerequisite**: Oberon Standard must be enabled to use this mode
- Mutually exclusive with existing Merlin Split Intel Mode and Merlin Decoy Mode
- Display two distinct groups in Merlin's role reveal:
  - **Certain Evil Group**: Morgana, Assassin (coordinated evil team)
  - **Mixed Intel Group**: Oberon + 1 randomly selected good player
- Clear visual separation and labeling of the two groups
- Explanation text specific to this mode
- Validation that blocks enabling this mode if:
  - No Oberon is selected
  - Oberon Chaos is selected (instead of Oberon Standard)
- Display of this configuration option in the "Roles in Play" section
- Persistence of selections for the duration of the game
- Reveal of mixed group composition at game end

### Out of Scope

- Combining with Merlin Decoy Mode
- Combining with standard Merlin Split Intel Mode
- Working with Oberon Chaos (hidden from Merlin by definition)
- Allowing configuration of which evil player goes to mixed group (Oberon is always in mixed)
- Affecting any other role's visibility (only Merlin is affected)

---

## User Scenarios & Testing

### User Story 1 – Enable Oberon Split Intel Mode (Priority: P1)

As a **room manager**, I want to enable Oberon Split Intel Mode so that Merlin sees Oberon mixed with a good player while having certainty about the coordinated evil team.

**Why this priority**: Core feature - enables the configuration.

**Independent Test**: Room manager can enable the Oberon Split Intel option when Oberon Standard is selected.

**Acceptance Scenarios**:

1. **Given** I am creating a room with Oberon Standard enabled, **When** I view the role configuration panel, **Then** I see a toggle for "Oberon Split Intel Mode" with a description: "Merlin sees Oberon mixed with a good player, while other evil players (Morgana, Assassin) are shown as certain evil."

2. **Given** I have NOT enabled any Oberon role, **When** I try to enable Oberon Split Intel Mode, **Then** the toggle is disabled with a tooltip: "Requires Oberon (Standard) to be enabled."

3. **Given** I have enabled Oberon Chaos, **When** I try to enable Oberon Split Intel Mode, **Then** the toggle is disabled with a tooltip: "Not available with Oberon (Chaos) - Oberon must be visible to Merlin."

4. **Given** I have enabled Oberon Split Intel Mode, **When** I try to enable Merlin Decoy Mode OR standard Merlin Split Intel Mode, **Then** the system prevents it (mutually exclusive) with a message explaining only one intel mode can be active.

5. **Given** Oberon Split Intel Mode is enabled, **When** I disable Oberon Standard, **Then** Oberon Split Intel Mode is automatically disabled with a notification.

6. **Given** Oberon Split Intel Mode is enabled, **When** any player views the "Roles in Play" section in the lobby, **Then** they see an indicator that Oberon Split Intel Mode is active.

---

### User Story 2 – Merlin Sees Oberon in Mixed Group (Priority: P1)

As **Merlin**, I want to see Oberon mixed with a good player in one group, and the coordinated evil team (Morgana, Assassin) in another group, so that I have certainty about the evil team core but uncertainty about the lone wolf.

**Why this priority**: Core gameplay mechanic.

**Independent Test**: Merlin sees two visually distinct groups with Oberon always in the mixed group.

**Acceptance Scenarios**:

1. **Given** I am Merlin in a game with Oberon Split Intel Mode enabled (Oberon Standard + Morgana + Assassin), **When** I view my role reveal, **Then** I see:
   - **Group 1 - "Certain Evil" (🎯)**: Morgana and Assassin with label "These players are definitely evil"
   - **Group 2 - "Mixed Intel" (❓)**: Oberon + 1 good player with label "One is evil (Oberon), one is good - you don't know which"

2. **Given** I am Merlin, **When** I view the Certain Evil group, **Then** all players listed are the coordinated evil team (NOT Oberon).

3. **Given** I am Merlin, **When** I view the Mixed Intel group, **Then** I see exactly 2 players: Oberon and one randomly selected good player (not Merlin).

4. **Given** I am Merlin with Oberon Split Intel Mode enabled, **When** I view my role reveal, **Then** the two groups are visually separated with distinct styling (different colors/borders/icons).

5. **Given** I am Merlin in a game with Mordred AND Oberon Split Intel Mode, **When** I view my role reveal, **Then** Mordred is NOT shown in either group (still hidden as per Mordred's ability), but Oberon IS in the mixed group.

---

### User Story 3 – Good Player in Mixed Group Experience (Priority: P1)

As a **good player who is in the mixed group with Oberon**, I want my game experience to be unchanged so that I don't know I'm in Merlin's mixed group and can play normally.

**Why this priority**: Preserves fair gameplay.

**Independent Test**: The good player in the mixed group receives a normal good role reveal with no indication they are in the mixed group.

**Acceptance Scenarios**:

1. **Given** I am the randomly selected good player in the mixed group with Oberon, **When** I view my role reveal, **Then** I see my normal good role with no mention of being in the mixed group.

2. **Given** the game ends, **When** roles are revealed, **Then** the mixed group composition is shown so players understand that Oberon was mixed with a specific good player.

3. **Given** the game ends with Oberon Split Intel Mode enabled, **When** viewing the role reveal screen, **Then** all players can see which good player was in the mixed group with Oberon (e.g., "Alice - Loyal Servant 🔀 Mixed with Oberon").

---

### User Story 4 – Oberon's Experience (Priority: P2)

As **Oberon**, I want my gameplay to remain unchanged so that I don't know I'm always in the mixed group with a good player.

**Why this priority**: Preserves Oberon's isolated gameplay.

**Independent Test**: Oberon sees the standard Oberon role reveal with no mention of the mixed group.

**Acceptance Scenarios**:

1. **Given** I am Oberon in a game with Oberon Split Intel Mode enabled, **When** I view my role reveal, **Then** I see the standard Oberon reveal (I don't know evil teammates, I'm alone).

2. **Given** I am Oberon, **When** I play the game, **Then** I have no indication that Merlin sees me mixed with a good player.

---

### Edge Cases

**Prerequisite Validation**:
- If no Oberon is selected → Oberon Split Intel toggle is disabled
- If Oberon Chaos is selected → Oberon Split Intel toggle is disabled
- If Oberon Standard is removed after enabling Oberon Split Intel → Mode is auto-disabled

**Group Distribution with Hidden Roles**:
- With Mordred: Mordred is hidden from BOTH groups (Merlin doesn't see Mordred at all)
- Certain Evil group contains: Morgana, Assassin, and any other visible evil EXCEPT Oberon
- Mixed group ALWAYS contains: Oberon + 1 random good player (never Merlin)

**Minimum Requirements**:
- Must have Oberon Standard enabled
- Must have at least one other visible evil (Morgana or Assassin) for the Certain group
- If only Oberon is the visible evil (e.g., Mordred + Oberon only), Certain group is empty but mode still works

**Interaction with Other Modes**:
- Oberon Split Intel is mutually exclusive with Merlin Decoy Mode
- Oberon Split Intel is mutually exclusive with standard Merlin Split Intel Mode
- Only ONE of these three modes can be active at a time

---

## Requirements

### Functional Requirements

**Configuration & Prerequisites**:
- **FR-001**: System MUST allow room manager to enable/disable Oberon Split Intel Mode during room creation.
- **FR-002**: System MUST require Oberon Standard to be enabled before Oberon Split Intel Mode can be enabled.
- **FR-003**: System MUST prevent enabling Oberon Split Intel Mode when Oberon Chaos is selected.
- **FR-004**: System MUST automatically disable Oberon Split Intel Mode if Oberon Standard is disabled.
- **FR-005**: System MUST make Oberon Split Intel Mode mutually exclusive with Merlin Decoy Mode.
- **FR-006**: System MUST make Oberon Split Intel Mode mutually exclusive with standard Merlin Split Intel Mode.
- **FR-007**: System MUST display Oberon Split Intel Mode status in the role configuration summary.
- **FR-008**: System MUST show Oberon Split Intel Mode status in the "Roles in Play" section visible to all players.
- **FR-009**: System MUST provide a clear description of the Oberon Split Intel Mode effect.

**Group Formation**:
- **FR-010**: System MUST create a Certain Evil Group containing all visible evil players EXCEPT Oberon.
- **FR-011**: System MUST create a Mixed Intel Group containing exactly Oberon and 1 randomly selected good player.
- **FR-012**: System MUST always place Oberon Standard in the Mixed Intel Group (not random).
- **FR-013**: System MUST randomly select which good player (excluding Merlin) goes to the Mixed Intel Group.
- **FR-014**: System MUST persist group assignments for the entire game duration.
- **FR-015**: System MUST NOT allow Merlin to be placed in the Mixed Intel Group.

**Merlin Display**:
- **FR-016**: System MUST display the two groups with clear visual separation (distinct sections/colors/borders).
- **FR-017**: System MUST label the Certain Evil Group with "🎯 Certain Evil" or similar clear label.
- **FR-018**: System MUST label the Mixed Intel Group with "❓ Mixed Intel" or similar clear label.
- **FR-019**: System MUST show explanation text: "These players are definitely evil" for Certain group.
- **FR-020**: System MUST show explanation text: "One is evil (Oberon), one is good" for Mixed group.
- **FR-021**: System MUST NOT reveal which player is Oberon in the Mixed Intel Group.

**Hidden Role Interactions**:
- **FR-022**: System MUST exclude Mordred from both groups (Mordred remains hidden from Merlin).
- **FR-023**: System MUST show all other visible evil (Morgana, Assassin) in the Certain Evil group.
- **FR-024**: If only Oberon is visible (due to Mordred), System MUST show an empty Certain group with only the Mixed group containing Oberon.

**Game End Reveal**:
- **FR-025**: System MUST reveal the Mixed Intel Group composition at game end.
- **FR-026**: System MUST show which good player was mixed with Oberon with a "🔀 Mixed with Oberon" indicator.
- **FR-027**: System MUST NOT reveal mixed group status to any player during the game.

**Player Experience**:
- **FR-028**: System MUST NOT show any indication to Oberon that they are in the mixed group.
- **FR-029**: System MUST NOT show any indication to the good player in mixed group about their status.
- **FR-030**: Lady of the Lake investigations MUST reveal actual loyalty, not group membership.

### Key Entities

- **Room** (extended):
  - `role_config.oberon_split_intel_enabled`: boolean (default: false)

- **Game** (extended):
  - `oberon_split_intel_certain_evil_ids`: UUID[] | null (evil players in Certain group, excluding Oberon)
  - `oberon_split_intel_mixed_good_id`: UUID | null (the good player in Mixed group with Oberon)
  - Note: Oberon's ID is not stored separately since Oberon is always in the mixed group

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Room managers can enable Oberon Split Intel Mode only when Oberon Standard is selected.
- **SC-002**: Attempting to enable Oberon Split Intel Mode without Oberon Standard shows a clear error/disabled state.
- **SC-003**: Merlin sees exactly two distinct groups when Oberon Split Intel Mode is enabled.
- **SC-004**: The Certain Evil Group contains all visible evil players EXCEPT Oberon (100% accuracy).
- **SC-005**: The Mixed Intel Group contains exactly Oberon and 1 good player.
- **SC-006**: Players in the mixed group receive no indication of their status during gameplay.
- **SC-007**: Mordred remains hidden from both groups when present.
- **SC-008**: Oberon Split Intel Mode, Merlin Decoy Mode, and standard Merlin Split Intel Mode are mutually exclusive.
- **SC-009**: All players can see that Oberon Split Intel Mode is active in the lobby.
- **SC-010**: Mixed group composition (Oberon + good player) is revealed to all players at game end.

---

## Assumptions

- Special Roles feature (002-avalon-special-roles) is fully implemented
- Merlin Split Intel Mode (011-merlin-split-intel) is fully implemented (UI patterns can be reused)
- The existing Oberon Standard role is implemented with `knownToMerlin: true`
- The `role_config` JSONB structure in the rooms table can be extended
- The game table can store player IDs for group assignments (similar to existing split intel)
- Random selection uses cryptographically sufficient randomness
