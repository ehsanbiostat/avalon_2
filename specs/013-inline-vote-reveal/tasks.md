# Tasks: Inline Vote Results Display

**Input**: Design documents from `/specs/013-inline-vote-reveal/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md
**Tests**: Not requested (manual browser testing per spec)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new setup needed - extending existing components

> This feature modifies existing files only. No new project setup required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend interfaces before implementing display logic

- [ ] T001 Add VoteRevealData interface to `src/types/game.ts`
- [ ] T002 Add voteRevealActive and voteRevealData props to PlayerSeatsProps interface in `src/components/game/PlayerSeats.tsx`

**Checkpoint**: Interfaces ready - user story implementation can begin

---

## Phase 3: User Story 1 - View Vote Results on Avatars (Priority: P1) 🎯 MVP

**Goal**: Display ✓/✗ icons inside player avatars when vote results are revealed

**Independent Test**: Complete a voting round → verify all avatars show ✓/✗ icons with correct colors (green/red)

### Implementation for User Story 1

- [ ] T003 [US1] Add helper function to find player's vote from votes array in `src/components/game/PlayerSeats.tsx`
- [ ] T004 [US1] Add conditional rendering to show ✓/✗ icon instead of initial when voteRevealActive is true in `src/components/game/PlayerSeats.tsx`
- [ ] T005 [US1] Apply emerald-400 color for approve (✓) and red-400 for reject (✗) in `src/components/game/PlayerSeats.tsx`
- [ ] T006 [US1] Handle edge case: show "?" in gray for players with missing vote data in `src/components/game/PlayerSeats.tsx`
- [ ] T007 [US1] Pass voteRevealActive and voteRevealData props from GameBoard to PlayerSeats in `src/components/game/GameBoard.tsx`

**Checkpoint**: Avatar vote icons display correctly. Can manually test before continuing.

---

## Phase 4: User Story 2 - View Vote Summary in Center (Priority: P1)

**Goal**: Show "✅ 4-2" or "❌ 2-4" summary in center circle during reveal

**Independent Test**: Complete a voting round → verify center shows correct emoji and counts

### Implementation for User Story 2

- [ ] T008 [US2] Modify getCenterMessage to return vote summary when voteRevealActive is true in `src/components/game/PlayerSeats.tsx`
- [ ] T009 [US2] Display emoji (✅/❌) based on isApproved value in center circle in `src/components/game/PlayerSeats.tsx`
- [ ] T010 [US2] Display approve-reject count format (e.g., "4-2") below emoji in `src/components/game/PlayerSeats.tsx`

**Checkpoint**: Center summary displays correctly during vote reveal.

---

## Phase 5: User Story 3 - Smooth Animation Transition (Priority: P2)

**Goal**: Animate the transition between initial and vote icon (fade in/out)

**Independent Test**: Observe vote reveal → verify smooth 300ms fade transition, no jarring swap

### Implementation for User Story 3

- [ ] T011 [US3] Add animate-vote-reveal keyframes to `tailwind.config.ts` (fade-in-scale, 0.3s)
- [ ] T012 [US3] Apply transition animation to vote icon appearance in `src/components/game/PlayerSeats.tsx`
- [ ] T013 [US3] Apply transition animation to vote icon disappearance (return to initial) in `src/components/game/PlayerSeats.tsx`

**Checkpoint**: Transitions are smooth and complete in under 300ms.

---

## Phase 6: Integration & Cleanup

**Purpose**: Remove old popup component, finalize integration

- [ ] T014 Remove VoteResultReveal component rendering from `src/components/game/GameBoard.tsx`
- [ ] T015 Remove VoteResultReveal import from `src/components/game/GameBoard.tsx`
- [ ] T016 Delete `src/components/game/VoteResultReveal.tsx`
- [ ] T017 Verify existing avatar features preserved during reveal (crown, Lady badge, border colors) in `src/components/game/PlayerSeats.tsx`

**Checkpoint**: Old popup removed, inline display is the only vote reveal mechanism.

---

## Phase 7: Polish & Edge Cases

**Purpose**: Handle edge cases and ensure mobile compatibility

- [ ] T018 [P] Handle disconnected player who voted: show their vote icon normally in `src/components/game/PlayerSeats.tsx`
- [ ] T019 [P] Handle quick succession: if new vote starts before reveal ends, cancel current reveal in `src/components/game/GameBoard.tsx`
- [ ] T020 Test on mobile viewport (375px) - verify no layout shift or overflow
- [ ] T021 Run quickstart.md manual testing checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: N/A - no new setup needed
- **Phase 2 (Foundational)**: Must complete before user stories - adds required interfaces
- **Phase 3 (US1)**: Depends on Phase 2 - core avatar icon display
- **Phase 4 (US2)**: Depends on Phase 2, can run parallel to Phase 3 - center summary
- **Phase 5 (US3)**: Depends on Phase 3 completion - animations for existing icons
- **Phase 6 (Integration)**: Depends on Phase 3, 4 - removes old popup
- **Phase 7 (Polish)**: Depends on Phase 6 - final edge cases

### User Story Dependencies

- **User Story 1 (P1)**: Foundational phase only - no dependency on other stories
- **User Story 2 (P1)**: Foundational phase only - independent of US1
- **User Story 3 (P2)**: Depends on US1 (needs icons to animate)

### Parallel Opportunities

Within Phase 2:
- T001 and T002 can run in parallel [P] (different files)

Within Phase 4 and Phase 3:
- US1 (avatar icons) and US2 (center summary) can be implemented in parallel (both only modify PlayerSeats.tsx but different sections)

Within Phase 7:
- T018 and T019 can run in parallel [P] (different files)

---

## Parallel Example: Foundation

```bash
# These can run in parallel (different files):
Task T001: "Add VoteRevealData interface in src/types/game.ts"
Task T002: "Add props to PlayerSeatsProps in src/components/game/PlayerSeats.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational interfaces
2. Complete Phase 3: User Story 1 (avatar icons)
3. **STOP and VALIDATE**: Test vote reveal shows icons on avatars
4. Proceed to US2 if working

### Incremental Delivery

1. Foundational → Interfaces ready
2. User Story 1 → Avatar icons work → Test
3. User Story 2 → Center summary works → Test
4. User Story 3 → Animations smooth → Test
5. Integration → Remove old popup → Test
6. Polish → Edge cases handled → Final test

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 21 |
| Phase 2 (Foundational) | 2 tasks |
| Phase 3 (US1 - Avatar Icons) | 5 tasks |
| Phase 4 (US2 - Center Summary) | 3 tasks |
| Phase 5 (US3 - Animations) | 3 tasks |
| Phase 6 (Integration) | 4 tasks |
| Phase 7 (Polish) | 4 tasks |
| Parallel Opportunities | 4 (T001+T002, T018+T019) |
| MVP Scope | Phase 2 + Phase 3 (7 tasks) |

---

## Notes

- No tests generated (manual browser testing per spec)
- All changes in 3 main files: `PlayerSeats.tsx`, `GameBoard.tsx`, `game.ts`
- One file deleted: `VoteResultReveal.tsx`
- Preserve existing avatar features (crown 👑, Lady 🌊, voted ✓, borders)
- 10-second reveal duration controlled by existing showVoteReveal state
