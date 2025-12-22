# Feature Specification: Merlin Split Intel Mode

**Feature Branch**: `011-merlin-split-intel`
**Created**: 2025-12-22
**Status**: Draft
**Depends On**: Special Roles (002-avalon-special-roles) ✅ Complete, Merlin Decoy (009-merlin-decoy) ✅ Complete
**Input**: Add a new mode where Merlin sees two separate groups - a "Certain Evil" group containing 1-2 players guaranteed to be evil, and a "Mixed Intel" group containing exactly one evil player and one good player (Merlin doesn't know which is which).

---

## Problem Statement

The existing Merlin Decoy Mode adds uncertainty by mixing one good player into Merlin's entire evil list. However, this can make the game frustrating as Merlin has NO certain information - any player they see could be the decoy.

This new "Merlin Split Intel Mode" provides a more strategic middle ground:

- Merlin gets **some certain information** (1-2 players guaranteed evil)
- Merlin gets **some uncertain information** (2 players, one good and one evil mixed)
- This creates interesting gameplay where Merlin can act confidently on the certain group while being cautious about the mixed group
- Evil players in the "certain" group are at higher risk, creating strategic depth
- The good player in the mixed group may be wrongly suspected by Merlin, but with less overall confusion than full decoy mode

---

## User Roles

| Role | Description |
|------|-------------|
| **Room Manager** | The player who created the room; configures game settings including the Merlin Split Intel option |
| **Merlin** | The good player who sees two separate groups of players with different certainty levels |
| **Other Players** | All other participants in the game |

---

## Scope

### In Scope (This Feature)

- New room configuration toggle: "Merlin Split Intel Mode" (enabled/disabled)
- Mutually exclusive with existing Merlin Decoy Mode (cannot enable both)
- Display two distinct groups in Merlin's role reveal:
  - **Certain Evil Group**: 1-2 players who are guaranteed evil
  - **Mixed Intel Group**: Exactly 2 players (1 evil + 1 good), Merlin doesn't know which is which
- Clear visual separation and labeling of the two groups
- Explanation text for each group in Merlin's role description
- Random selection of which evil players go to "certain" vs "mixed" group
- Random selection of which good player goes to the mixed group
- Proper interaction with existing visibility rules (Mordred hidden, Oberon modes)
- Display of this configuration option in the "Roles in Play" section
- Persistence of selections for the duration of the game
- Reveal of mixed group composition at game end

### Out of Scope

- Configurable group sizes (fixed algorithm based on player count)
- Multiple good players in mixed group
- The mixed group player knowing they are in the mixed group
- Affecting any other role's visibility (only Merlin is affected)
- Lady of the Lake investigations revealing mixed group status

---

## User Scenarios & Testing

### User Story 1 – Enable Merlin Split Intel Mode (Priority: P1)

As a **room manager**, I want to enable Merlin Split Intel Mode when creating a room so that Merlin has some certain information and some uncertain information.

**Why this priority**: Core feature - enables the configuration.

**Independent Test**: Room manager can enable the Merlin Split Intel option and see it reflected in game settings.

**Acceptance Scenarios**:

1. **Given** I am creating a room, **When** I view the role configuration panel, **Then** I see a toggle for "Merlin Split Intel Mode" with a description: "Merlin sees two groups: certain evil players, and a mixed group with one evil and one good player."

2. **Given** I have enabled Merlin Split Intel Mode, **When** I try to enable Merlin Decoy Mode, **Then** the system prevents it (mutually exclusive) with a message explaining only one mode can be active.

3. **Given** Merlin Split Intel Mode is enabled, **When** any player views the "Roles in Play" section in the lobby, **Then** they see an indicator that Merlin Split Intel Mode is active.

---

### User Story 2 – Merlin Sees Two Separate Groups (Priority: P1)

As **Merlin**, I want to see my information divided into two clearly labeled groups so that I know which players are certain evil and which are uncertain.

**Why this priority**: Core gameplay mechanic.

**Independent Test**: Merlin sees two visually distinct groups with appropriate labels and explanations.

**Acceptance Scenarios**:

1. **Given** I am Merlin in a 7-player game with Merlin Split Intel Mode enabled (3 evil players), **When** I view my role reveal, **Then** I see:
   - **Group 1 - "Certain Evil" (🎯)**: 1-2 player names with label "These players are definitely evil"
   - **Group 2 - "Mixed Intel" (❓)**: 2 player names with label "One is evil, one is good - you don't know which"

2. **Given** I am Merlin, **When** I view the Certain Evil group, **Then** all players listed are guaranteed to be evil (100% certainty).

3. **Given** I am Merlin, **When** I view the Mixed Intel group, **Then** exactly one player is evil and exactly one player is good.

4. **Given** I am Merlin with Split Intel Mode enabled, **When** I view my role reveal, **Then** the two groups are visually separated with distinct styling (different colors/borders/icons).

5. **Given** I am Merlin in a game with Mordred and Split Intel Mode, **When** I view my role reveal, **Then** Mordred is NOT shown in either group (still hidden as per Mordred's ability).

---

### User Story 3 – Mixed Group Player Experience (Priority: P1)

As a **good player who is in the mixed group**, I want my game experience to be unchanged so that I don't know I'm in Merlin's mixed group and can play normally.

**Why this priority**: Preserves fair gameplay.

**Independent Test**: The good player in the mixed group receives a normal good role reveal with no indication they are in the mixed group.

**Acceptance Scenarios**:

1. **Given** I am the randomly selected good player in the mixed group, **When** I view my role reveal, **Then** I see my normal good role with no mention of being in the mixed group.

2. **Given** the game ends, **When** roles are revealed, **Then** the mixed group composition is shown so players understand what happened during the game.

3. **Given** the game ends with Split Intel Mode enabled, **When** viewing the role reveal screen, **Then** all players can see which good player was in the mixed group (e.g., "Alice - Loyal Servant 🔀 Mixed Group").

---

### User Story 4 – Group Selection Algorithm (Priority: P2)

As the **system**, I want to distribute players into groups fairly so that the game remains balanced.

**Why this priority**: Ensures fair random selection.

**Independent Test**: Players are randomly distributed to groups following the algorithm rules.

**Acceptance Scenarios**:

1. **Given** a 7-player game (3 evil) with Split Intel Mode enabled, **When** groups are formed, **Then**:
   - Certain Evil Group: 1-2 evil players
   - Mixed Intel Group: 1 evil player + 1 good player (not Merlin)

2. **Given** a 5-player game (2 evil) with Split Intel Mode enabled, **When** groups are formed, **Then**:
   - Certain Evil Group: 1 evil player
   - Mixed Intel Group: 1 evil player + 1 good player (not Merlin)

3. **Given** roles are distributed, **When** the same game is viewed multiple times, **Then** the group assignments remain the same (persisted, not re-randomized).

4. **Given** Mordred is in the game, **When** groups are formed, **Then** Mordred is excluded from BOTH groups (hidden from Merlin entirely).

---

### Edge Cases

**Group Distribution**:
- Merlin cannot be in the mixed group (Merlin can't see themselves)
- With only 2 evil players: 1 goes to Certain, 1 goes to Mixed
- With 3+ evil players: 2 go to Certain, 1 goes to Mixed (or adjusted if some are hidden)
- Mordred and Oberon Chaos are excluded from all groups (still hidden)
- If only 1 visible evil player remains after exclusions, that player goes to Mixed (no Certain group)

**Interaction with Hidden Roles**:
- With Mordred: -1 evil available for distribution
- With Oberon Chaos: -1 evil available for distribution
- With both: -2 evil available for distribution
- Minimum requirement: At least 1 evil must be visible to use Split Intel Mode

---

## Group Distribution Algorithm

### Base Distribution (No Hidden Roles)

| Evil Count | Certain Evil Group | Mixed Group Evil | Mixed Group Good | Notes |
|------------|-------------------|------------------|------------------|-------|
| 2 | 1 | 1 | 1 | Minimum viable |
| 3 | 2 | 1 | 1 | Standard 7p |
| 4 | 2 | 1 | 1 | Standard 10p |

### With Mordred (1 Hidden Evil)

| Visible Evil | Certain Evil Group | Mixed Group Evil | Mixed Group Good | Notes |
|--------------|-------------------|------------------|------------------|-------|
| 1 | 0 | 1 | 1 | Only mixed group shown |
| 2 | 1 | 1 | 1 | Like base 2 evil |
| 3 | 2 | 1 | 1 | Like base 3 evil |

### With Mordred + Oberon Chaos (2 Hidden Evil)

| Visible Evil | Certain Evil Group | Mixed Group Evil | Mixed Group Good | Notes |
|--------------|-------------------|------------------|------------------|-------|
| 0 | - | - | - | Mode cannot activate (show warning) |
| 1 | 0 | 1 | 1 | Only mixed group shown |
| 2 | 1 | 1 | 1 | Like base 2 evil |

---

## Requirements

### Functional Requirements

**Configuration**:
- **FR-001**: System MUST allow room manager to enable/disable Merlin Split Intel Mode during room creation.
- **FR-002**: System MUST make Merlin Decoy Mode and Merlin Split Intel Mode mutually exclusive.
- **FR-003**: System MUST display Merlin Split Intel Mode status in the role configuration summary.
- **FR-004**: System MUST show Merlin Split Intel Mode status in the "Roles in Play" section visible to all players.
- **FR-005**: System MUST provide a clear description of the Merlin Split Intel Mode effect.

**Group Formation**:
- **FR-006**: System MUST create a Certain Evil Group containing 1-2 guaranteed evil players (varies by game size).
- **FR-007**: System MUST create a Mixed Intel Group containing exactly 1 evil player and 1 good player.
- **FR-008**: System MUST randomly select which evil players go to which group.
- **FR-009**: System MUST randomly select which good player (excluding Merlin) goes to the Mixed Intel Group.
- **FR-010**: System MUST persist group assignments for the entire game duration.
- **FR-011**: System MUST NOT allow Merlin to be placed in the Mixed Intel Group.

**Merlin Display**:
- **FR-012**: System MUST display the two groups with clear visual separation (distinct sections/colors/borders).
- **FR-013**: System MUST label the Certain Evil Group with "🎯 Certain Evil" or similar clear label.
- **FR-014**: System MUST label the Mixed Intel Group with "❓ Mixed Intel" or similar clear label.
- **FR-015**: System MUST show explanation text for each group: "These players are definitely evil" and "One is evil, one is good".
- **FR-016**: System MUST NOT reveal which player is evil/good in the Mixed Intel Group.

**Hidden Role Interactions**:
- **FR-017**: System MUST exclude Mordred from both groups (Mordred remains hidden from Merlin).
- **FR-018**: System MUST exclude Oberon Chaos from both groups (Oberon Chaos remains hidden from Merlin).
- **FR-019**: System MUST show Oberon Standard in the appropriate group (visible to Merlin).
- **FR-020**: If only 1 visible evil player exists, System MUST show only the Mixed Intel Group (no Certain group).
- **FR-021**: If 0 visible evil players exist, System MUST disable Split Intel Mode with a warning.

**Game End Reveal**:
- **FR-022**: System MUST reveal the Mixed Intel Group composition at game end.
- **FR-023**: System MUST show which good player was in the mixed group with a "🔀 Mixed Group" indicator.
- **FR-024**: System MUST NOT reveal mixed group status to any player during the game.

**Other Role Interactions**:
- **FR-025**: Lady of the Lake investigations MUST reveal actual loyalty, not group membership.
- **FR-026**: Percival's view MUST NOT be affected by Split Intel Mode.

### Key Entities (Updated)

- **Room** (extended):
  - `role_config.merlin_split_intel_enabled`: boolean (default: false)

- **Game** (extended):
  - `split_intel_certain_evil_ids`: UUID[] | null (evil players in Certain group)
  - `split_intel_mixed_evil_id`: UUID | null (the evil player in Mixed group)
  - `split_intel_mixed_good_id`: UUID | null (the good player in Mixed group)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Room managers can enable Merlin Split Intel Mode for all supported player counts (5-10).
- **SC-002**: Merlin sees exactly two distinct groups when Split Intel Mode is enabled.
- **SC-003**: The Certain Evil Group contains only evil players (100% accuracy).
- **SC-004**: The Mixed Intel Group contains exactly 1 evil and 1 good player.
- **SC-005**: Players in the mixed group receive no indication of their status during gameplay (only revealed at game end).
- **SC-006**: Existing visibility rules (Mordred, Oberon modes) continue to function correctly with Split Intel Mode.
- **SC-007**: Merlin Decoy Mode and Split Intel Mode cannot both be enabled simultaneously.
- **SC-008**: All players can see that Split Intel Mode is active in the lobby.
- **SC-009**: Lady of the Lake correctly identifies players by their true alignment regardless of group membership.
- **SC-010**: Mixed group composition is revealed to all players at game end alongside other role reveals.

---

## Assumptions

- Special Roles feature (002-avalon-special-roles) is fully implemented
- Merlin Decoy Mode (009-merlin-decoy) is fully implemented
- Quest System (003-avalon-quest-system) is implemented
- Lady of the Lake (004-lady-of-the-lake) is implemented
- The `role_config` JSONB structure in the rooms table can be extended
- The game table can store multiple player IDs for group assignments
- Random selection uses cryptographically sufficient randomness

---

## Out of Scope Considerations

These are explicitly NOT part of this feature but may be considered for future enhancements:

1. **Configurable group sizes** - Let room manager choose how many go to each group
2. **Multiple good players in mixed group** - Increase uncertainty
3. **Group-aware roles** - New roles that interact with the split intel mechanic
4. **Combined modes** - Allowing both Decoy and Split Intel together for extreme difficulty
