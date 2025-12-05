# Tasks: Center Game Messages

**Feature**: 008-center-game-messages  
**Input**: Design documents from `/specs/008-center-game-messages/`  
**Prerequisites**: ✅ plan.md, ✅ spec.md, ✅ research.md, ✅ data-model.md, ✅ contracts/component-api.md, ✅ quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## User Story Summary

| Phase | Story | Priority | Tasks | Description |
|-------|-------|----------|-------|-------------|
| 1 | Setup | - | 3 | Project initialization |
| 2 | Foundational | - | 2 | Component analysis & types |
| 3 | US1 | P1 🎯 | 4 | Basic quest/phase display |
| 4 | US2 | P1 🎯 | 3 | Leader & team size context |
| 5 | US3 | P2 | 6 | All phase messages & action prompts |
| 6 | Polish | - | 4 | Edge cases & documentation |

**Total**: 22 tasks | **MVP**: Phase 1-4 (12 tasks)

---

## Phase 1: Setup

**Purpose**: Verify environment and understand existing component structure

- [x] T001 Verify feature branch `008-center-game-messages` is checked out and up to date
- [x] T002 Read existing `src/components/game/PlayerSeats.tsx` to understand current structure
- [x] T003 Review `src/app/game/[gameId]/page.tsx` and `src/components/game/GameBoard.tsx` to understand how PlayerSeats is used and what props are available

**Checkpoint**: Environment ready, existing code understood

---

## Phase 2: Foundational

**Purpose**: Prepare TypeScript types and component structure

**⚠️ CRITICAL**: Complete before any user story implementation

- [x] T004 Add `CenterMessage` interface to `src/types/game.ts` if not already defined (or define inline in PlayerSeats)
  ```typescript
  interface CenterMessage {
    line1: string;
    line2: string;
  }
  ```
- [x] T005 Document the center circle HTML structure in PlayerSeats component (locate the div with "ROUND TABLE" text)
  - Located at lines 64-67 in PlayerSeats.tsx
  - Current structure: w-32 h-32 rounded-full with gradient background
  - Contains single span with "ROUND TABLE" text

**Checkpoint**: Types ready, center circle location identified

---

## Phase 3: User Story 1 - View Current Quest and Phase Information (Priority: P1) 🎯 MVP

**Goal**: Display quest number and basic phase description in center circle for all players

**Independent Test**: Start a game, navigate through phases (team building → voting → quest), verify center shows "Quest {N}" and phase-appropriate second line

### Implementation for User Story 1

- [x] T006 [US1] Create `getCenterMessage()` function skeleton in `src/components/game/PlayerSeats.tsx` that accepts game phase and quest number
- [x] T007 [US1] Implement message logic for `team_building` phase in `getCenterMessage()`:
  - Line 1: `Quest ${questNumber}`
  - Line 2: Generic "Team is being selected..." (will enhance in US2)
- [x] T008 [US1] Implement message logic for `voting` phase:
  - Line 1: `Quest ${questNumber}`
  - Line 2: "Vote on the proposed team"
- [x] T009 [US1] Replace static "ROUND TABLE" text in center circle div with dynamic message rendering using `getCenterMessage()` result

**Checkpoint**: ✅ US1 Complete - Center displays quest number and basic phase info. Testable independently!

**Testing**: 
- Create/join a game
- Verify "Quest 1" shows in center
- Propose a team → Verify "Vote on the proposed team" shows

---

## Phase 4: User Story 2 - See Leader and Team Size Context (Priority: P1) 🎯 MVP

**Goal**: Show leader's name and required team size during team building phase

**Independent Test**: During team building, non-leaders see "{Leader Name} is selecting a team", leaders see "Select {N} players for the quest"

### Implementation for User Story 2

- [x] T010 [US2] Update `getCenterMessage()` to accept `isCurrentPlayerLeader`, `leaderNickname`, and `teamSize` parameters
- [x] T011 [US2] Enhance `team_building` phase logic in `getCenterMessage()`:
  - If leader: Line 2 = `Select ${teamSize} players for the quest`
  - If not leader: Line 2 = `${leaderNickname} is selecting a team`
