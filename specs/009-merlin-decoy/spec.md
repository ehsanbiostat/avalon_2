# Feature Specification: Merlin Decoy Configuration

**Feature Branch**: `009-merlin-decoy`
**Created**: 2025-12-12
**Status**: Draft
**Depends On**: Special Roles (002-avalon-special-roles) ✅ Complete
**Input**: Add a new room configuration option where Merlin sees one extra player (a randomly selected good player) mixed in with the evil players, creating uncertainty about who is truly evil.

---

## Problem Statement

In standard Avalon, Merlin has perfect knowledge of evil players (except Mordred and Oberon Chaos). This makes Merlin extremely powerful and can lead to:

- Merlin being overly confident and accidentally revealing their identity
- Good team relying too heavily on Merlin's information
- Less interesting gameplay when Merlin's information is 100% reliable

This configuration option introduces a "decoy" - a randomly selected good player who appears in Merlin's evil list. With this uncertainty:

- Merlin must be more careful about acting on their information
- The good team cannot blindly trust Merlin's accusations
- Evil players have better cover since Merlin might wrongly suspect a good player
- Games become more strategically interesting with this element of doubt

---

## User Roles

| Role | Description |
|------|-------------|
| **Room Manager** | The player who created the room; configures game settings including the Merlin Decoy option |
| **Merlin** | The good player who sees evil players; affected by this configuration |
| **Other Players** | All other participants in the game |

---

## Scope

### In Scope (This Feature)

- New room configuration toggle: "Merlin Decoy Mode" (enabled/disabled)
- Random selection of one good player as the decoy during role distribution
- Displaying the decoy player in Merlin's evil player list alongside actual evil players
- Clear explanation to Merlin that one player might be a good decoy
- Proper interaction with existing visibility rules (Mordred hidden, Oberon modes)
- Display of this configuration option in the "Roles in Play" section
- Persistence of decoy selection for the duration of the game

### Out of Scope

- Multiple decoys (always exactly one decoy when enabled)
- Configurable number of decoys
- The decoy player knowing they are a decoy
- Revealing the decoy's identity at game end (the decoy remains secret)
- Decoy affecting any other role's visibility (only Merlin is affected)
- Lady of the Lake investigations revealing decoy status

---

## User Scenarios & Testing

### User Story 1 – Enable Merlin Decoy Mode (Priority: P1)

As a **room manager**, I want to enable Merlin Decoy Mode when creating a room so that Merlin's information is less reliable and the game is more challenging.

**Why this priority**: Core feature - enables the configuration.

**Independent Test**: Room manager can enable the Merlin Decoy option and see it reflected in game settings.

**Acceptance Scenarios**:

1. **Given** I am creating a room, **When** I view the role configuration panel, **Then** I see a toggle for "Merlin Decoy Mode" with a description: "One random good player appears evil to Merlin."

2. **Given** I have enabled Merlin Decoy Mode, **When** I view the room summary before distributing roles, **Then** I see "Merlin Decoy: Enabled" in the active configuration.

3. **Given** Merlin Decoy Mode is enabled, **When** any player views the "Roles in Play" section in the lobby, **Then** they see an indicator that Merlin Decoy Mode is active.

4. **Given** I am configuring the room, **When** I hover over or tap the Merlin Decoy toggle, **Then** I see a tooltip explaining: "When enabled, Merlin will see one extra player in their evil list who is actually good. Merlin won't know which one."

---

### User Story 2 – Merlin Sees Decoy Player (Priority: P1)

As **Merlin**, I want to see my evil player list with the decoy included so that I must strategize with imperfect information.

**Why this priority**: Core gameplay mechanic.

**Independent Test**: Merlin sees exactly one additional player (the decoy) mixed in with actual evil players.

**Acceptance Scenarios**:

1. **Given** I am Merlin in a 7-player game with Merlin Decoy Mode enabled, **When** I view my role reveal, **Then** I see 4 players listed as evil (3 actual evil + 1 good decoy) instead of the normal 3.

2. **Given** I am Merlin with Merlin Decoy Mode enabled, **When** I view my role reveal, **Then** I see a warning message: "⚠️ One of these players is actually good! You cannot be certain who is truly evil."

