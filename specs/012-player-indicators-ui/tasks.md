# Tasks: Player Indicators UI Improvement

**Input**: Design documents from `/specs/012-player-indicators-ui/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: No automated tests requested - visual verification only.

**Organization**: Tasks organized by user story for independent validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different sections, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- All tasks modify: `src/components/game/PlayerSeats.tsx`

---

## Phase 1: Setup

**Purpose**: Prepare for refactoring

- [ ] T001 Review current PlayerSeats.tsx implementation in src/components/game/PlayerSeats.tsx
- [ ] T002 Identify all current indicator positions and className logic (lines 230-294)

---

## Phase 2: Foundational (Color Helper Functions)

**Purpose**: Create reusable color logic functions that all user stories depend on

**⚠️ CRITICAL**: These helper functions must be complete before user story implementation

- [ ] T003 Create getFillColor() helper function for team states in src/components/game/PlayerSeats.tsx
- [ ] T004 Create getBorderColor() helper function for identity states in src/components/game/PlayerSeats.tsx
- [ ] T005 Add transition classes to avatar container for smooth state changes

**Checkpoint**: Helper functions ready - user story implementation can begin

---

## Phase 3: User Story 1 - Clear Team Selection Visibility (Priority: P1) 🎯 MVP

**Goal**: Players instantly see team selection state via fill color (blue=selected, green=proposed)

**Independent Test**: Load game in team_building phase, select player, verify blue fill appears immediately

### Implementation for User Story 1

- [ ] T006 [US1] Implement sky-700 fill color for selected players in src/components/game/PlayerSeats.tsx
- [ ] T007 [US1] Implement emerald-700 fill color for proposed team members in src/components/game/PlayerSeats.tsx
- [ ] T008 [US1] Implement slate-700 default fill color in src/components/game/PlayerSeats.tsx
- [ ] T009 [US1] Update avatar className to use getFillColor() instead of inline conditionals
- [ ] T010 [US1] Remove obsolete bg-green-800 and bg-cyan-700 classes from current implementation
- [ ] T011 [US1] Verify fill color priority: selected > proposed > default
- [ ] T012 [US1] Handle inDraftSelection state with sky-700 fill + pulse animation

**Checkpoint**: Team selection visible via fill color - verify in 10-player game

---

## Phase 4: User Story 2 - Identity Recognition (Priority: P1)

**Goal**: Players identify themselves (amber border) and disconnected players (red border + grayscale)

**Independent Test**: Join game, verify amber border on your avatar; disconnect player, verify red border + grayscale

### Implementation for User Story 2

- [ ] T013 [US2] Implement amber-400 thick border for current player (isMe) in src/components/game/PlayerSeats.tsx
- [ ] T014 [US2] Implement red-500 border for disconnected players in src/components/game/PlayerSeats.tsx
- [ ] T015 [US2] Implement slate-400 default border color in src/components/game/PlayerSeats.tsx
- [ ] T016 [US2] Add grayscale opacity-60 filter for disconnected players
- [ ] T017 [US2] Update avatar className to use getBorderColor() instead of inline conditionals
- [ ] T018 [US2] Set border-4 thickness for current player, border-3 for others
- [ ] T019 [US2] Remove obsolete disconnect badge (top-left X icon) from lines 261-270

**Checkpoint**: Identity states visible via border color - verify "You" and disconnected states

---

## Phase 5: User Story 3 - Special Role Indicators (Priority: P1)

**Goal**: Crown, Lady, and Vote badges positioned without overlap

**Independent Test**: Create game with Lady of Lake, verify token at bottom-right, no overlap with neighbors

### Implementation for User Story 3

- [ ] T020 [US3] Keep crown badge at top-center position (no change needed) in src/components/game/PlayerSeats.tsx
- [ ] T021 [US3] Move Lady of Lake badge from bottom-left to bottom-right (-bottom-2 -right-3)
- [ ] T022 [US3] Remove obsolete shield badge (🛡️) from top-right position
- [ ] T023 [US3] Remove obsolete checkmark badge from top-right position (lines 280-287)
- [ ] T024 [US3] Verify leader amber ring effect still works with new border logic
- [ ] T025 [US3] Test adjacent players: verify Lady (bottom-right) doesn't overlap with neighbor

**Checkpoint**: Special role badges positioned correctly - verify no overlap in 10-player game

---

## Phase 6: User Story 4 - Vote Status During Voting Phase (Priority: P2)

**Goal**: Vote badge appears at bottom-left when player has voted

**Independent Test**: Enter voting phase, submit vote, verify ✓ appears at bottom-left

### Implementation for User Story 4

- [ ] T026 [US4] Move vote badge from bottom-right to bottom-left (-bottom-2 -left-3)
- [ ] T027 [US4] Style vote badge: w-5 h-5 bg-yellow-500 rounded-full text-xs
- [ ] T028 [US4] Add title="Has voted" tooltip to vote badge
- [ ] T029 [US4] Verify vote badge only appears when has_voted is true

**Checkpoint**: Vote status visible - verify badge appears/disappears correctly

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, transitions, and validation

- [ ] T030 Verify transition-all duration-300 works correctly during state changes
- [ ] T031 Simplify name styling to use consistent color logic based on isMe and isDisconnected
- [ ] T032 Remove any unused CSS classes from the refactored component
- [ ] T033 Verify all states work together: Leader + Lady + On Team + Voted + Current Player
- [ ] T034 Test on mobile viewport (375px width) - verify badges visible
- [ ] T035 Run visual verification with 10-player game per quickstart.md checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase
  - US1 and US2 can proceed in parallel (fill vs border logic)
  - US3 depends on US2 (badge removal after border logic in place)
  - US4 can proceed after US3 (badge positioning)
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (Fill Colors)**: After Foundational - independent of other stories
- **US2 (Border Colors)**: After Foundational - independent of US1
- **US3 (Badge Positioning)**: After US2 - removes badges replaced by borders
- **US4 (Vote Badge)**: After US3 - uses same positioning pattern

### Within Each User Story

- Implement color/positioning logic first
- Remove obsolete code second
- Verify at checkpoint before moving on

### Parallel Opportunities

| Tasks | Can Run In Parallel | Reason |
|-------|---------------------|--------|
| T003, T004 | Yes [P] | Different helper functions |
| T006-T012 (US1) | Sequential | Same className block |
| T013-T019 (US2) | Sequential | Same className block |
| US1 and US2 | Yes [P] | Fill vs Border - different properties |
| T030, T031, T032 | Yes [P] | Different code sections |

---

## Parallel Example: Foundational Phase

```bash
# Launch helper functions in parallel:
Task T003: "Create getFillColor() helper function"
Task T004: "Create getBorderColor() helper function"
```

## Parallel Example: User Stories 1 & 2

```bash
# Can work on fill and border logic simultaneously:
Developer A: US1 tasks (T006-T012) - Fill color implementation
Developer B: US2 tasks (T013-T019) - Border color implementation
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup ✓
2. Complete Phase 2: Foundational (helper functions)
3. Complete Phase 3: User Story 1 (fill colors)
4. **STOP and VALIDATE**: Test team selection visibility
5. Commit as MVP increment

