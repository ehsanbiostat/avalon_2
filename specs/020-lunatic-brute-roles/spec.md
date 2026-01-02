# Feature Specification: Lunatic & Brute Evil Characters

**Feature Branch**: `020-lunatic-brute-roles`
**Created**: 2026-01-01
**Status**: Draft
**Input**: User description: "Add Lunatic and Brute evil characters from Big Box expansion. The Lunatic is on the side of Evil, and they must Fail every Quest that they are on. The Brute is on the side of Evil. They may Fail only the first three Quests, but they may play Success on any Quest."

## Overview

This feature adds two new Evil character roles from the Avalon Big Box expansion:

1. **Lunatic** - An Evil player with a compulsion to fail. They MUST play Fail on every quest they participate in—they have no choice.

2. **Brute** - An Evil player with limited sabotage capability. They can only play Fail on quests 1, 2, or 3. On quests 4 and 5, they MUST play Success. They may also voluntarily play Success on any quest.

These roles add strategic depth by creating Evil players with constrained voting options, making them potentially identifiable through their quest voting patterns.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host Enables Lunatic Role (Priority: P1)

As a room host, I want to enable the Lunatic role during game setup so that the game includes an Evil player who is forced to fail every quest.

**Why this priority**: Core enablement flow required for all other functionality.

**Independent Test**: Can be fully tested by enabling Lunatic in role config and verifying role assignment displays correctly.

**Acceptance Scenarios**:

1. **Given** a room host in the lobby, **When** they access role configuration, **Then** they see Lunatic as an optional Evil role with a clear description of its constraint.
2. **Given** a room with 7+ players and Lunatic enabled, **When** roles are distributed, **Then** exactly one Evil player receives the Lunatic role.
3. **Given** a game where Lunatic is enabled, **When** the Lunatic player views their role card, **Then** they see clear indication that they must fail all quests.

---

### User Story 2 - Lunatic Quest Voting Constraint (Priority: P1)

As a Lunatic player on a quest, I am forced to play Fail—I have no choice, reinforcing the character's compulsive nature.

**Why this priority**: Core gameplay mechanic that defines the Lunatic role.

**Independent Test**: Can be tested by placing Lunatic on a quest team and verifying only Fail action is available.

**Acceptance Scenarios**:

1. **Given** a Lunatic player is on a quest team in the Quest phase, **When** they view quest action options, **Then** only the Fail option is available (Success is disabled/greyed out).
2. **Given** a Lunatic player on any quest (1-5), **When** they click the Fail button, **Then** Fail is recorded (manual click required, no auto-submit).
3. **Given** a Lunatic player attempts to submit Success via API, **When** the request is processed, **Then** the system rejects it with an appropriate error message.

---

### User Story 3 - Host Enables Brute Role (Priority: P1)

As a room host, I want to enable the Brute role during game setup so that the game includes an Evil player with limited sabotage ability.

**Why this priority**: Core enablement flow required for Brute functionality.

**Independent Test**: Can be fully tested by enabling Brute in role config and verifying role assignment displays correctly.

**Acceptance Scenarios**:

1. **Given** a room host in the lobby, **When** they access role configuration, **Then** they see Brute as an optional Evil role with a clear description of its quest constraints.
2. **Given** a room with 7+ players and Brute enabled, **When** roles are distributed, **Then** exactly one Evil player receives the Brute role.
3. **Given** a game where Brute is enabled, **When** the Brute player views their role card, **Then** they see clear indication of which quests they can/cannot fail.

---

### User Story 4 - Brute Quest Voting on Early Quests (Priority: P1)

As a Brute player on quests 1, 2, or 3, I can choose to play either Success or Fail, giving me full Evil flexibility on early quests.

**Why this priority**: Core gameplay mechanic for early game Brute behavior.

**Independent Test**: Can be tested by placing Brute on quest 1, 2, or 3 and verifying both options are available.

**Acceptance Scenarios**:

1. **Given** a Brute player is on a quest team for Quest 1, **When** they view quest action options, **Then** both Success and Fail options are available.
2. **Given** a Brute player is on a quest team for Quest 2, **When** they choose Fail, **Then** the action is accepted and recorded.
3. **Given** a Brute player is on a quest team for Quest 3, **When** they choose Success, **Then** the action is accepted and recorded.