- [x] T012 [US2] Add nickname truncation logic: if `leaderNickname.length > 15`, truncate to 15 chars + "..."

**Checkpoint**: ✅ US2 Complete - Leader context and team size visible. Testable with US1!

**Testing**:
- As leader: Verify "Select 2 players for the quest" (or appropriate team size)
- As non-leader: Verify "{Leader Name} is selecting a team"
- Test with long nickname (>15 chars): Verify truncation works

---

## Phase 5: User Story 3 - Understand Current Player Actions Required (Priority: P2)

**Goal**: Display clear action prompts for all remaining game phases (quest execution, assassin, lady of the lake, game over)

**Independent Test**: Progress through a complete game, verify appropriate messages for quest execution (team member vs observer), assassin phase (assassin vs others), lady of lake (holder vs others), and game over (good/evil wins)

### Implementation for User Story 3

- [x] T013 [US3] Update `getCenterMessage()` to accept `isOnQuestTeam` and `lastQuestResult` parameters (lastQuestResult from game state: 'success' | 'failed' | null)
- [x] T014 [US3] Implement message logic for `quest` phase:
  - If on quest team: Line 2 = "Submit your quest action"
  - If not on team: Line 2 = "Quest team is deciding..."
- [x] T015 [US3] Implement message logic for `quest_result` phase:
  - Line 1: `Quest ${questNumber}`
  - Line 2: "Quest succeeded!" if lastQuestResult === 'success', "Quest failed!" otherwise
- [x] T016 [US3] Implement message logic for `assassin` phase:
  - Line 1: "Assassin Phase"
  - If is assassin: Line 2 = "Select your target"
  - If not assassin: Line 2 = "The Assassin is choosing..."
- [x] T017 [US3] Implement message logic for `lady_of_lake` phase:
  - Line 1: "Lady of the Lake"
  - If is holder: Line 2 = "Select a player to investigate"
  - If not holder: Line 2 = `${holderNickname} is investigating...`
- [x] T018 [US3] Implement message logic for `game_over` phase:
  - Line 1: "Game Over"
  - Line 2: "Good Wins!" or "Evil Wins!" (based on game winner)

**Checkpoint**: ✅ US3 Complete - All game phases have appropriate messages. Full feature functional!

**Testing** (see [quickstart.md](./quickstart.md) for detailed test matrix):
- Quest execution: Verify team member vs observer messages
- Assassin phase: Verify assassin vs non-assassin messages
- Lady of Lake: Verify holder vs non-holder messages
- Game over: Verify good/evil win messages

---

## Phase 6: Polish & Edge Cases

**Purpose**: Handle edge cases, ensure mobile compatibility, finalize documentation

- [x] T019 [P] Add fallback message in `getCenterMessage()` for unknown/undefined game phases:
  - Line 1: `Quest ${questNumber || 1}`
  - Line 2: "Game in progress..."
- [x] T020 [P] Add defensive checks for missing data (handle `null`/`undefined` for leader, holder, etc.) in all message logic branches
- [ ] T021 Test on mobile viewport (375px width) using browser dev tools - verify text fits in center circle and is readable
  - **STATUS**: Requires manual testing after deployment
- [ ] T022 Update center circle styling if needed:
  - Verify font sizes (Line 1: text-lg, Line 2: text-sm)
  - Verify colors (text-amber-500, text-amber-400)
  - Ensure proper centering (flex flex-col items-center justify-center)
  - **STATUS**: Requires manual visual verification after deployment

**Checkpoint**: ✅ Feature complete, polished, and production-ready!

**Final Testing**: Run through complete test matrix in [quickstart.md](./quickstart.md)

---

## Dependency Graph

```
T001-T003 (Setup)
    ↓
T004-T005 (Foundational)
    ↓
T006-T009 (US1: Basic display) ← MVP Foundation
    ↓
T010-T012 (US2: Leader context) ← Enhances MVP
    ↓
T013-T018 (US3: All phases) ← Complete feature
    ↓
T019-T022 (Polish) ← Production ready
```

