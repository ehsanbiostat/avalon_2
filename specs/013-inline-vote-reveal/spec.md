# Feature Specification: Inline Vote Results Display

**Feature Branch**: `013-inline-vote-reveal`
**Created**: 2025-12-23
**Status**: Research Phase
**Input**: User description: "Change voting result UI from popup panel to inline indicators on player avatars"

---

## Problem Statement

Currently, voting results are shown in a modal/overlay popup that lists all players and their votes. The user wants to display vote results directly on the player avatars in the circular seating arrangement, making the reveal more integrated with the game board.

### Current Implementation

```
┌─────────────────────────────────────┐
│      VOTE RESULT POPUP              │
│  ┌─────────────────────────────┐    │
│  │ ✅ Team Approved!           │    │
│  │ 4 approved • 2 rejected     │    │
│  │                             │    │
│  │ Approved:        Rejected:  │    │
│  │ • Alice          • Eve      │    │
│  │ • Bob            • Frank    │    │
│  │ • Carol                     │    │
│  │ • David                     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Desired Outcome

Vote results shown directly on player avatars in the game circle, without a blocking popup.

---

## UI Design Research

### Option A: Colored Border Flash

**Concept**: Flash the avatar border with approve/reject color for a few seconds.

```
         👑
    ┌─────────┐          ┌─────────┐
    │         │          ▓▓▓▓▓▓▓▓▓▓▓  ← Red border flash
    │    A    │          ▓    B    ▓
    │         │          ▓▓▓▓▓▓▓▓▓▓▓
    └─────────┘          └─────────┘
    ↑ Green border         Rejected
      Approved
```

**Pros:**
- Minimal UI change
- Uses existing border system
- Very fast to render
- Clear approve (green) / reject (red) signal

**Cons:**
- Temporary - disappears after animation
- May conflict with current border colors (amber for "You")
- Colorblind users may struggle (both colors look similar)

---

### Option B: Emoji Badge Reveal

**Concept**: Show 👍 or 👎 badge on avatar after reveal.

```
         👑
    ┌─────────┐ 👍      ┌─────────┐ 👎
    │         │         │         │
    │    A    │         │    B    │
    │         │         │         │
    └─────────┘         └─────────┘
      Approved           Rejected
```

**Pros:**
- Universal understanding (thumbs up/down)
- Highly visible
- Colorblind-friendly
- Can persist for the duration of reveal

**Cons:**
- May overlap with existing badges (Lady, Vote checkmark)
- Need to find a free position (top-left?)

---

### Option C: Avatar Glow Effect

**Concept**: Apply a colored glow/shadow around the avatar.

```
    ░░░░░░░░░░░           ▓▓▓▓▓▓▓▓▓▓▓
    ░ ┌─────┐ ░           ▓ ┌─────┐ ▓
    ░ │  A  │ ░           ▓ │  B  │ ▓
    ░ └─────┘ ░           ▓ └─────┘ ▓
    ░░░░░░░░░░░           ▓▓▓▓▓▓▓▓▓▓▓
    ↑ Green glow          ↑ Red glow
```

**Pros:**
- Visually striking
- Doesn't interfere with badges
- Smooth CSS animation possible
- Can pulse for emphasis

**Cons:**
- May be distracting
- Needs careful styling to look good
- Performance consideration (box-shadow animations)

---

### Option D: Fill Color Overlay

**Concept**: Temporarily change avatar fill to semi-transparent green/red.

```
    ┌─────────┐           ┌─────────┐
    │░░░░░░░░░│           │▓▓▓▓▓▓▓▓▓│
    │░░░ A ░░░│           │▓▓▓ B ▓▓▓│
    │░░░░░░░░░│           │▓▓▓▓▓▓▓▓▓│
    └─────────┘           └─────────┘
    ↑ Green tint          ↑ Red tint
```

**Pros:**
- Very clear visual
- Fills the entire avatar space
- Simple CSS overlay

**Cons:**
- Conflicts with team selection colors (blue/green already used)
- May confuse "approved" green with "on team" green

---

### Option E: Icon Inside Avatar (Recommended)

**Concept**: Show large ✓ or ✗ icon over the avatar initial during reveal.

```
    ┌─────────┐           ┌─────────┐
    │         │           │         │
    │    ✓    │           │    ✗    │
    │         │           │         │
    └─────────┘           └─────────┘
    ↑ Green ✓             ↑ Red ✗
    (replaces initial)
