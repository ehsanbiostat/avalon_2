# Implementation Plan: Inline Vote Results Display

**Branch**: `013-inline-vote-reveal` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-inline-vote-reveal/spec.md`

## Summary

Replace the modal popup vote result display (`VoteResultReveal.tsx`) with inline indicators on player avatars. When votes are revealed, each avatar shows a large ✓ (green) or ✗ (red) icon replacing the player initial for 10 seconds. A minimal summary ("✅ 4-2") appears in the center circle.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 15 (App Router)
**Primary Dependencies**: React, Tailwind CSS
**Storage**: N/A (uses existing gameState from useGameState hook)
**Testing**: Manual browser testing (no unit test framework currently)
**Target Platform**: Web (desktop + mobile 375px+)
**Project Type**: Web application
**Performance Goals**: Smooth 60fps animation, <300ms transition
**Constraints**: No layout shift, no frame drops, works with 5-10 players
**Scale/Scope**: Single component modification + new state management

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| IV. TypeScript Standards | ✅ PASS | All changes will use strict types |
| IV. Component Design | ✅ PASS | Extending existing PlayerSeats, ~150 lines added |
| IV. Separation of Concerns | ✅ PASS | UI only, no domain logic changes |
| V. Error Handling | ✅ PASS | Graceful fallback if vote data missing |
| VI. UX Principles | ✅ PASS | Clarity over flair, obvious primary action |
| VI. Real-Time Updates | ✅ PASS | Uses existing Supabase realtime |
| VI. Responsive Design | ✅ PASS | Must work on mobile 375px+ |

**No violations.** Proceeding to Phase 0.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CURRENT ARCHITECTURE                             │
│                                                                      │
│  GameBoard.tsx                                                       │
│    ├── useGameState() → gameState.last_vote_result                  │
│    ├── showVoteReveal state                                         │
│    ├── PlayerSeats (shows player circles)                           │
│    └── VoteResultReveal popup (REMOVED)  ←─── Delete this           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NEW ARCHITECTURE                                │
│                                                                      │
│  GameBoard.tsx                                                       │
│    ├── useGameState() → gameState.last_vote_result                  │
│    ├── voteRevealActive state (renamed)                             │
│    ├── voteRevealData: { votes, isApproved, counts }                │
│    └── PlayerSeats                                                   │
│          ├── NEW: voteRevealData prop                               │
│          ├── NEW: voteRevealActive prop                             │
│          ├── Avatar shows ✓/✗ icon when reveal active               │
│          └── Center shows summary "✅ 4-2" when reveal active       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

### Documentation (this feature)

```text
specs/013-inline-vote-reveal/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output (no data-model or contracts needed)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code Changes

```text
src/
├── components/
│   └── game/
│       ├── PlayerSeats.tsx      # MODIFY: Add vote reveal display
│       ├── VoteResultReveal.tsx # DELETE: No longer needed
│       └── GameBoard.tsx        # MODIFY: Remove popup, pass data to PlayerSeats
└── types/
    └── game.ts                  # EXTEND: Add VoteRevealData interface
```

## Implementation Phases

### Phase 1: Extend PlayerSeats Interface

Add new props to `PlayerSeats` for vote reveal:

```typescript
interface PlayerSeatsProps {
  // ... existing props ...

  // NEW: Vote reveal props
  voteRevealActive?: boolean;
  voteRevealData?: {
    votes: VoteInfo[];
    isApproved: boolean;
    approveCount: number;
    rejectCount: number;
  };
}
```

### Phase 2: Add Vote Icon Rendering

In `PlayerSeats`, when `voteRevealActive` is true:
- Replace player initial with ✓ or ✗ based on their vote
- Apply green (emerald-500) for approve, red (red-500) for reject
- Add fade transition animation

```tsx
{/* Avatar content - vote icon or initial */}
{voteRevealActive && playerVote ? (
  <span className={`
    text-3xl font-bold animate-fade-in
    ${playerVote.vote === 'approve' ? 'text-emerald-400' : 'text-red-400'}
  `}>
    {playerVote.vote === 'approve' ? '✓' : '✗'}
  </span>
) : (
  <span>{player.nickname.charAt(0).toUpperCase()}</span>
)}
```

### Phase 3: Add Center Summary

Modify the center circle to show vote summary during reveal:

```tsx
{voteRevealActive && voteRevealData ? (
  <div className="flex flex-col items-center justify-center h-full text-center px-3">
    <span className="text-4xl mb-1">
      {voteRevealData.isApproved ? '✅' : '❌'}
    </span>
    <span className="text-2xl font-bold text-amber-400">
      {voteRevealData.approveCount}-{voteRevealData.rejectCount}
    </span>
  </div>
) : (
  // Existing center message
)}
```

### Phase 4: Update GameBoard Integration

1. Remove `VoteResultReveal` import and usage
2. Keep `showVoteReveal` state logic for timing
3. Pass vote data to `PlayerSeats`:

```tsx
<PlayerSeats
  // ... existing props ...
  voteRevealActive={showVoteReveal}
  voteRevealData={gameState.last_vote_result ? {
    votes: gameState.last_vote_result.votes,
    isApproved: gameState.last_vote_result.is_approved,
    approveCount: gameState.last_vote_result.approve_count,
    rejectCount: gameState.last_vote_result.reject_count,
  } : undefined}
/>
```

### Phase 5: Add CSS Animations

Add Tailwind animations for smooth transitions:

```css
/* In tailwind.config.ts or as inline classes */
@keyframes fade-in-scale {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

.animate-vote-reveal {
  animation: fade-in-scale 0.3s ease-out;
}
```

### Phase 6: Handle Edge Cases

- **Disconnected player who voted**: Show their vote icon normally
- **Missing vote data**: Show "?" in gray
- **Early dismissal**: Cancel reveal if new vote starts

### Phase 7: Delete VoteResultReveal.tsx

After testing, remove:
- `src/components/game/VoteResultReveal.tsx`
- Import in `GameBoard.tsx`

## Key Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `PlayerSeats.tsx` | MODIFY | Add vote reveal props and rendering |
| `GameBoard.tsx` | MODIFY | Remove popup, pass data to PlayerSeats |
| `VoteResultReveal.tsx` | DELETE | No longer needed |
| `tailwind.config.ts` | MODIFY | Add animation keyframes (if needed) |

## Complexity Tracking

> No complexity violations - this is a straightforward UI refactor.

| Aspect | Assessment |
|--------|------------|
| New Components | 0 (extending existing) |
| State Management | Reusing existing showVoteReveal state |
| API Changes | None |
| Database Changes | None |

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Animation performance | Use CSS-only animations (no JS) |
| Layout shift | Fixed-size avatar, icon replaces initial |
| Mobile responsiveness | Test on 375px viewport |
| Color conflict | Vote icons use distinct emerald/red vs team colors |