3. **Given** I am Merlin in a game with Mordred and Merlin Decoy Mode, **When** I view my role reveal, **Then** I see the decoy + visible evil players (still excluding Mordred).

4. **Given** I am Merlin in a game with Oberon (Chaos) and Merlin Decoy Mode, **When** I view my role reveal, **Then** I see the decoy + visible evil players (excluding Oberon Chaos).

5. **Given** I am Merlin, **When** I see my evil player list, **Then** the decoy is visually indistinguishable from actual evil players (no special marking).

**Visibility Combination Scenarios** (see Visibility Combinations Reference):

6. **Given** I am Merlin in a 7-player game with Decoy + Mordred, **When** I view my role reveal, **Then** I see 3 players (2 visible evil + 1 decoy), Mordred is NOT shown, and warning mentions "1 evil player is hidden".

7. **Given** I am Merlin in a 7-player game with Decoy + Oberon Chaos, **When** I view my role reveal, **Then** I see 3 players (2 visible evil + 1 decoy), Oberon Chaos is NOT shown, and warning mentions "1 evil player is hidden".

8. **Given** I am Merlin in a 7-player game with Decoy + Mordred + Oberon Chaos, **When** I view my role reveal, **Then** I see 2 players (1 visible evil + 1 decoy), both Mordred and Oberon Chaos are NOT shown, and warning mentions "2 evil players are hidden".

9. **Given** I am Merlin in a 7-player game with Decoy + Oberon Standard (NOT Chaos), **When** I view my role reveal, **Then** I see 4 players (3 evil including Oberon Standard + 1 decoy), and warning only mentions "1 is good" (no hidden players).

---

### User Story 3 – Decoy Player Experience (Priority: P1)

As a **good player who is the decoy**, I want my game experience to be unchanged so that I don't know I'm the decoy and can play normally.

**Why this priority**: Preserves fair gameplay.

**Independent Test**: The decoy player receives a normal good role reveal with no indication they are the decoy.

**Acceptance Scenarios**:

1. **Given** I am the randomly selected decoy player, **When** I view my role reveal, **Then** I see my normal good role (Loyal Servant, Percival, etc.) with no mention of being a decoy.

2. **Given** I am the decoy player, **When** I play the game, **Then** I have no way of knowing I appear evil to Merlin.

3. **Given** the game ends, **When** roles are revealed, **Then** the decoy is shown with their actual role AND a "Decoy" indicator so players understand what happened during the game.

4. **Given** the game ends with Merlin Decoy Mode enabled, **When** viewing the role reveal screen, **Then** all players can see which good player was the decoy (e.g., "Alice - Loyal Servant 🎭 Decoy").

---

### User Story 4 – Decoy Selection Rules (Priority: P2)

As the **system**, I want to select the decoy fairly so that the game remains balanced.

**Why this priority**: Ensures fair random selection.

**Independent Test**: Decoy is randomly selected from eligible good players.

**Acceptance Scenarios**:

1. **Given** roles are being distributed with Merlin Decoy Mode enabled, **When** the decoy is selected, **Then** it is randomly chosen from all good players except Merlin.

2. **Given** Percival is in the game, **When** the decoy is selected, **Then** Percival can be chosen as the decoy (they are a valid good player).

3. **Given** roles are distributed, **When** the same game is viewed multiple times, **Then** the decoy remains the same player (persisted, not re-randomized).

4. **Given** a game with Merlin Decoy Mode, **When** I examine the selection probability, **Then** each eligible good player has an equal chance of being the decoy.

---

### Edge Cases

