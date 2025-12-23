# Feature Specification: Player Indicators UI Improvement

**Feature Branch**: `012-player-indicators-ui`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "This is about the UI part of the game room, right now there are multiple indicators around the avatar/circle of the players, including who is the leader, the lady of the lake token, if a player is disconnected or not, if a player already voted or not, all of these indicators makes the UI quite busy and sometimes the tokens overlap, for example in a game of 10 players, the lady of the lake token of neighboring player overlapped with the token of another player that has been chosen in the mission team. How can we change or improve this situation?"

---

## Problem Statement

The current game room UI displays multiple status indicators around player avatars arranged in a circle. With up to 10 players and multiple indicators per player, the interface becomes visually cluttered and indicators from adjacent players can overlap.

### Current Implementation Analysis

**File**: `src/components/game/PlayerSeats.tsx`

**Current Indicators and Positions:**
| Indicator | Position | Size | Purpose |
|-----------|----------|------|---------|
| Crown 👑 | Top center | 24px | Leader indicator |
| Disconnect ❌ | Top left | 24px | Player offline |
| Checkmark ✓ | Top right | 28px | Selected for team |
| Shield 🛡️ | Top right | 20px | On proposed team |
| Lady of Lake 🌊 | Bottom left | 24px | Holds Lady token |
| Vote ✓ | Bottom right | 24px | Has submitted vote |

**Layout Constraints:**
- Circle radius: 210px
- Avatar size: 80px × 80px (w-20 h-20)
- Container: 520px × 520px
- With 10 players, angle between players: 36°
- Adjacent player distance at edge: ~73px

**Root Causes of Overlap:**
1. Indicators extend 8-16px beyond avatar bounds
2. Adjacent players are ~73px apart at 10 players
3. Lady of Lake (bottom-left) can overlap with neighbor's Checkmark (top-right)
4. No dynamic adjustment based on player count

---

## Proposed Solutions

This specification presents **6 solution options** for the user to evaluate and choose from.

### Solution A: Consolidated Status Strip

**Concept**: Replace scattered badge positions with a single horizontal strip below the player name containing all status icons in a compact row.

**Visual Mockup:**
```
       👑 (leader crown, if applicable)
     ┌─────────┐
     │    A    │  ← Avatar
     └─────────┘
       PlayerA
    [👤 🌊 ✓ ✓]  ← Status strip (icons in row)
```

**Advantages:**
- All indicators in one predictable location
- Reduces visual footprint
- Modern, clean appearance (similar to Slack/Discord)
- No overlap between adjacent players

**Disadvantages:**
- May be less visible during quick glances
- Requires horizontal space below name
- Multiple icons in strip may still be busy

---

### Solution B: Priority-Based Single Badge

**Concept**: Show only the most important indicator as a badge. Use avatar styling (borders, rings, opacity) for other states.

**Priority Order:**
1. Disconnected (critical - red X badge)
2. Leader (shown via ring, not separate badge)
3. Lady of Lake (important - shown as badge if not disconnected)
4. On Team (shown via border color)
5. Voted (shown via subtle glow or mini indicator)

**Visual Mockup:**
```
     ┌─────────┐
     │    A    │  ← Green border = on team
     └─────────┘  ← Amber ring = leader
       PlayerA
         🌊     ← Single badge (highest priority)
```

**Advantages:**
- Cleanest visual appearance
- No overlap possible
- Focus on most important state

**Disadvantages:**
- Some information hidden/less visible
- Players need to learn border color meanings
- May reduce information density too much

---

### Solution C: Orbital/Clock Position System

**Concept**: Position indicators at fixed "clock face" positions around the avatar, evenly spaced and sized consistently smaller.

**Clock Positions:**
- 12 o'clock: Leader crown
- 2 o'clock: Team selection
- 4 o'clock: Vote status
- 8 o'clock: Lady of Lake
- 10 o'clock: Disconnect status

**Visual Mockup:**
```
         👑 (12)
      ❌    ✓
    (10)  (2)
     ┌─────────┐
     │    A    │
     └─────────┘
    (8)    (4)
     🌊      ✓
       PlayerA
```

**Advantages:**
- Consistent, predictable positions
- Better spacing reduces overlap
- All information visible

**Disadvantages:**
- Still multiple indicators around avatar
- Requires careful sizing/positioning
- May still overlap with very close neighbors

---

### Solution D: Dynamic Spacing & Sizing

**Concept**: Adjust circle radius and indicator sizes based on player count to maintain minimum spacing.

**Scaling Rules:**
| Players | Circle Radius | Indicator Size | Avatar Size |
|---------|---------------|----------------|-------------|
| 5-6     | 180px         | 22px          | 80px        |
| 7-8     | 210px         | 18px          | 76px        |
| 9-10    | 250px         | 16px          | 72px        |

**Advantages:**
- Maintains existing indicator system
- Minimal code changes
- Adapts to player count

**Disadvantages:**
- Overall layout changes based on player count
- Smaller indicators harder to see on mobile
- May not fully solve overlap at 10 players

---

### Solution E: Hover/Tap Reveal

**Concept**: Show only the primary state visually; reveal additional indicators on hover (desktop) or tap (mobile).

**Default State**: Avatar + name + primary ring/border styling
**Hover State**: Tooltip or expanded view shows all status icons

**Visual Mockup:**
```
Default:              On Hover:
     ┌─────────┐      ┌─────────┐
     │    A    │  →   │    A    │ 👑 Leader
     └─────────┘      └─────────┘ 🌊 Lady
       PlayerA          PlayerA   ✓ Voted
```

**Advantages:**
- Cleanest default state
- All information accessible
- No overlap

