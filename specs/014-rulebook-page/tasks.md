# Tasks: Rulebook Page

**Input**: Design documents from `/specs/014-rulebook-page/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md
**Tests**: Not requested (manual browser testing per quickstart.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared content definitions and component directory structure

- [ ] T001 Create rulebook component directory at `src/components/rulebook/`
- [ ] T002 Create static content definitions with types in `src/lib/domain/rulebook-content.ts`

**Checkpoint**: Shared infrastructure ready for tab component development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create reusable tab components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create RulebookTabs navigation component in `src/components/rulebook/RulebookTabs.tsx`
- [ ] T004 [P] Create RolesTab content component in `src/components/rulebook/RolesTab.tsx`
- [ ] T005 [P] Create GameModesTab content component in `src/components/rulebook/GameModesTab.tsx`
- [ ] T006 [P] Create VisualGuideTab content component in `src/components/rulebook/VisualGuideTab.tsx`
- [ ] T007 [P] Create GameFlowTab content component in `src/components/rulebook/GameFlowTab.tsx`
- [ ] T008 Create RulebookContent container component in `src/components/rulebook/RulebookContent.tsx`

**Checkpoint**: Foundation ready - all 4 tabs working in shared container

---

## Phase 3: User Story 1 - New Player Learning (Priority: P1) 🎯 MVP

**Goal**: New players can access a dedicated `/rules` page to learn about all roles and game mechanics before joining a game

**Independent Test**: Navigate to `/rules` → see 4 working tabs with all content → verify dark theme

### Implementation for User Story 1

- [ ] T009 [US1] Create dedicated rules page at `src/app/rules/page.tsx`
- [ ] T010 [US1] Add "Rules" link to home page footer in `src/app/page.tsx`
- [ ] T011 [US1] Verify `/rules` page renders with all 4 tabs and correct styling

**Checkpoint**: US1 complete - new players can learn rules from dedicated page

---

## Phase 4: User Story 2 - In-Game Reference (Priority: P2)

**Goal**: Players in an active game can quickly access the rulebook via a "?" button without leaving the game

**Independent Test**: Join a game room → click "?" button → modal opens with same content → close modal → game state preserved

### Implementation for User Story 2

- [ ] T012 [US2] Create RulebookModal wrapper component in `src/components/rulebook/RulebookModal.tsx`
- [ ] T013 [US2] Add "?" button and modal state to `src/components/game/GameBoard.tsx`
- [ ] T014 [US2] Verify modal opens/closes correctly and preserves game state

**Checkpoint**: US2 complete - in-game players can access quick reference

---

## Phase 5: User Story 3 - Role Clarification (Priority: P3)

**Goal**: Players who just received a role can understand what it can do and who they can see

**Independent Test**: View Roles tab → see all 8 roles grouped by team → verify descriptions match game behavior

### Implementation for User Story 3

> Note: US3 is satisfied by the content in RolesTab (T004). This phase validates completeness.

- [ ] T015 [US3] Verify RolesTab shows all 8 roles with correct team colors in `src/components/rulebook/RolesTab.tsx`
- [ ] T016 [US3] Verify role descriptions match `SPECIAL_ROLES` from `src/lib/utils/constants.ts`

**Checkpoint**: US3 complete - all roles clearly explained with visibility rules

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Responsive design, accessibility, and final validation

- [ ] T017 [P] Test responsive design on mobile (375px width) - verify tabs scroll
- [ ] T018 [P] Verify keyboard accessibility for tabs (Tab key, Enter to select)
- [ ] T019 [P] Verify dark theme consistency across all tabs
- [ ] T020 Run quickstart.md manual testing checklist
- [ ] T021 Create index export file at `src/components/rulebook/index.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on T001, T002 - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on T008 (RulebookContent) - dedicated page
- **Phase 4 (US2)**: Depends on T008 (RulebookContent) - modal wrapper
- **Phase 5 (US3)**: Depends on T004 (RolesTab) - content validation
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational phase - MVP, standalone page
- **User Story 2 (P2)**: Depends on Foundational phase - adds modal to game room
- **User Story 3 (P3)**: Depends on Foundational phase - validates role content

### Parallel Opportunities

Within Phase 2 (Foundational):
- T004, T005, T006, T007 can ALL run in parallel (different tab files)

Within Phase 6 (Polish):
- T017, T018, T019 can ALL run in parallel (independent checks)

User Stories (after Foundational):
- US1, US2, US3 can run in parallel (different files/concerns)

---

## Parallel Example: Foundation

```bash
# Launch all tab components in parallel:
Task T004: "Create RolesTab in src/components/rulebook/RolesTab.tsx"
Task T005: "Create GameModesTab in src/components/rulebook/GameModesTab.tsx"
Task T006: "Create VisualGuideTab in src/components/rulebook/VisualGuideTab.tsx"
Task T007: "Create GameFlowTab in src/components/rulebook/GameFlowTab.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T008)
3. Complete Phase 3: User Story 1 (T009-T011)
4. **STOP and VALIDATE**: Test `/rules` page independently
5. Deploy/demo if ready - users can learn rules!

### Incremental Delivery

1. Setup + Foundational → 4 tabs working in shared container
2. Add User Story 1 → Dedicated `/rules` page (MVP!)
3. Add User Story 2 → Modal in game rooms
4. Add User Story 3 → Validate role content completeness
5. Polish → Mobile, accessibility, final checks

### Quick Win Order

```
T001 → T002 → T003 → T004-T007 (parallel) → T008 → T009 → DEMO!
```

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 21 |
| Phase 1 (Setup) | 2 tasks |
| Phase 2 (Foundational) | 6 tasks |
| Phase 3 (US1 - MVP) | 3 tasks |
| Phase 4 (US2) | 3 tasks |
| Phase 5 (US3) | 2 tasks |
| Phase 6 (Polish) | 5 tasks |
| Parallel Opportunities | 8 (T004-T007, T017-T019) |
| MVP Scope | T001-T011 (11 tasks) |

---

## Notes

- No automated tests requested - use quickstart.md manual checklist
- Reuse existing `SPECIAL_ROLES` from `constants.ts` for role data
- Reuse existing `Modal` component for RulebookModal
- All styling uses existing Tailwind theme variables
- WAI-ARIA tab pattern for accessibility (research.md)

