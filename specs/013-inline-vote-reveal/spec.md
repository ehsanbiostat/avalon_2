# Feature Specification: Inline Vote Results Display

**Feature Branch**: `013-inline-vote-reveal`
**Created**: 2025-12-23
**Status**: Ready for Planning
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

### Chosen Solution

**Option E: Icon Inside Avatar** with minimal center summary.

```
                    👑
               ┌─────────┐
               │    ✓    │  ← Green ✓ (approved)
               └─────────┘
                  Alice

    ┌─────────┐           ┌─────────┐
    │    ✗    │           │    ✓    │
    └─────────┘           └─────────┘
       Bob      ┌───────┐    Carol
                │ ✅4-2 │  ← Center summary
    ┌─────────┐ └───────┘ ┌─────────┐
    │    ✓    │           │    ✗    │
    └─────────┘           └─────────┘
      David                  Eve
```

**Design Decisions:**
- **Visual Style**: Large ✓ (green) or ✗ (red) icon replaces avatar initial
- **Duration**: 10 seconds visible
- **Center Summary**: Minimal format "✅ 4-2" or "❌ 2-4"

---

## User Scenarios & Testing

### User Story 1 - View Vote Results on Avatars (Priority: P1)

After all players submit their votes, players see each person's vote directly on their avatar in the game circle, with a clear ✓ or ✗ icon.

**Why this priority**: Core feature - replaces the current popup with inline display.

**Independent Test**: Complete a voting round, verify all avatars show ✓/✗ icons with correct colors.

**Acceptance Scenarios:**

1. **Given** all players have voted, **When** votes are revealed, **Then** each avatar displays a large ✓ (green) for approve or ✗ (red) for reject.

2. **Given** vote reveal is active, **When** 10 seconds pass, **Then** avatars return to showing player initials.

3. **Given** a 10-player game, **When** votes are revealed, **Then** all 10 avatars simultaneously show their vote icons.

---

### User Story 2 - View Vote Summary in Center (Priority: P1)

Players see a minimal summary in the center circle showing the overall result and vote count.

**Why this priority**: Provides quick at-a-glance result without reading each avatar.

**Independent Test**: Complete a voting round, verify center shows "✅ 4-2" or "❌ 2-4" format.

**Acceptance Scenarios:**

1. **Given** votes are revealed, **When** team is approved, **Then** center displays "✅ [approve]-[reject]" (e.g., "✅ 4-2").

2. **Given** votes are revealed, **When** team is rejected, **Then** center displays "❌ [approve]-[reject]" (e.g., "❌ 2-4").

3. **Given** vote reveal ends, **When** 10 seconds pass, **Then** center returns to normal game phase message.

---

### User Story 3 - Smooth Animation Transition (Priority: P2)

The transition from player initial to vote icon and back should be smooth and not jarring.

**Why this priority**: Polish - improves user experience but core functionality works without it.

**Independent Test**: Observe vote reveal animation, verify smooth fade/scale transition.

**Acceptance Scenarios:**

1. **Given** votes are being revealed, **When** transition starts, **Then** initial fades out and icon fades in (not instant swap).

2. **Given** 10 seconds have passed, **When** reveal ends, **Then** icon fades out and initial fades back in.

---

### Edge Cases

- **Disconnected player**: If a player disconnects before voting, show a "?" or skip indicator
- **Tie votes**: Center summary shows "❌ 3-3" (ties reject)
- **Single reject in 10-player game**: All votes visible, even with asymmetric results
- **Quick succession**: If new vote happens before reveal ends, cancel current reveal

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST display vote result icons (✓/✗) inside player avatars during reveal phase
- **FR-002**: System MUST use green color for approve (✓) and red color for reject (✗)
- **FR-003**: System MUST show vote reveal for exactly 10 seconds
- **FR-004**: System MUST display minimal summary in center circle during reveal ("✅ X-Y" format)
- **FR-005**: System MUST animate transition between player initial and vote icon
- **FR-006**: System MUST return to normal avatar display after reveal ends
- **FR-007**: System MUST remove the current popup modal for vote results
- **FR-008**: System MUST preserve existing avatar features during reveal (crown, Lady badge, border colors)
- **FR-009**: System MUST work on mobile viewport (375px+)
- **FR-010**: System MUST not cause layout shift during reveal

### Key Entities

- **VoteRevealState**: Tracks whether reveal is active, votes data, remaining time
- **PlayerVote**: Player ID + vote value (approve/reject)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Vote reveal is visible for 10 seconds (±0.5s tolerance)
- **SC-002**: All player votes are displayed simultaneously on reveal
- **SC-003**: Center summary shows correct approve/reject counts
- **SC-004**: Transition animation completes in under 300ms
- **SC-005**: No popup/modal appears during vote reveal
- **SC-006**: Works correctly on 5-10 player games
- **SC-007**: UI remains responsive during reveal (no frame drops)