**Disadvantages:**
- Information hidden by default
- Requires interaction to see states
- May slow down gameplay decisions
- Mobile tap conflicts with selection

---

### Solution F: Hybrid Approach (Recommended)

**Concept**: Combine the best aspects of multiple solutions:
1. **Border styling** for team selection states (no badge needed)
2. **Avatar ring** for leader (existing, works well)
3. **Single badge position** (bottom-right) for most important non-border state
4. **Badge priority**: Disconnect > Lady > Voted
5. **Smaller badge size** (20px) positioned slightly outward

**Visual Mockup:**
```
         👑           (crown stays - top center)
     ┌─────────┐
     │    A    │      ← Cyan border = selected
     └─────────┘      ← Amber ring = leader
       PlayerA
              🌊      ← Single badge (bottom-right, small)
```

**Border Color States:**
- Default: slate-400
- Selected/Draft: cyan-400
- Proposed Team: green-400
- Disconnected: red-400 + grayscale avatar

**Badge Priority (bottom-right only):**
1. Disconnect X (if disconnected - critical)
2. Lady 🌊 (if holder)
3. Voted ✓ (if has_voted)

**Advantages:**
- Minimal overlap risk (only 2 badge positions used)
- Important states clearly visible via borders
- Maintains familiar crown/ring system
- Badge position away from neighbors

**Disadvantages:**
- Requires learning border color meanings
- Some redundancy with grayscale for disconnect

---

## User Scenarios & Testing

### User Story 1 - Player Views Clear Status Indicators (Priority: P1)

During an active game, players need to quickly identify key information about other players: who is the leader, who is on the team, who holds Lady of Lake, and who has voted.

**Why this priority**: Core gameplay requires quick visual identification of player states. Overlap/clutter directly impacts game experience.

**Independent Test**: Can be tested by loading a 10-player game and verifying no indicators overlap between adjacent players.

**Acceptance Scenarios:**

1. **Given** a 10-player game in team_building phase, **When** viewing the player circle, **Then** no indicator from player A overlaps with indicators from adjacent players B or C.

2. **Given** a player with multiple states (leader + Lady holder + on team), **When** viewing that player's avatar, **Then** all relevant states are clearly distinguishable without visual clutter.

3. **Given** a player is disconnected, **When** viewing the player circle, **Then** the disconnected state is immediately obvious without needing to hover or interact.

---

### User Story 2 - Quick State Recognition (Priority: P1)

Players must instantly recognize important game states during time-sensitive phases (voting, quest execution).

**Why this priority**: Game flow requires rapid decisions; unclear UI slows gameplay.

**Independent Test**: Can be tested by having users identify states within 2 seconds of viewing.

**Acceptance Scenarios:**

1. **Given** voting phase, **When** a player has submitted their vote, **Then** the "voted" indicator is visible without overlapping other elements.

2. **Given** a proposed team, **When** viewing the player circle, **Then** team members are clearly distinguished from non-team members.

---

### User Story 3 - Responsive Display Across Player Counts (Priority: P2)

The indicator system should work equally well for 5-player and 10-player games.

**Why this priority**: Game supports 5-10 players; UI must scale appropriately.

**Independent Test**: Can be tested by comparing 5-player vs 10-player games for visual clarity.

**Acceptance Scenarios:**

1. **Given** a 5-player game, **When** viewing the player circle, **Then** indicators are appropriately sized and positioned (not too large/sparse).

2. **Given** a 10-player game, **When** viewing the player circle, **Then** indicators are appropriately sized and positioned (not overlapping/cramped).

---

### Edge Cases

- **All states active**: One player is leader + Lady holder + on team + voted + disconnected (rare but possible during reconnect scenarios)
- **Mobile viewport**: Smaller screens may require additional scaling
- **Very long nicknames**: Names truncated to prevent overlap with badges

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST display player status indicators without overlap between adjacent players in a 10-player game
- **FR-002**: System MUST clearly distinguish the current leader from other players
- **FR-003**: System MUST clearly show which players are selected for / proposed on a quest team
- **FR-004**: System MUST indicate the Lady of the Lake token holder
- **FR-005**: System MUST show disconnected players distinctly from connected players
- **FR-006**: System MUST show which players have submitted their vote during voting phase
- **FR-007**: Indicators MUST be visible and understandable on both desktop and mobile viewports
- **FR-008**: System MUST handle players with multiple simultaneous states (e.g., leader + Lady holder)

### Solution Selection Required

- **FR-009**: [NEEDS CLARIFICATION: Which solution approach (A through F) should be implemented?]

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Zero indicator overlap occurs between adjacent players in a 10-player game
- **SC-002**: Users can identify all player states within 3 seconds of viewing the game board
- **SC-003**: UI remains usable on mobile devices (minimum 375px width)
- **SC-004**: No increase in game decision time compared to current implementation
- **SC-005**: Players can distinguish 5+ simultaneous player states without confusion

---

## Appendix: Current Code Reference

**Key File**: `src/components/game/PlayerSeats.tsx`

```tsx
// Current indicator positioning (lines 247-294)
{/* Crown for leader */}
{player.is_leader && (
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</div>
)}

{/* Lady of the Lake token */}
{hasLady && (
  <div className="absolute -bottom-2 -left-3 text-2xl">🌊</div>
)}

{/* Disconnect indicator */}
{isDisconnected && (
  <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full">❌</div>
)}

{/* Selection checkmark */}
{(selected || inDraftSelection) && (
  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full">✓</div>
)}

{/* Vote indicator */}
{player.has_voted && (
  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full">✓</div>
)}
```
