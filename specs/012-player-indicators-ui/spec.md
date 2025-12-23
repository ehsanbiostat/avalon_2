# Feature Specification: Player Indicators UI Improvement

**Feature Branch**: `012-player-indicators-ui`
**Created**: 2025-12-23
**Status**: Ready for Planning
**Input**: User description: "Improve player indicators UI to prevent overlap and reduce visual clutter"

---

## Problem Statement

The current game room UI displays multiple status indicators around player avatars arranged in a circle. With up to 10 players and multiple indicators per player, the interface becomes visually cluttered and indicators from adjacent players can overlap.

### Current Implementation Issues

**File**: `src/components/game/PlayerSeats.tsx`

| Indicator | Current Position | Problem |
|-----------|------------------|---------|
| Crown 👑 | Top center | OK |
| Disconnect ❌ | Top left | Overlaps with neighbor |
| Checkmark ✓ | Top right | Overlaps with neighbor |
| Shield 🛡️ | Top right | Same position as checkmark |
| Lady 🌊 | Bottom left | **Main overlap culprit** |
| Vote ✓ | Bottom right | Can overlap |

**Root Cause**: With 10 players at 210px radius, adjacent players are ~73px apart at the edge, and badges extending 8-16px beyond 80px avatars create overlap.

---

## Chosen Solution: Fill Color + Border + Strategic Badges

After analysis, the following approach was selected:

### Design Principles

1. **Inner Fill Color** → Shows team selection state (no badge needed)
2. **Border Color** → Shows identity states (You, Disconnected)
3. **Strategic Badge Positions** → Only 3 positions used, no overlap possible

### Badge Positions (3 Total)

```
              👑
         (top center)
              ↓
    ┌─────────────────┐
    │                 │
    │     AVATAR      │  ← Fill color = team state
    │                 │  ← Border color = identity
    │                 │
  ✓ └─────────────────┘ 🌊
  ↑                     ↑
 Voted               Lady
(bottom-left)    (bottom-right)
```

### Color System

**Inner Fill Colors (Team States):**

| State | Fill Color | CSS Class |
|-------|------------|-----------|
| Default | Dark slate gray | `bg-slate-700` |
| Selected by leader | Sky blue | `bg-sky-700` |
| On proposed team | Emerald green | `bg-emerald-700` |

**Border Colors (Identity States):**

| State | Border Color | CSS Class |
|-------|--------------|-----------|
| Default | Slate gray | `border-slate-400` |
| You (current player) | Amber gold (thick) | `border-amber-400 border-4` |
| Disconnected | Red + grayscale | `border-red-500` + grayscale filter |

**Badges (Only When Needed):**

| Badge | Position | When Shown |
|-------|----------|------------|
| 👑 Crown | Top center | Player is leader |
| 🌊 Lady | Bottom right | Player holds Lady of Lake |
| ✓ Voted | Bottom left | Player has voted (voting phase only) |

### State Priority

When multiple states apply, this priority determines appearance:

| Priority | State | What Shows |
|----------|-------|------------|
| 1 | Disconnected | Red border + grayscale (overrides all) |
| 2 | You (current player) | Amber border (overrides default border) |
| 3 | Selected for team | Sky blue fill |
| 4 | On proposed team | Emerald fill |
| 5 | Leader | Amber ring + Crown badge |
| 6 | Lady holder | Lady badge (bottom-right) |
| 7 | Has voted | Vote badge (bottom-left) |

### Visual Examples

**Default Player:**
```
    ┌───────────┐
    │  ░░░░░░░  │     Fill: slate-700
    │  ░  A  ░  │     Border: slate-400
    └───────────┘     Badges: none
       Alice
```

**You (Current Player):**
```
    ╔═══════════╗
    ║  ░░░░░░░  ║     Fill: slate-700
    ║  ░  B  ░  ║     Border: amber-400 (thick)
    ╚═══════════╝     Badges: none
        You
```

**Leader:**
```
         👑
    ┌───────────┐
    │  ░░░░░░░  │     Fill: slate-700
    │  ░  C  ░  │     Border: slate-400 + amber ring
    └───────────┘     Badges: 👑
       Chris
```

**Selected for Team:**
```
    ┌───────────┐
    │  ▒▒▒▒▒▒▒  │     Fill: sky-700 (BLUE)
    │  ▒  D  ▒  │     Border: sky-400
    └───────────┘     Badges: none
       Diana
```

**On Proposed Team:**
```
    ┌───────────┐
    │  ███████  │     Fill: emerald-700 (GREEN)
    │  █  E  █  │     Border: emerald-400
    └───────────┘     Badges: none
       Elena
```

**Lady of Lake Holder:**
```
    ┌───────────┐
    │  ░░░░░░░  │     Fill: slate-700
    │  ░  F  ░  │     Border: slate-400
    └───────────┘ 🌊  Badges: 🌊 (bottom-right)
       Frank
```

**Has Voted:**
```
    ┌───────────┐
    │  ░░░░░░░  │     Fill: slate-700
    │  ░  G  ░  │     Border: slate-400
  ✓ └───────────┘     Badges: ✓ (bottom-left)
       Grace
```

**Disconnected:**
```
    ┌▓▓▓▓▓▓▓▓▓▓▓┐
    ▓  ▒▒▒▒▒▒▒  ▓     Fill: slate-800 + grayscale
    ▓  ▒  H  ▒  ▓     Border: red-500
    └▓▓▓▓▓▓▓▓▓▓▓┘     Badges: none
       Henry
```