---

### User Story 5 - Brute Quest Voting on Late Quests (Priority: P1)

As a Brute player on quests 4 or 5, I am forced to play Success—my sabotage ability is exhausted.

**Why this priority**: Core gameplay mechanic that defines Brute's late-game limitation.

**Independent Test**: Can be tested by placing Brute on quest 4 or 5 and verifying only Success is available.

**Acceptance Scenarios**:

1. **Given** a Brute player is on a quest team for Quest 4, **When** they view quest action options, **Then** only the Success option is available (Fail is disabled/greyed out).
2. **Given** a Brute player is on a quest team for Quest 5, **When** they click the Success button, **Then** Success is recorded (manual click required, no auto-submit).
3. **Given** a Brute player on Quest 4 or 5 attempts to submit Fail via API, **When** the request is processed, **Then** the system rejects it with an appropriate error message.

---

### User Story 6 - Role Visibility for Lunatic and Brute (Priority: P2)

As a player with special visibility abilities, I should see Lunatic and Brute according to standard evil visibility rules.

**Why this priority**: Ensures new roles integrate with existing visibility system.

**Independent Test**: Can be tested by checking Merlin's view includes Lunatic/Brute (unless Oberon modes apply).

**Acceptance Scenarios**:

1. **Given** a game with Merlin and Lunatic, **When** Merlin views their role information, **Then** the Lunatic appears in Merlin's known evil list (standard evil visibility).
2. **Given** a game with Merlin and Brute, **When** Merlin views their role information, **Then** the Brute appears in Merlin's known evil list (standard evil visibility).
3. **Given** a game with Evil Ring Visibility enabled, **When** Lunatic or Brute view their teammates, **Then** they see according to ring visibility rules.
4. **Given** a game with Lunatic and other evil players, **When** the Lunatic views their role, **Then** they see their evil teammates (standard evil team visibility).

---

### User Story 7 - Assassin Target Selection (Priority: P2)

As the Assassin in the assassin phase, I can target any Good player including attempting to identify Merlin, regardless of Lunatic/Brute presence.

**Why this priority**: Ensures assassin mechanics work correctly with new roles.

**Independent Test**: Can be tested by reaching assassin phase with Lunatic/Brute in game and verifying target selection works.

**Acceptance Scenarios**:

