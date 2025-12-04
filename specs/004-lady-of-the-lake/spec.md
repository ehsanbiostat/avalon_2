# Phase 4: Lady of the Lake – Specification

| Field | Value |
|-------|-------|
| **Spec ID** | 004 |
| **Title** | Lady of the Lake – Investigation Mechanic |
| **Status** | Draft |
| **Created** | 2024-12-05 |
| **Author** | AI Assistant |

---

## 1. Problem Statement

In games with 7+ players, players need an additional information-gathering mechanism to balance the increased complexity. The Lady of the Lake provides this by allowing certain players to privately investigate others' alignment, adding a layer of deduction and social deception.

Currently, Lady of the Lake assignment exists (Phase 2), but the actual investigation mechanic is not implemented. Players cannot use the Lady to investigate others.

---

## 2. User Roles

| Role | Description |
|------|-------------|
| **Lady Holder** | Player currently holding the Lady of the Lake token |
| **Investigation Target** | Player being investigated by the Lady holder |
| **Other Players** | Players observing but not directly involved in investigation |

---

## 3. Scope

### 3.1 In Scope

- Lady of the Lake investigation after Quests 2, 3, and 4
- Private alignment reveal to Lady holder
- Lady token transfer to investigated player
- Prevention of re-investigating same player
- UI for Lady holder to select target
- UI showing investigation result (private)
- Public notification that investigation occurred
- Tracking who has been investigated

### 3.2 Out of Scope

- Variant rules (e.g., Lady shows special role instead of alignment)
- Multiple Ladies in play
- Lady usage in games with fewer than 7 players
- Integration with other game variants
- Lying about investigation results (handled by social deduction)

---

## 4. Game Rules Reference

### 4.1 Lady of the Lake Mechanics

| Rule | Description |
|------|-------------|
| **Eligibility** | Only available in games with 7+ players |
| **Starting Position** | Assigned to one player at game start (already implemented) |
| **Usage Timing** | After Quest 2, 3, and 4 results are revealed |
| **Investigation** | Lady holder selects any player (except themselves and previously investigated) |
| **Information Revealed** | Target's alignment (Good or Evil) – NOT special role |
| **Token Transfer** | After investigation, Lady passes to the investigated player |
| **Investigation Limit** | Each player can only be investigated once per game |
| **Quest 5** | No Lady usage after Quest 5 (game ends) |

### 4.2 Game Flow with Lady

```
Quest 2 completes → Quest Result shown → Lady Phase → Quest 3 team building
Quest 3 completes → Quest Result shown → Lady Phase → Quest 4 team building
Quest 4 completes → Quest Result shown → Lady Phase → Quest 5 team building
Quest 5 completes → Game ends (no Lady phase)
```

### 4.3 What Information is Revealed

| Target Role | What Lady Sees |
|-------------|----------------|
| Merlin | "Good" |
| Percival | "Good" |
| Loyal Servant | "Good" |
| Assassin | "Evil" |
| Morgana | "Evil" |
| Mordred | "Evil" |
| Oberon | "Evil" |
| Minion | "Evil" |

**Note**: The Lady does NOT reveal special roles, only Good/Evil alignment.

---

## 5. User Stories

### US1: Lady Holder Investigates Player

**As a** Lady of the Lake holder  
**I want to** select a player to investigate after a quest  
**So that** I can learn their alignment and share (or withhold) that information

**Acceptance Criteria:**
- [ ] After Quest 2, 3, or 4 result is shown, Lady phase begins
- [ ] Lady holder sees a prompt to select a player to investigate
- [ ] Cannot select themselves
- [ ] Cannot select previously investigated players (grayed out)
- [ ] Selection is confirmed with a button click
- [ ] Investigation result is shown privately to Lady holder only

---

### US2: See Investigation Result

**As a** Lady of the Lake holder  
**I want to** see the alignment of the player I investigated  
**So that** I can use this information strategically

**Acceptance Criteria:**
- [ ] Result shows "Good" or "Evil" (not special role)
- [ ] Result is displayed in a clear, dramatic UI
- [ ] Only the Lady holder sees the actual result
- [ ] Result remains visible until Lady holder clicks "Continue"
- [ ] No auto-dismiss timeout (Lady holder controls pace)