```

**Pros:**
- Maximum visibility
- Clear approve/reject meaning
- No overlap issues
- Simple to implement

**Cons:**
- Hides player initial temporarily
- Needs animation to transition smoothly

---

### Option F: Split Reveal (Staggered Animation)

**Concept**: Reveal votes one by one with animation, not all at once.

```
Step 1:  [A: ✓] [B: ?] [C: ?] [D: ?] [E: ?] [F: ?]
Step 2:  [A: ✓] [B: ✗] [C: ?] [D: ?] [E: ?] [F: ?]
Step 3:  [A: ✓] [B: ✗] [C: ✓] [D: ?] [E: ?] [F: ?]
...
```

**Pros:**
- Builds suspense
- Easier to track who voted what
- Engaging animation

**Cons:**
- Takes longer to complete reveal
- More complex implementation
- May feel slow for repeated use

---

### Option G: Hybrid - Badge + Border

**Concept**: Combine border color flash with a small badge.

```
    ░░░░░░░░░░░░░
    ░ ┌─────────┐ ░  ← Green border pulse
    ░ │         │ ░
  ✓ ░ │    A    │ ░  ← Green ✓ badge (top-left)
    ░ │         │ ░
    ░ └─────────┘ ░
    ░░░░░░░░░░░░░
```

**Pros:**
- Double reinforcement (color + icon)
- Badge persists after animation fades
- Clear for colorblind users

**Cons:**
- May be visually busy
- More elements to manage

---

## Comparison Matrix

| Option | Visibility | Colorblind-Safe | Performance | Simplicity | Conflict Risk |
|--------|------------|-----------------|-------------|------------|---------------|
| A: Border Flash | Medium | ❌ Low | ✅ Fast | ✅ Simple | ⚠️ Medium |
| B: Emoji Badge | ✅ High | ✅ High | ✅ Fast | ✅ Simple | ⚠️ Medium |
| C: Glow Effect | ✅ High | ❌ Low | ⚠️ Medium | Medium | ✅ Low |
| D: Fill Overlay | ✅ High | ❌ Low | ✅ Fast | ✅ Simple | ❌ High |
| E: Icon Inside | ✅ High | ✅ High | ✅ Fast | ✅ Simple | ✅ Low |
| F: Staggered | ✅ High | ✅ High | ✅ Fast | ❌ Complex | ✅ Low |
| G: Hybrid | ✅ High | ✅ High | ⚠️ Medium | Medium | ⚠️ Medium |

---

## Recommendation

**Option E (Icon Inside Avatar)** or **Option B (Emoji Badge)** are recommended for:
- Highest clarity
- Colorblind accessibility
- Minimal performance impact
- No conflict with existing UI elements

---

## Questions for User

### Q1: Preferred Visual Style

Which approach do you prefer?

| Option | Style | Description |
|--------|-------|-------------|
| A | Border Flash | Quick green/red border animation |
| B | Emoji Badge 👍👎 | Thumbs up/down badge on avatar |
| C | Glow Effect | Colored glow around avatar |
| D | Fill Overlay | Semi-transparent color overlay |
| E | Icon Inside ✓✗ | Large checkmark/X replaces initial |
| F | Staggered Reveal | One-by-one animated reveal |
| G | Hybrid | Border + badge combination |

**Your choice**: _[Wait for response]_

---

### Q2: Animation Duration

How long should the vote reveal be visible?

| Option | Duration | Description |
|--------|----------|-------------|
| A | 3 seconds | Quick glance |
| B | 5 seconds | Standard (current popup duration) |
| C | 10 seconds | Extended view |
| D | Until dismissed | Player clicks to continue |

**Your choice**: _[Wait for response]_

---

### Q3: Keep Summary Text?

Should there be a brief summary in the center of the circle?

| Option | Style | Description |
|--------|-------|-------------|
| A | Yes - minimal | "✅ Approved (4-2)" in center |
| B | Yes - detailed | "Team Approved! 4 approve, 2 reject" |
| C | No | Only show on avatars, no center text |

**Your choice**: _[Wait for response]_

---

## Notes

- This is a **research phase** specification
- No implementation until user selects preferred options
- Once options are selected, full functional requirements will be defined