1. **Given** a game reaches assassin phase with Lunatic in play, **When** the Assassin selects a target, **Then** the assassination proceeds normally.
2. **Given** a game with Brute in play reaches assassin phase, **When** the Assassin selects a target, **Then** the assassination proceeds normally (Brute's quest constraints do not affect assassination).

---

### Edge Cases

- What happens when both Lunatic and Brute are enabled in the same game?
  - Both can be enabled simultaneously if there are enough Evil slots. They are assigned to different players.

- What happens if Lunatic or Brute is on the team for Quest 4 with 2-fails-required rule?
  - Lunatic still plays Fail. Brute must play Success. The 2-fails rule is about quest outcome, not individual actions.

- Can Lunatic or Brute be combined with other special Evil roles (Morgana, Mordred, Oberon)?
  - Yes. Lunatic/Brute are additional Evil special roles. A player can only have one special role, so enabling more evil roles requires more players.

- What if there aren't enough Evil slots for all enabled roles?
  - Role configuration validation should prevent enabling more special Evil roles than available Evil slots.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST add "Lunatic" as a new special role type with Evil alignment.
- **FR-002**: System MUST add "Brute" as a new special role type with Evil alignment.
- **FR-003**: Host MUST be able to enable/disable Lunatic role in room configuration.
- **FR-004**: Host MUST be able to enable/disable Brute role in room configuration.
- **FR-005**: System MUST assign Lunatic to exactly one Evil player when enabled.
- **FR-006**: System MUST assign Brute to exactly one Evil player when enabled.
- **FR-007**: Lunatic MUST only be able to submit Fail quest actions (Success is blocked).
- **FR-008**: Brute MUST be able to submit either Success or Fail on Quests 1, 2, and 3.
- **FR-009**: Brute MUST only be able to submit Success quest actions on Quests 4 and 5 (Fail is blocked).
- **FR-010**: Quest action UI MUST show constrained options as disabled/greyed out buttons (visible but not clickable) for Lunatic and Brute.
- **FR-011**: Role reveal MUST clearly describe the quest constraints for Lunatic and Brute players.
- **FR-012**: Lunatic and Brute MUST follow standard Evil visibility rules (visible to Merlin unless Mordred-like modifications apply).
- **FR-013**: Lunatic and Brute MUST see their Evil teammates (standard Evil team visibility).
- **FR-014**: System MUST validate role configuration to ensure enough Evil slots for all enabled special Evil roles.
- **FR-015**: Lunatic and Brute role toggles MUST only be available/visible in games with 7+ players (3+ Evil slots).
- **FR-016**: API MUST reject invalid quest actions with appropriate error codes (LUNATIC_MUST_FAIL, BRUTE_CANNOT_FAIL_LATE_QUEST).

### Key Entities

- **Lunatic** 🤪: An Evil special role. Quest constraint: MUST play Fail on all quests (1-5). No choice given.
- **Brute** 👊: An Evil special role. Quest constraint: MAY play Fail on quests 1-3 only. MUST play Success on quests 4-5. MAY play Success on any quest.

### Role Description Text

- **Lunatic**: "You are the Lunatic, a servant of Mordred driven by madness. You MUST play Fail on every quest you join—you have no choice."
- **Brute**: "You are the Brute, a servant of Mordred who has some tricks, but not many. You can only play Fail on Quests 1, 2, and 3. On Quests 4 and 5, you MUST play Success. Use your early sabotage wisely!"

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players assigned Lunatic role can complete quest voting with Fail-only constraint in under 3 seconds (streamlined UI).
- **SC-002**: Players assigned Brute role see correct constraint messaging based on current quest number.
- **SC-003**: 100% of invalid quest actions (Lunatic trying Success, Brute trying Fail on Quest 4/5) are rejected by the API.
- **SC-004**: Role configuration prevents enabling more special Evil roles than available Evil player slots.
- **SC-005**: Both Lunatic and Brute roles can coexist in a single game when player count supports it.

## Clarifications

### Session 2026-01-01

- Q: Can Lunatic be combined with Assassin role? → A: Lunatic and Assassin are mutually exclusive (separate players).
- Q: Can Brute be combined with Assassin role? → A: Brute and Assassin are mutually exclusive (separate players).
- Q: How should the UI display unavailable quest action options? → A: Show as disabled/greyed out (visible but not clickable).
- Q: Should constrained players auto-submit their only valid option? → A: No, require manual click to submit.
- Q: Should Merlin be able to see Lunatic and Brute as evil? → A: Yes, standard evil visibility (Merlin sees them like regular minions).
- Q: What emoji should represent each role? → A: Lunatic: 🤪 (crazy face), Brute: 👊 (fist).
- Q: What is the minimum player count for Lunatic/Brute? → A: 7+ players (requires 3+ Evil slots). 5-6 player games only have 2 Evil slots.
- Q: Can Lunatic/Brute be combined with Oberon isolation? → A: No, they are mutually exclusive special roles (one per player).
- Q: What role description text should players see? → A: Lunatic: "You are the Lunatic, a servant of Mordred driven by madness. You MUST play Fail on every quest you join—you have no choice." Brute: "You are the Brute, a servant of Mordred who has some tricks, but not many. You can only play Fail on Quests 1, 2, and 3. On Quests 4 and 5, you MUST play Success. Use your early sabotage wisely!"
- Q: How should watchers see Lunatic/Brute roles? → A: Watchers cannot see player roles during the game. Roles (including Lunatic/Brute) are revealed to everyone only at game end.

## Assumptions

- Lunatic and Brute are mutually exclusive with each other on the same player (a player cannot be both Lunatic and Brute).
- Lunatic cannot be the Assassin—they are separate players.
- Brute cannot be the Assassin—they are separate players.
- Lunatic, Brute, and Oberon are mutually exclusive—a player can only have one special role.
- Lunatic and Brute are treated as standard Evil for visibility purposes (visible to Merlin, know other Evil teammates).
- These roles do not affect team proposal voting—only quest action voting.
- The "quest number" constraint for Brute is based on the game's current quest counter (1-5), not the number of quests the Brute has participated in.