---

### US3: Receive Lady of the Lake Token

**As a** player who was investigated  
**I want to** receive the Lady of the Lake token  
**So that** I can investigate another player in a future round

**Acceptance Criteria:**
- [ ] After investigation, Lady token transfers to investigated player
- [ ] New Lady holder is indicated in the UI
- [ ] Previous Lady holder no longer has investigation ability
- [ ] All players can see who now holds the Lady

---

### US4: Other Players See Investigation Occurred

**As a** player not involved in the investigation  
**I want to** know that an investigation happened  
**So that** I can factor this into my deduction

**Acceptance Criteria:**
- [ ] All players see "X is using Lady of the Lake..."
- [ ] All players see "X investigated Y"
- [ ] All players see "Y now holds the Lady of the Lake"
- [ ] The actual alignment result is NOT shown to other players

---

### US5: Skip Lady Phase (Game Without Lady)

**As a** player in a game without Lady of the Lake  
**I want** the game to skip the Lady phase  
**So that** gameplay flows normally

**Acceptance Criteria:**
- [ ] Games without Lady enabled skip directly to next team building
- [ ] No Lady UI is shown
- [ ] Quest result flows directly to next phase

---

### US6: View Investigation History

**As a** player  
**I want to** see who has been investigated  
**So that** I know who cannot be investigated again

**Acceptance Criteria:**
- [ ] UI shows list of investigated players
- [ ] Investigated players are marked in the player selection UI
- [ ] Investigation history persists throughout the game

---

### US7: Lady Holder Indicator

**As a** player  
**I want to** see who currently holds the Lady of the Lake  
**So that** I know who will investigate next

**Acceptance Criteria:**
- [ ] Current Lady holder has a visible indicator (icon/badge)
- [ ] Lady holder is shown in the game status area
- [ ] Indicator moves when Lady token transfers

---

## 6. State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
    ┌──────────────────────────────┐                         │
    │      quest_result            │                         │
    │  (Quest 2, 3, or 4)          │                         │
    └──────────────┬───────────────┘                         │
                   │                                         │
         Lady enabled?                                       │
          /        \                                         │
        Yes         No                                       │
         │           │                                       │
         ▼           │                                       │
    ┌────────────┐   │                                       │
    │lady_of_lake│   │                                       │
    │  (new)     │   │                                       │
    └─────┬──────┘   │                                       │
          │          │                                       │
    Investigation    │                                       │
    submitted        │                                       │
          │          │                                       │
          ▼          ▼                                       │
    ┌──────────────────────────────┐                         │
    │       team_building          │─────────────────────────┘
    │    (next quest)              │
    └──────────────────────────────┘
```

---

## 7. Edge Cases

| Edge Case | Expected Behavior |
|-----------|-------------------|
| All eligible players investigated | Lady phase is skipped (no valid targets) |
| Lady holder disconnects during Lady phase | Wait for reconnection or timeout (future: auto-skip) |
| Game ends before Lady can be used | Lady phase doesn't occur |
| Quest 5 completes | No Lady phase (game ends or goes to Assassin phase) |
| Only 1 uninvestigated player remains | Show selection UI; Lady holder must confirm (no auto-select) |
| Lady holder is the only uninvestigated player | Lady holder cannot investigate themselves, phase skipped |

---

## 8. Functional Requirements

### FR1: Game Phase Management
- System shall add `lady_of_lake` phase after quest_result for Quests 2, 3, 4
- System shall skip Lady phase for Quest 1 and Quest 5
- System shall skip Lady phase if Lady is not enabled for the game
- System shall skip Lady phase if no valid investigation targets exist

### FR2: Investigation Mechanics
- System shall allow Lady holder to select one uninvestigated player
- System shall prevent selection of self or previously investigated players
- System shall reveal only "Good" or "Evil" to Lady holder
- System shall record investigation in game history

### FR3: Token Transfer
- System shall transfer Lady token to investigated player after investigation
- System shall update UI to reflect new Lady holder
- System shall persist Lady holder state in database

### FR4: Data Persistence
- System shall track all investigated players
- System shall track current Lady holder
- System shall log investigation events for game history

---

## 9. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Investigation submission latency | < 500ms |
| UI update after investigation | < 1 second for all players |
| Investigation result display | Minimum 5 seconds |
| State consistency | All players see same Lady holder |

---

## 10. Data Model Updates

### 10.1 New Game Phase

Add to `game_phase` enum:
```
'lady_of_lake' -- After quest_result, before team_building
```

### 10.2 New Tables/Columns

**Option A: Extend `games` table**
```sql
investigated_player_ids UUID[] DEFAULT '{}'  -- Players who have been investigated
```

**Option B: New `lady_investigations` table**
```sql
CREATE TABLE lady_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  quest_number INT NOT NULL,
  investigator_id UUID NOT NULL REFERENCES players(id),
  target_id UUID NOT NULL REFERENCES players(id),
  result TEXT NOT NULL, -- 'good' or 'evil'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.3 Existing Columns (from Phase 2)

