# Implementation Plan: Player Indicators UI Improvement

**Branch**: `012-player-indicators-ui` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-player-indicators-ui/spec.md`

## Summary

Refactor the `PlayerSeats.tsx` component to eliminate indicator overlap by:
1. Using **inner fill color** for team selection states (selected=blue, proposed=green)
2. Using **border color** for identity states (You=amber, disconnected=red)
3. Reducing badge positions from 6 to 3 (crown top-center, Lady bottom-right, voted bottom-left)

This is a **UI-only refactor** with no database or API changes.

## Technical Context

**Language/Version**: TypeScript 5.x with React 18
**Primary Dependencies**: Next.js 15, Tailwind CSS
**Storage**: N/A (no data changes)
**Testing**: Visual testing, manual verification
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (frontend-only change)
**Performance Goals**: Smooth CSS transitions, no layout shift
**Constraints**: Must work with 5-10 players, colorblind-friendly palette
**Scale/Scope**: Single component refactor (~100 lines changed)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **IV. Code Quality** - Components < 150 lines | ✅ PASS | Simplifying, not adding complexity |
| **IV. Separation of Concerns** - UI in components/ | ✅ PASS | All changes in `src/components/game/` |
| **VI. UX Principles** - Clarity over flair | ✅ PASS | Reducing visual clutter |
| **VI. Responsive Design** - Mobile functional | ✅ PASS | Color-based system scales better |
| **II. Tech Stack** - React/TypeScript | ✅ PASS | Using existing tech stack |

**Constitution Violations**: None

## High-Level Architecture

This feature modifies only the presentation layer:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     EXISTING ARCHITECTURE                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Next.js App (App Router)                   │  │
│  │                                                                │  │
│  │  PLAYER INDICATORS UI CHANGES:                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │ • PlayerSeats.tsx → Refactor indicator system           │  │  │
│  │  │   - Remove: top-left disconnect badge                   │  │  │
│  │  │   - Remove: top-right checkmark/shield badges           │  │  │
│  │  │   - Remove: bottom-left Lady badge                      │  │  │
│  │  │   - Add: Fill color classes for team states             │  │  │
│  │  │   - Add: Border color classes for identity states       │  │  │
│  │  │   - Move: Lady to bottom-right                          │  │  │
│  │  │   - Move: Vote to bottom-left                           │  │  │
│  │  │   - Keep: Crown at top-center                           │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

### Documentation (this feature)

```text
specs/012-player-indicators-ui/
├── spec.md              # Feature specification ✅
├── plan.md              # This file ✅
├── research.md          # Phase 0 output ✅
├── quickstart.md        # Phase 1 output ✅
├── checklists/
│   └── requirements.md  # Quality checklist ✅
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code Changes

```text
src/components/game/
└── PlayerSeats.tsx      # PRIMARY: Refactor indicator rendering

# No other files affected - this is an isolated UI refactor
```

**Structure Decision**: Single file modification. The `PlayerSeats.tsx` component is self-contained and all indicator logic lives within it.

## Implementation Phases

### Phase 1: Refactor Avatar Styling

**Goal**: Replace badge-based indicators with color-based indicators

**Changes to PlayerSeats.tsx**:

1. **Update avatar className logic** (lines 230-245):
   - Add fill color based on team state: `bg-sky-700` (selected), `bg-emerald-700` (proposed), `bg-slate-700` (default)
   - Add border color based on identity: `border-amber-400` (You), `border-red-500` (disconnected), `border-slate-400` (default)

2. **Remove obsolete badges** (lines 261-294):
   - Remove top-left disconnect badge
   - Remove top-right checkmark badge
   - Remove top-right shield badge
   - Remove current bottom-left Lady badge position

3. **Add new badge positions**:
   - Lady 🌊 at bottom-right (`-bottom-2 -right-3`)
   - Voted ✓ at bottom-left (`-bottom-2 -left-3`)

### Phase 2: State Priority Logic

**Goal**: Handle multiple simultaneous states correctly

**Priority order** (higher number = higher priority for conflicting properties):

| Priority | State | Affects | Value |
|----------|-------|---------|-------|
| 1 | Default | fill, border | slate |
| 2 | On proposed team | fill | emerald |
| 3 | Selected for team | fill | sky |
| 4 | You (current player) | border | amber (thick) |
| 5 | Disconnected | border, filter | red + grayscale |

**Implementation**:
```tsx
// Pseudocode for className logic
const fillColor = isDisconnected ? 'bg-slate-800'
  : selected ? 'bg-sky-700'
  : isProposed ? 'bg-emerald-700'
  : 'bg-slate-700';

const borderColor = isDisconnected ? 'border-red-500'
  : isMe ? 'border-amber-400'
  : selected ? 'border-sky-400'
  : isProposed ? 'border-emerald-400'
  : 'border-slate-400';
```

### Phase 3: Badge Positioning

**Goal**: Position remaining badges to avoid overlap

**Badge positions**:
```tsx
// Crown - top center (unchanged)
<div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</div>

// Lady - bottom right (moved from bottom-left)
<div className="absolute -bottom-2 -right-3 text-xl">🌊</div>

// Voted - bottom left (moved from bottom-right)
<div className="absolute -bottom-2 -left-3 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs">✓</div>
```

## Color Specifications

### Fill Colors (Team States)

| State | Tailwind Class | Hex | Description |
|-------|---------------|-----|-------------|
| Default | `bg-slate-700` | #334155 | Neutral gray |
| Selected | `bg-sky-700` | #0369a1 | Blue - being selected |
| Proposed | `bg-emerald-700` | #047857 | Green - on approved team |

### Border Colors (Identity States)

| State | Tailwind Class | Hex | Description |
|-------|---------------|-----|-------------|
| Default | `border-slate-400` | #94a3b8 | Neutral gray |
| You | `border-amber-400` | #fbbf24 | Gold - current player |
| Disconnected | `border-red-500` | #ef4444 | Red - offline |

### Additional Effects

| State | Classes | Description |
|-------|---------|-------------|
| Disconnected | `grayscale opacity-60` | Desaturated appearance |
| Leader | `ring-4 ring-amber-400 ring-offset-2` | Outer ring (keep existing) |
| You border | `border-4` | Thicker border for visibility |

## Complexity Tracking

No constitution violations to justify.

## Dependencies

**None** - This is a self-contained UI refactor with no external dependencies.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Color contrast issues | Users can't distinguish states | Use colorblind-friendly palette (already in theme) |
| Transition jank | Jarring state changes | Add `transition-all duration-300` to avatar |
| Mobile touch targets | Badges too small | Keep minimum 20px badge size |

## Definition of Done

- [ ] All 6 current badge positions removed
- [ ] Fill color shows team selection state
- [ ] Border color shows identity state (You, disconnected)
- [ ] Crown badge at top-center
- [ ] Lady badge at bottom-right
- [ ] Vote badge at bottom-left
- [ ] No overlap in 10-player game
- [ ] Smooth color transitions
- [ ] Works on mobile viewport (375px+)
