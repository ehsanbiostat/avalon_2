# Implementation Plan: Center Game Messages

**Branch**: `008-center-game-messages` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-center-game-messages/spec.md`

## Summary

Replace the static "ROUND TABLE" label in the center of the player circle with dynamic game status messages that show the current quest number, game phase, leader context, and action prompts. This is a frontend-only change to improve player awareness and reduce cognitive load by consolidating game state information at the natural visual focal point.

**Primary Requirement**: Display contextual game information (quest number, phase, leader, team size, action prompts) in the center circle instead of the static label.

**Technical Approach**: Update the `PlayerSeats` component to accept game state props and conditionally render dynamic messages based on the current game phase. Messages will be derived from existing game state (no new data model or API changes required).

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: React 18, Tailwind CSS 3.x, Next.js 14.2+
**Storage**: N/A (no database changes - uses existing game state)
**Testing**: Manual testing + component testing (optional)
**Target Platform**: Web (desktop-first, mobile-functional)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: 
- Center message updates within 500ms of phase transitions
- No layout shifts or flickering during message updates
- Maintain 60fps during phase transitions
**Constraints**:
- Messages must fit within existing center circle (max 2 lines)
- Must maintain readability (4.5:1 contrast ratio minimum)
- No breaking changes to PlayerSeats API for existing consumers
**Scale/Scope**: 
- Single component modification (PlayerSeats.tsx)
- ~10-15 different message variants across all game phases
- No new API endpoints or database migrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Alignment with Constitution Principles

✅ **I. Purpose & Vision**
- ✅ Clarity: Improves UI clarity by consolidating game state information
- ✅ Maintainability: Simple prop-based rendering logic, easy to extend
- ✅ Spec-Driven: Following complete spec → plan → tasks workflow
- ✅ Incremental: Small, focused change that doesn't affect other features

✅ **II. Tech Stack & Infrastructure**
- ✅ React + Next.js + TypeScript: Component change only
- ✅ Strict TypeScript: All props and state will be fully typed
- ✅ No backend changes: Pure frontend modification

✅ **III. Data & Security**
- ✅ N/A: No database, RLS, or security changes

✅ **IV. Code Quality & Architecture**
- ✅ Component size: PlayerSeats component may grow slightly but will remain under 200 lines
- ✅ Separation of concerns: Display logic separate from game state management
- ✅ TypeScript strict mode: All types explicit

✅ **V. Testing & Reliability**
- ✅ Error handling: N/A for display-only change
- ✅ Unit tests: Can be added for message selection logic (optional for MVP)

✅ **VI. UX & Product Principles**
- ✅ Minimal, clean UI: Maintains existing visual design, only replaces text
- ✅ Real-time updates: Messages will update via existing 3s polling mechanism (already compliant with <2s requirement)
- ✅ Responsive: Will maintain functionality on mobile

✅ **VII. Workflow & Collaboration**
- ✅ Branch naming: 008-center-game-messages
- ✅ Spec-driven: Complete spec before this plan
- ✅ PR requirements: Will reference spec and tasks

### Constitution Status

**Status**: ✅ **FULLY COMPLIANT** - No violations, no justifications needed

This change aligns perfectly with all constitution principles. It's a straightforward UI improvement that follows established patterns and doesn't introduce new complexity.

## Project Structure

### Documentation (this feature)

```text
specs/008-center-game-messages/
├── plan.md              # This file
├── research.md          # Phase 0 output (message content design, layout patterns)
├── data-model.md        # Phase 1 output (N/A - no data changes)
├── quickstart.md        # Phase 1 output (testing guide)
├── contracts/           # Phase 1 output (N/A - no API changes)
│   └── component-api.md # PlayerSeats component API contract
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── game/
│       └── PlayerSeats.tsx          # PRIMARY: Update center circle rendering
├── lib/
│   └── utils/
│       └── game-messages.ts         # NEW: Message selection logic (optional)
└── types/
    └── game.ts                      # MODIFY: Add message-related types if needed

tests/ (optional)
└── unit/
    └── game-messages.test.ts        # Optional: Test message selection logic
```

**Structure Decision**: This is a Next.js App Router web application. The change is isolated to the `PlayerSeats` component in `src/components/game/`. We follow the existing project structure from the constitution (Section IV).

The primary file to modify is `PlayerSeats.tsx`. Optionally, we may extract message selection logic to a utility function for better testability, but this can be inline for simplicity.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations. This section is not needed for this feature.

---

## Phase 0: Research & Decisions

See [research.md](./research.md) for detailed research outcomes.

**Key Decisions**:
1. **Message Content**: Defined specific messages for each game phase
2. **Layout Approach**: Replace center label inline vs extract to separate component
3. **Message Selection**: Inline conditional rendering vs utility function
4. **Styling**: Maintain existing styles vs new message-specific classes

## Phase 1: Design & Contracts

See design artifacts:
- [data-model.md](./data-model.md) - N/A for this feature (no data changes)
- [contracts/component-api.md](./contracts/component-api.md) - PlayerSeats API contract
- [quickstart.md](./quickstart.md) - Testing and verification guide

**Key Artifacts**:
1. **Component API**: Updated PlayerSeats interface with new props
2. **Message Mapping**: Complete phase → message mapping
3. **Testing Scenarios**: How to verify each message variant