Already available in `rooms` table:
- `lady_of_lake_enabled BOOLEAN`
- `lady_of_lake_holder_id UUID`

---

## 11. API Contracts

### POST /api/games/[gameId]/lady-investigate

Submit Lady of the Lake investigation.

**Request:**
```json
{
  "target_player_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "result": "good" | "evil",
  "new_holder_id": "uuid",
  "new_holder_nickname": "string"
}
```

**Errors:**
- 400: Not in Lady phase
- 400: Invalid target (self, already investigated)
- 403: Not the Lady holder

---

### GET /api/games/[gameId] (Updated)

Add to response:
```json
{
  "lady_of_lake": {
    "enabled": true,
    "current_holder_id": "uuid",
    "current_holder_nickname": "string",
    "investigated_player_ids": ["uuid", ...],
    "is_holder": true,  // for current player
    "can_investigate": true  // in lady_of_lake phase
  }
}
```

---

## 12. UI Components

### 12.1 LadyOfLakePhase

Main component for Lady investigation phase.

**For Lady Holder:**
- Header: "Use the Lady of the Lake"
- Player grid with selectable targets
- Investigated players shown as disabled
- Confirm button

**For Other Players:**
- Waiting message: "[Name] is using the Lady of the Lake..."
- Animation showing Lady token

### 12.2 InvestigationResult

Shows result to Lady holder only.

- Dramatic reveal animation
- Large "GOOD" or "EVIL" text with appropriate color
- Target player's name
- "Lady passes to [Name]" message
- Continue button

### 12.3 LadyIndicator

Small badge/icon shown on player who holds Lady.

- Crown/lake icon
- Shown in PlayerSeats component
- Tooltip: "Holds the Lady of the Lake"

### 12.4 InvestigatedBadge

Small indicator on investigated players.

- Eye/checkmark icon
- Prevents re-selection
- Tooltip: "Already investigated"

---

## 13. Resolved Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Auto-skip with single target? | **No** - Show UI, require confirmation | Consistent UX |
| Timeout handling? | **No timeout** - Wait indefinitely | Avoid punishing slow decisions |
| Result display duration? | **Wait for Continue click** | Let Lady holder process info |
| Public announcement detail? | **Show who investigated whom** | Adds strategic information |

**Note**: Disconnection handling deferred to future reconnection improvements.

---

## 14. Acceptance Checklist

- [ ] Lady phase triggers after Quest 2, 3, 4 (only if enabled)
- [ ] Lady holder can select and investigate a player
- [ ] Investigation result shown privately
- [ ] Lady token transfers correctly
- [ ] All players see who was investigated (not result)
- [ ] Previously investigated players cannot be selected
- [ ] Lady holder indicator visible to all
- [ ] Game history logs investigations
- [ ] Skip Lady phase if no valid targets
- [ ] Works correctly in 7-10 player games

---

## Appendix A: Related Specifications

- [001-avalon-mvp-lobby](../001-avalon-mvp-lobby/spec.md) - Base room/player system
- [002-special-roles](../002-special-roles/spec.md) - Lady assignment at game start
- [003-avalon-quest-system](../003-avalon-quest-system/spec.md) - Quest flow integration