**Decoy Selection**:
- Merlin cannot be the decoy (Merlin can't see themselves as evil)
- In a 5-player game: 3 good (including Merlin), so 2 possible decoy candidates
- Decoy selection happens during role distribution and is fixed for the game

---

## Visibility Combinations Reference

This section documents **all possible combinations** of Merlin Decoy Mode with hidden roles (Mordred, Oberon Chaos). These must be implemented exactly as specified.

### Visibility Formula

```
Merlin's List = (All Evil Players) - (Mordred) - (Oberon Chaos) + (Decoy if enabled)
```

### Combination 1: Decoy Only (No Hidden Roles)

**Configuration**: Merlin Decoy ✅ | Mordred ❌ | Oberon Chaos ❌

| What Merlin Sees | Count |
|------------------|-------|
| All evil players | N (varies by player count) |
| Decoy (good player) | +1 |
| **Total shown** | N + 1 |
| **Hidden from Merlin** | 0 evil |

**Warning Message**: "⚠️ One of these players is actually good!"

**7-Player Example** (3 evil: Assassin, Morgana, Minion):
- Without decoy: Merlin sees 3 players (Assassin, Morgana, Minion)
- With decoy: Merlin sees 4 players (Assassin, Morgana, Minion, + 1 good decoy)

---

### Combination 2: Decoy + Mordred

**Configuration**: Merlin Decoy ✅ | Mordred ✅ | Oberon Chaos ❌

| What Merlin Sees | Count |
|------------------|-------|
| Evil players (excluding Mordred) | N - 1 |
| Decoy (good player) | +1 |
| **Total shown** | N |
| **Hidden from Merlin** | 1 evil (Mordred) |

**Warning Message**: "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you."

**7-Player Example** (3 evil: Assassin, Mordred, Minion):
- Without decoy: Merlin sees 2 players (Assassin, Minion) — Mordred hidden
- With decoy: Merlin sees 3 players (Assassin, Minion, + 1 good decoy) — Mordred still hidden

**Critical Note**: With decoy, Merlin sees the same COUNT as without decoy in the baseline, but the composition is different (1 fewer evil, 1 decoy).

---

### Combination 3: Decoy + Oberon Standard

**Configuration**: Merlin Decoy ✅ | Mordred ❌ | Oberon Standard ✅

| What Merlin Sees | Count |
|------------------|-------|
| All evil players (including Oberon Standard) | N |
| Decoy (good player) | +1 |
| **Total shown** | N + 1 |
| **Hidden from Merlin** | 0 evil |

**Warning Message**: "⚠️ One of these players is actually good!"

**7-Player Example** (3 evil: Assassin, Oberon Standard, Minion):
- Without decoy: Merlin sees 3 players (Assassin, Oberon Standard, Minion)
- With decoy: Merlin sees 4 players (Assassin, Oberon Standard, Minion, + 1 good decoy)

**Note**: Oberon Standard is VISIBLE to Merlin, so this behaves like Combination 1.

---

### Combination 4: Decoy + Oberon Chaos

**Configuration**: Merlin Decoy ✅ | Mordred ❌ | Oberon Chaos ✅

| What Merlin Sees | Count |
|------------------|-------|
| Evil players (excluding Oberon Chaos) | N - 1 |
| Decoy (good player) | +1 |
| **Total shown** | N |
| **Hidden from Merlin** | 1 evil (Oberon Chaos) |

**Warning Message**: "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you."

**7-Player Example** (3 evil: Assassin, Oberon Chaos, Minion):
- Without decoy: Merlin sees 2 players (Assassin, Minion) — Oberon Chaos hidden
- With decoy: Merlin sees 3 players (Assassin, Minion, + 1 good decoy) — Oberon Chaos still hidden

---

### Combination 5: Decoy + Mordred + Oberon Standard

**Configuration**: Merlin Decoy ✅ | Mordred ✅ | Oberon Standard ✅

| What Merlin Sees | Count |
|------------------|-------|
| Evil players (excluding Mordred, including Oberon Standard) | N - 1 |
| Decoy (good player) | +1 |
| **Total shown** | N |
| **Hidden from Merlin** | 1 evil (Mordred) |

**Warning Message**: "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you."

**7-Player Example** (3 evil: Mordred, Oberon Standard, Minion):
- Without decoy: Merlin sees 2 players (Oberon Standard, Minion) — Mordred hidden
- With decoy: Merlin sees 3 players (Oberon Standard, Minion, + 1 good decoy) — Mordred still hidden

---

### Combination 6: Decoy + Mordred + Oberon Chaos (Maximum Hidden)

**Configuration**: Merlin Decoy ✅ | Mordred ✅ | Oberon Chaos ✅

| What Merlin Sees | Count |
|------------------|-------|
| Evil players (excluding Mordred AND Oberon Chaos) | N - 2 |
| Decoy (good player) | +1 |
| **Total shown** | N - 1 |
| **Hidden from Merlin** | 2 evil (Mordred + Oberon Chaos) |

**Warning Message**: "⚠️ One of these players is actually good! Also, 2 evil players are hidden from you."

**7-Player Example** (3 evil: Mordred, Oberon Chaos, Minion):
- Without decoy: Merlin sees 1 player (Minion) — Mordred & Oberon Chaos hidden
- With decoy: Merlin sees 2 players (Minion, + 1 good decoy) — Mordred & Oberon Chaos still hidden

**Critical Note**: This is the most challenging configuration for Merlin. They see only 2 players, 1 of whom is actually good!

---

### Summary Table: All Combinations

| # | Mordred | Oberon Mode | Hidden Evil | Merlin Sees (7p, 3 evil base) | Warning |
|---|---------|-------------|-------------|-------------------------------|---------|
| 1 | ❌ | None/Standard | 0 | 3 evil + 1 decoy = **4** | "1 is good" |
| 2 | ✅ | None | 1 | 2 evil + 1 decoy = **3** | "1 is good, 1 hidden" |
| 3 | ❌ | Standard | 0 | 3 evil + 1 decoy = **4** | "1 is good" |
| 4 | ❌ | Chaos | 1 | 2 evil + 1 decoy = **3** | "1 is good, 1 hidden" |
| 5 | ✅ | Standard | 1 | 2 evil + 1 decoy = **3** | "1 is good, 1 hidden" |
| 6 | ✅ | Chaos | 2 | 1 evil + 1 decoy = **2** | "1 is good, 2 hidden" |

---

### Player Count Impact (Baseline - No Hidden Roles)

| Players | Good | Evil | Without Decoy | With Decoy | Decoy Candidates |
|---------|------|------|---------------|------------|------------------|
| 5 | 3 | 2 | 2 players | 3 players | 2 (Good - Merlin) |
| 6 | 4 | 2 | 2 players | 3 players | 3 (Good - Merlin) |
| 7 | 4 | 3 | 3 players | 4 players | 3 (Good - Merlin) |
| 8 | 5 | 3 | 3 players | 4 players | 4 (Good - Merlin) |
| 9 | 6 | 3 | 3 players | 4 players | 5 (Good - Merlin) |
| 10 | 6 | 4 | 4 players | 5 players | 5 (Good - Merlin) |

**With Mordred and/or Oberon Chaos**: Subtract 1 from "Evil shown" for each hidden role, then add 1 decoy.

---

## Requirements

### Functional Requirements

**Configuration**:
- **FR-001**: System MUST allow room manager to enable/disable Merlin Decoy Mode during room creation.
- **FR-002**: System MUST display Merlin Decoy Mode status in the role configuration summary.
- **FR-003**: System MUST show Merlin Decoy Mode status in the "Roles in Play" section visible to all players.
- **FR-004**: System MUST provide a clear description of the Merlin Decoy Mode effect.

**Decoy Selection**:
- **FR-005**: System MUST randomly select exactly one good player (excluding Merlin) as the decoy when Merlin Decoy Mode is enabled.
- **FR-006**: System MUST use uniform random distribution when selecting the decoy.
- **FR-007**: System MUST persist the decoy selection for the entire game duration.
- **FR-008**: System MUST NOT allow Merlin to be selected as the decoy.

**Merlin Visibility**:
- **FR-009**: System MUST include the decoy player in Merlin's evil player list when Merlin Decoy Mode is enabled.
- **FR-010**: System MUST display the decoy indistinguishably from actual evil players in Merlin's view.
- **FR-011**: System MUST display a warning to Merlin that one player may be a good decoy.
- **FR-012**: System MUST correctly apply existing visibility rules (Mordred hidden, Oberon modes) alongside the decoy.

**Visibility Combination Requirements** (see Visibility Combinations Reference section):
- **FR-012a**: When Decoy is enabled WITHOUT Mordred or Oberon Chaos, Merlin MUST see ALL evil players PLUS the decoy.
- **FR-012b**: When Decoy is enabled WITH Mordred, Merlin MUST see all evil players EXCEPT Mordred, PLUS the decoy.
- **FR-012c**: When Decoy is enabled WITH Oberon Standard, Merlin MUST see all evil players INCLUDING Oberon Standard, PLUS the decoy.
- **FR-012d**: When Decoy is enabled WITH Oberon Chaos, Merlin MUST see all evil players EXCEPT Oberon Chaos, PLUS the decoy.
- **FR-012e**: When Decoy is enabled WITH both Mordred AND Oberon Chaos, Merlin MUST see all evil players EXCEPT both Mordred AND Oberon Chaos, PLUS the decoy.

**Warning Message Requirements**:
- **FR-011a**: When no evil players are hidden, warning MUST state: "One of these players is actually good!"
- **FR-011b**: When 1 evil player is hidden (Mordred OR Oberon Chaos), warning MUST state: "One of these players is actually good! Also, 1 evil player is hidden from you."
- **FR-011c**: When 2 evil players are hidden (Mordred AND Oberon Chaos), warning MUST state: "One of these players is actually good! Also, 2 evil players are hidden from you."

**Decoy Secrecy (During Game)**:
- **FR-013**: System MUST NOT reveal decoy status to any player during the game, including the decoy themselves.
- **FR-014**: System MUST reveal decoy identity at game end during role reveal, showing a "Decoy" indicator alongside their actual role.
- **FR-015**: System MUST show the decoy's actual role (not decoy status) during gameplay, only revealing at game end.

**Interactions**:
- **FR-016**: System MUST NOT affect any other role's visibility rules (only Merlin is affected).
- **FR-017**: Lady of the Lake investigations MUST reveal actual loyalty (good), not decoy status.
- **FR-018**: Percival's view MUST NOT be affected by decoy mode (only sees Merlin candidates as normal).

### Key Entities (Updated)

- **Room** (extended):
  - `role_config.merlin_decoy_enabled`: boolean (default: false)

- **Game** (extended):
  - `merlin_decoy_player_id`: UUID | null (the selected decoy, null if mode disabled)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Room managers can enable Merlin Decoy Mode for 100% of supported player counts (5-10).
- **SC-002**: Merlin sees exactly one additional player when Merlin Decoy Mode is enabled.
- **SC-003**: Decoy is randomly selected with uniform distribution across eligible good players.
- **SC-004**: Decoy player receives no indication of their decoy status during gameplay (only revealed at game end).
- **SC-005**: Existing visibility rules (Mordred, Oberon modes) continue to function correctly with decoy mode.
- **SC-005a**: Combination "Decoy + Mordred" correctly hides Mordred while showing decoy.
- **SC-005b**: Combination "Decoy + Oberon Chaos" correctly hides Oberon Chaos while showing decoy.
- **SC-005c**: Combination "Decoy + Mordred + Oberon Chaos" correctly hides both while showing decoy.
- **SC-005d**: Combination "Decoy + Oberon Standard" correctly shows Oberon Standard AND decoy.
- **SC-006**: All players can see that Merlin Decoy Mode is active in the lobby.
- **SC-007**: Lady of the Lake correctly identifies the decoy as "Good" (their true alignment).
- **SC-008**: Decoy identity is revealed to all players at game end alongside other role reveals.

---

## Assumptions

- Special Roles feature (002-avalon-special-roles) is fully implemented
- Quest System (003-avalon-quest-system) is implemented
- Lady of the Lake (004-lady-of-the-lake) is implemented
- The `role_config` JSONB structure in the rooms table can be extended
- The decoy selection can be stored in the games table
- Random selection uses cryptographically sufficient randomness

---

## Out of Scope Considerations

These are explicitly NOT part of this feature but may be considered for future enhancements:

1. **Multiple decoys** - Could scale with player count (e.g., 2 decoys for 10 players)
2. **Decoy-aware roles** - New roles that interact with the decoy mechanic
3. **Configurable decoy count** - Let room manager choose 0, 1, or 2 decoys