### Incremental Delivery

1. Setup + Foundational → Helper functions ready
2. Add US1 (Fill) → Test → Commit (MVP!)
3. Add US2 (Border) → Test → Commit
4. Add US3 (Badges) → Test → Commit
5. Add US4 (Vote) → Test → Commit
6. Polish → Final verification → Commit

### Single Developer Strategy

Since this is a single-file refactor, recommended order:

1. T001-T002: Understand current code
2. T003-T005: Create helper functions + transitions
3. T006-T012: Implement fill colors (including draft selection)
4. T013-T019: Implement border colors
5. T020-T025: Reposition badges
6. T026-T029: Add vote badge
7. T030-T035: Polish and verify

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 35 |
| **Setup Tasks** | 2 |
| **Foundational Tasks** | 3 |
| **US1 Tasks** | 7 |
| **US2 Tasks** | 7 |
| **US3 Tasks** | 6 |
| **US4 Tasks** | 4 |
| **Polish Tasks** | 6 |
| **Parallel Opportunities** | 7 tasks across phases |
| **Estimated Time** | 1-2 hours |

---

## Notes

- All tasks modify single file: `src/components/game/PlayerSeats.tsx`
- No database or API changes required
- Visual verification only (no automated tests)
- Commit after each user story checkpoint
- Use quickstart.md testing checklist for validation
