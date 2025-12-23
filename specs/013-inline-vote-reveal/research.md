# Research: Inline Vote Results Display

**Feature**: 013-inline-vote-reveal
**Date**: 2025-12-23

## Technical Decisions

### Decision 1: Animation Approach

**Decision**: Use CSS-only transitions with Tailwind classes

**Rationale**:
- No JavaScript animation libraries needed (Motion, Framer, etc.)
- Better performance - GPU accelerated
- Simpler implementation - just toggle classes
- Consistent with existing codebase (uses Tailwind transitions)

**Alternatives Considered**:
- React Motion/Framer: Overkill for simple fade transition
- JavaScript requestAnimationFrame: More complex, unnecessary
- No animation: User requested smooth transitions

### Decision 2: Vote Icon Placement

**Decision**: Replace avatar initial with ✓/✗ icon (same position, same size container)

**Rationale**:
- No layout shift - avatar size stays constant (w-20 h-20)
- Maximum visibility - icon fills same space as initial
- Simple swap - just conditional rendering
- User explicitly chose "Icon Inside Avatar" option

**Alternatives Considered**:
- Overlay badge: Could overlap with existing badges (Lady, Vote)
- Border/glow: Less visible, colorblind issues
- Fill color: Conflicts with team selection colors

### Decision 3: State Management

**Decision**: Reuse existing `showVoteReveal` state in GameBoard, pass as props to PlayerSeats

**Rationale**:
- No new state management needed
- Existing timer logic (10 seconds) already works
- Clean prop drilling - just add 2 props
- Follows existing patterns in codebase

**Alternatives Considered**:
- New context: Overkill for single component communication
- Custom hook: Unnecessary abstraction
- Local state in PlayerSeats: Would duplicate timer logic

### Decision 4: Center Message Handling

**Decision**: Override center message during vote reveal with summary

**Rationale**:
- Center area already has fixed dimensions
- Summary is temporary (10 seconds)
- Clear visual hierarchy - big emoji, vote counts below
- Matches existing getCenterMessage() pattern

**Alternatives Considered**:
- Separate overlay: Extra DOM element, z-index complexity
- Toast notification: Not integrated with player circle
- Text below circle: Breaks circular design

### Decision 5: Color Scheme

**Decision**: Use emerald-400 for approve (✓) and red-400 for reject (✗)

**Rationale**:
- Distinct from team selection colors (sky-700, emerald-700 for fills)
- Lighter shade (400 vs 700) ensures visibility on dark backgrounds
- Universal green=approve, red=reject semantics
- Matches existing VoteResultReveal popup colors

**Alternatives Considered**:
- Same emerald-700 as team: Could confuse "on team" with "approved"
- Blue/orange: Less intuitive than green/red

## Existing Code Analysis

### PlayerSeats.tsx Current Structure

```typescript
// Lines 17-25: getFillColor() - handles team selection colors
// Lines 32-42: getBorderColor() - handles identity colors
// Lines 47-57: getTextColor() - handles initial text color
// Lines 114-208: getCenterMessage() - dynamic center content
// Lines 278-293: Avatar rendering with conditional classes
// Lines 291-292: Displays player.nickname.charAt(0).toUpperCase()
```

**Integration Point**: Replace line 292 content with conditional vote icon when active.

### GameBoard.tsx Current Structure

```typescript
// Line 47: const [showVoteReveal, setShowVoteReveal] = useState(false);
// Lines 78-89: useEffect to trigger showVoteReveal on new proposal
// Line 91-93: handleVoteRevealComplete callback
// Lines 369-376: VoteResultReveal component rendering
```

**Integration Point**: Remove lines 369-376, pass showVoteReveal to PlayerSeats instead.

### VoteInfo Interface

```typescript
// src/types/game.ts lines 340-344
export interface VoteInfo {
  player_id: string;
  nickname: string;
  vote: VoteChoice; // 'approve' | 'reject'
}
```

**Ready to use**: No changes needed to existing types.

## Performance Considerations

1. **No re-renders beyond necessary**: Vote reveal state change triggers single re-render
2. **CSS transitions**: GPU-accelerated, no layout thrashing
3. **Fixed dimensions**: Avatar size doesn't change, prevents reflow
4. **Conditional rendering**: Only show vote icons during reveal phase

## Mobile Considerations

1. **Avatar size unchanged**: w-20 h-20 works on mobile
2. **Icon size**: text-3xl readable on small screens
3. **Center summary**: Existing responsive center circle handles this
4. **10-player layout**: Circle radius (210px) already tested on mobile