**Complex: You + Leader + On Team + Lady + Voted:**
```
         👑
    ╔═══════════╗
    ║  ███████  ║     Fill: emerald-700 (on team)
    ║  █  I  █  ║     Border: amber-400 (You)
  ✓ ╚═══════════╝ 🌊  Ring: amber (leader)
        You           Badges: 👑 + 🌊 + ✓
```

---

## User Scenarios & Testing

### User Story 1 - Clear Team Selection Visibility (Priority: P1)

During team building, players need to instantly see who is being selected for the quest.

**Why this priority**: Core gameplay mechanic - leader selects team, all players must see selections clearly.

**Independent Test**: Load a game in team_building phase, have leader select players, verify blue fill is immediately visible.

**Acceptance Scenarios:**

1. **Given** team_building phase, **When** leader selects a player, **Then** selected player's avatar fills with sky blue color.

2. **Given** voting phase with proposed team, **When** viewing player circle, **Then** team members have emerald green fill, distinguishable from non-team members.

3. **Given** 10-player game, **When** multiple adjacent players are on team, **Then** no visual overlap occurs between their indicators.

---

### User Story 2 - Identity Recognition (Priority: P1)

Players must quickly identify themselves and see which players are disconnected.

**Why this priority**: Self-identification prevents mistakes; disconnect visibility is critical for game flow.

**Independent Test**: Join a game and verify amber border clearly marks "You" among all players.

**Acceptance Scenarios:**

1. **Given** any game phase, **When** viewing player circle, **Then** current player's avatar has distinct amber border.

2. **Given** a player disconnects, **When** viewing player circle, **Then** disconnected player shows red border + grayscale effect.

---

### User Story 3 - Special Role Indicators (Priority: P1)

Leader crown and Lady of Lake token must remain visible without causing overlap.

**Why this priority**: These are game-critical roles that affect gameplay decisions.

**Independent Test**: Create game with Lady of Lake enabled, verify token visibility throughout game.

**Acceptance Scenarios:**

1. **Given** a player is leader, **When** viewing player circle, **Then** crown appears at top center of their avatar.

2. **Given** a player holds Lady of Lake, **When** viewing player circle, **Then** 🌊 token appears at bottom-right of their avatar.

3. **Given** adjacent players where one has Lady and one has Vote badge, **When** viewing player circle, **Then** badges do not overlap (Lady=bottom-right, Vote=bottom-left).

---

### User Story 4 - Vote Status During Voting Phase (Priority: P2)

During voting, players should see who has already voted.

**Why this priority**: Helps track voting progress, but less critical than team selection.

**Independent Test**: Enter voting phase, submit vote, verify checkmark appears at bottom-left.

**Acceptance Scenarios:**

1. **Given** voting phase, **When** a player submits vote, **Then** ✓ badge appears at bottom-left of their avatar.

2. **Given** voting phase ends, **When** viewing results, **Then** vote badges are cleared.

---

### Edge Cases

- **All states active**: Player is Leader + Lady holder + On team + Voted + is current player → All indicators visible without overlap
- **10-player game**: Maximum crowding scenario → Badge positions tested for no overlap
- **Mobile viewport**: Smaller screens → Indicators remain visible and distinguishable
- **Rapid state changes**: Player selected/deselected quickly → Fill color transitions smoothly

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST use avatar inner fill color to indicate team selection states (selected=blue, proposed=green, default=gray)
- **FR-002**: System MUST use avatar border color to indicate identity states (You=amber, disconnected=red, default=gray)
- **FR-003**: System MUST display leader crown at top center of leader's avatar
- **FR-004**: System MUST display Lady of Lake token at bottom-right of holder's avatar
- **FR-005**: System MUST display vote checkmark at bottom-left of voter's avatar during voting phase
- **FR-006**: System MUST NOT have any indicator overlap between adjacent players in a 10-player game
- **FR-007**: System MUST apply grayscale filter to disconnected players in addition to red border
- **FR-008**: System MUST handle players with multiple simultaneous states using defined priority order
- **FR-009**: System MUST maintain amber ring effect for leader in addition to crown
- **FR-010**: Fill and border colors MUST transition smoothly when state changes

### Removed Indicators

The following current indicators will be **removed**:
- Shield 🛡️ badge (replaced by green fill color)
- Top-right checkmark (replaced by fill color)
- Top-left disconnect X badge (replaced by red border + grayscale)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero indicator overlap between adjacent players in a 10-player game
- **SC-002**: Players can identify team selection state within 1 second (color recognition)
- **SC-003**: Players can identify current player (self) within 1 second (amber border)
- **SC-004**: Players can identify disconnected players within 1 second (red border + grayscale)
- **SC-005**: Maximum 3 badge positions used per player (crown, Lady, voted)
- **SC-006**: UI remains usable on mobile devices (minimum 375px width)

---

## Technical Notes

### Files to Modify

- `src/components/game/PlayerSeats.tsx` - Main component with indicator logic

### Current Code Reference

```tsx
// Lines 230-294 in PlayerSeats.tsx - to be refactored
// Current approach uses many absolute positioned badges
// New approach uses className conditions for fill/border colors
```

### Color Classes to Use

```tsx
// Fill colors (team states)
'bg-slate-700'    // default
'bg-sky-700'      // selected
'bg-emerald-700'  // proposed

// Border colors (identity states)
'border-slate-400'  // default
'border-amber-400'  // current player (You)
'border-red-500'    // disconnected

// Effects
'grayscale opacity-60'  // disconnected
'ring-4 ring-amber-400' // leader ring
```