**Parallel Opportunities**:
- T019-T020 can be done in parallel (different concerns)
- T021-T022 can be done in parallel (testing vs styling)

---

## Implementation Strategy

### MVP Scope (Recommended First Deployment)

**Deploy after completing**: Phase 1-4 (Tasks T001-T012)

This provides:
- ✅ Quest number visible to all players (US1)
- ✅ Leader context during team building (US2)
- ✅ Basic phase awareness (team building, voting)

**MVP Value**: Players immediately understand which quest they're on and whose turn it is - the two most critical pieces of information.

### Full Feature Scope

**Deploy after completing**: Phase 1-6 (All 22 tasks)

This provides complete coverage of all game phases plus edge case handling.

---

## Testing Notes

**No automated tests required** (per spec - tests not mentioned as requirement)

**Manual testing approach**:
- Use scenarios from [quickstart.md](./quickstart.md)
- Test matrix covers all 7 game phases × role variants
- Edge case testing for long nicknames, rapid transitions, mobile viewport
- Visual validation for contrast, readability, layout

**Success Criteria Validation**:
- SC-001: Players identify game state <1 second → User observation
- SC-002: 95% understand whose turn → Ask test users
- SC-003: Messages update <500ms → Browser DevTools performance tab
- SC-004: 40% confusion reduction → Compare user feedback before/after
- SC-005: 4.5:1 contrast ratio → DevTools accessibility checker

---

## File Change Summary

**Modified Files** (1):
- `src/components/game/PlayerSeats.tsx` - Add message logic and replace static label

**New Files** (0):
- None required (all logic inline in PlayerSeats)

**Optional Files** (if complexity grows):
- `src/lib/utils/game-messages.ts` - Extract message logic if component gets too large
- `src/types/game.ts` - Add CenterMessage interface if used elsewhere

---

## Estimated Effort

| Phase | Tasks | Estimated Time | Complexity |
|-------|-------|----------------|------------|
| Setup | 3 | 15 minutes | Low |
| Foundational | 2 | 15 minutes | Low |
| US1 (P1) | 4 | 30 minutes | Low |
| US2 (P1) | 3 | 20 minutes | Low |
| US3 (P2) | 6 | 45 minutes | Medium |
| Polish | 4 | 30 minutes | Low |

**Total**: ~2.5 hours for complete implementation

**MVP Only** (Phase 1-4): ~1.5 hours

---

## Risk Assessment

**Risk Level**: ✅ **Very Low**

**Why**:
- Single component modification
- No database/API changes
- Pure frontend display logic
- Easy rollback (single file revert)
- No security implications

**Potential Issues**:
1. Long nicknames breaking layout → Mitigated by truncation logic (T012)
2. Missing data causing crashes → Mitigated by defensive checks (T020)
3. Rapid phase transitions causing flicker → Unlikely, but can be visually verified (T021)

**Mitigation**: All issues have explicit tasks addressing them.

---

## Definition of Done

**For MVP** (Phase 1-4):
- [ ] Center circle displays quest number for all players
- [ ] Team building phase shows leader name and team size
- [ ] Voting phase shows appropriate prompt
- [ ] No TypeScript errors
- [ ] Manual testing of basic scenarios complete
- [ ] Code committed to feature branch

**For Full Feature** (Phase 1-6):
- [ ] All game phases have appropriate messages
- [ ] All edge cases handled gracefully
- [ ] Mobile viewport tested and functional
- [ ] Complete test matrix from quickstart.md validated
- [ ] All success criteria verified
- [ ] Code reviewed and merged to main

---

## References

- **Spec**: [spec.md](./spec.md) - User stories and requirements
- **Plan**: [plan.md](./plan.md) - Technical approach and decisions
- **Research**: [research.md](./research.md) - Design decisions and rationale
- **Component API**: [contracts/component-api.md](./contracts/component-api.md) - Complete message mapping
- **Testing Guide**: [quickstart.md](./quickstart.md) - Detailed test scenarios

---

**Next**: `/speckit.implement` to start implementation, or `/speckit.analyze` to validate consistency

