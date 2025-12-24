# Implementation Plan: Rulebook Page

**Branch**: `014-rulebook-page` | **Date**: 2024-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-rulebook-page/spec.md`

## Summary

Create a comprehensive rulebook page (`/rules`) and quick-access modal for game rooms that explains all roles, game modes, UI indicators, and game flow. The implementation uses a shared `RulebookContent` component rendered both as a dedicated page and within a modal overlay, featuring 4 tabbed sections with concise, visually-emphasized content.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14 (App Router)
**Primary Dependencies**: React 18, Tailwind CSS, existing UI components (Modal, Button)
**Storage**: N/A (static content only, reuses `SPECIAL_ROLES` from `constants.ts`)
**Testing**: Manual browser testing (per project patterns)
**Target Platform**: Web (desktop primary, mobile functional)
**Project Type**: Web application (Next.js)
**Performance Goals**: <1 second page load (static content, no API calls)
**Constraints**: Must match existing dark theme, use existing color variables
**Scale/Scope**: 1 new page, 1 new modal, ~5 new components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| React + Next.js App Router | ✅ PASS | Using `/app/rules/page.tsx` |
| TypeScript strict mode | ✅ PASS | All components typed |
| Tailwind CSS styling | ✅ PASS | Uses existing theme variables |
| Separation of concerns | ✅ PASS | Content in lib/domain, UI in components |
| Domain logic isolation | ✅ PASS | Reuses existing `SPECIAL_ROLES` constant |
| Responsive design | ✅ PASS | Mobile-first tabs, max-width on desktop |
| Real-time updates | ⬜ N/A | Static content, no realtime needed |
| RLS/Security | ⬜ N/A | No database access |
| Spec-driven development | ✅ PASS | Following speckit flow |

**Gate Result**: ✅ PASSED - No violations

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RULEBOOK ARCHITECTURE                        │
│                                                                  │
│  ACCESS POINTS                                                   │
│  ─────────────                                                   │
│                                                                  │
│  ┌─────────────┐          ┌────────────────────────────────┐   │
│  │  Home Page  │──────────│  /rules (dedicated page)       │   │
│  │  (footer)   │   link   │                                │   │
│  └─────────────┘          │  ┌────────────────────────┐   │   │
│                           │  │  RulebookContent       │   │   │
│  ┌─────────────┐          │  │  (shared component)    │   │   │
│  │ Game Room   │──modal──▶│  │                        │   │   │
│  │ (? button)  │          │  │  ┌────┬────┬────┬────┐│   │   │
│  └─────────────┘          │  │  │Role│Mode│Vis │Flow││   │   │
│                           │  │  └────┴────┴────┴────┘│   │   │
│                           │  └────────────────────────┘   │   │
│                           └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

### Documentation (this feature)

```text
specs/014-rulebook-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - static content)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
src/
├── app/
│   ├── page.tsx                    # MODIFY: Add "Rules" link to footer
│   └── rules/
│       └── page.tsx                # NEW: Dedicated rules page
├── components/
│   ├── game/
│   │   └── GameBoard.tsx           # MODIFY: Add "?" button to header
│   └── rulebook/
│       ├── RulebookContent.tsx     # NEW: Shared tabbed content
│       ├── RulebookModal.tsx       # NEW: Modal wrapper
│       ├── RulebookTabs.tsx        # NEW: Tab navigation component
│       ├── RolesTab.tsx            # NEW: Roles tab content
│       ├── GameModesTab.tsx        # NEW: Game modes tab content
│       ├── VisualGuideTab.tsx      # NEW: Visual guide tab content
│       └── GameFlowTab.tsx         # NEW: Game flow tab content
└── lib/
    └── domain/
        └── rulebook-content.ts     # NEW: Static content definitions
```

**Structure Decision**: Extends existing Next.js App Router structure. New `/app/rules/` route for dedicated page. New `/components/rulebook/` directory for modular tab components. Shared content in `lib/domain/` following existing patterns.

## Implementation Phases

### Phase 1: Foundation
1. Create `lib/domain/rulebook-content.ts` with static content arrays
2. Create `RulebookTabs.tsx` tab navigation component

### Phase 2: Tab Components
3. Create `RolesTab.tsx` using existing `SPECIAL_ROLES`
4. Create `GameModesTab.tsx` for Lady, Decoy, Split Intel
5. Create `VisualGuideTab.tsx` for indicators and colors
6. Create `GameFlowTab.tsx` for phases and win conditions

### Phase 3: Container Components
7. Create `RulebookContent.tsx` combining tabs
8. Create `RulebookModal.tsx` modal wrapper

### Phase 4: Integration
9. Create `/app/rules/page.tsx` dedicated page
10. Modify `/app/page.tsx` to add Rules link
11. Modify `GameBoard.tsx` to add "?" button

### Phase 5: Polish
12. Test responsive design on mobile
13. Verify keyboard accessibility for tabs

## Complexity Tracking

> No violations to justify - straightforward UI feature

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
