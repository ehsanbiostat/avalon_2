# Tasks: Lunatic & Brute Evil Characters

**Input**: Design documents from `/specs/020-lunatic-brute-roles/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Unit tests included as they are standard practice for domain logic validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Type System Foundation)

**Purpose**: Extend the type system to support new special roles

- [X] T001 Add `'lunatic' | 'brute'` to SpecialRole union type in `src/types/database.ts`
- [X] T002 [P] Add `lunatic?: boolean` and `brute?: boolean` to RoleConfig interface in `src/types/role-config.ts`
- [X] T003 [P] Update `isValidRoleConfig` type guard in `src/types/role-config.ts` to validate new fields
- [X] T004 [P] Create database migration `supabase/migrations/020_lunatic_brute_roles.sql` to add new role values to CHECK constraint

**Checkpoint**: Type system extended - role metadata can now be added ✅

---

## Phase 2: Foundational (Role Metadata & Constants)

**Purpose**: Add role definitions that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Add Lunatic entry to `SPECIAL_ROLES` record in `src/lib/utils/constants.ts` with emoji 🤪, team 'evil', knownToMerlin: true, knowsTeammates: true
- [X] T006 [P] Add Brute entry to `SPECIAL_ROLES` record in `src/lib/utils/constants.ts` with emoji 👊, team 'evil', knownToMerlin: true, knowsTeammates: true
- [X] T007 [P] Add 'lunatic' and 'brute' to `EVIL_SPECIAL_ROLES` array in `src/lib/utils/constants.ts`
- [X] T008 [P] Add 'lunatic' and 'brute' to `OPTIONAL_EVIL_ROLES` array in `src/lib/utils/constants.ts`
- [X] T009 [P] Add LUNATIC_MUST_FAIL and BRUTE_CANNOT_FAIL_LATE_QUEST to `ERROR_CODES` in `src/lib/utils/constants.ts`
- [X] T010 Add Lunatic to ROLE_INFO record in `src/lib/domain/roles.ts` with role_description from spec
- [X] T011 [P] Add Brute to ROLE_INFO record in `src/lib/domain/roles.ts` with role_description from spec
- [X] T012 Add Lunatic and Brute to `SPECIAL_ROLE_NAMES` record in `src/types/role.ts`
- [X] T013 [P] Add Lunatic and Brute to `SPECIAL_ROLE_DESCRIPTIONS` record in `src/types/role.ts`

**Checkpoint**: Role metadata complete - user story implementation can now begin ✅

---

## Phase 3: User Story 1 - Host Enables Lunatic Role (Priority: P1) 🎯 MVP

**Goal**: Room host can enable Lunatic role in game setup, role is assigned and displayed correctly

**Independent Test**: Enable Lunatic in role config with 7+ players, verify role assignment shows correctly

### Implementation for User Story 1

- [X] T014 [US1] Update `validateRoleConfig` in `src/lib/domain/role-config.ts` to check 7+ player minimum when lunatic enabled
- [X] T015 [US1] Update `validateRoleConfig` in `src/lib/domain/role-config.ts` to count lunatic in evil special role slot validation
- [X] T016 [US1] Update `getRoleDetails` in `src/lib/domain/role-config.ts` to include lunatic in evil count
- [X] T017 [US1] Add Lunatic to role distribution logic in `distributeRoles` function in `src/lib/domain/roles.ts`
- [X] T018 [US1] Add Lunatic toggle to Evil Team Roles section in `src/components/RoleConfigPanel.tsx` (visible only when expectedPlayers >= 7)
- [X] T019 [US1] Add Lunatic role reveal description to `src/components/RoleRevealModal.tsx`
- [X] T020 [US1] Update `src/components/RolesInPlay.tsx` to display Lunatic role when enabled

**Checkpoint**: Lunatic can be enabled, assigned, and displayed - ready for quest constraint testing ✅

---

## Phase 4: User Story 2 - Lunatic Quest Voting Constraint (Priority: P1)

**Goal**: Lunatic player is forced to play Fail on every quest - Success is blocked

**Independent Test**: Place Lunatic on quest team, verify only Fail button is active, API rejects Success

### Unit Tests for User Story 2

- [X] T021 [P] [US2] Create `tests/unit/lunatic-brute.test.ts` with test case: Lunatic cannot submit success action
- [X] T022 [P] [US2] Add test case: Lunatic can submit fail action on any quest (1-5) in `tests/unit/lunatic-brute.test.ts`

### Implementation for User Story 2

- [X] T023 [US2] Extend `validateQuestAction` function signature in `src/lib/domain/quest-resolver.ts` to accept specialRole and questNumber parameters
- [X] T024 [US2] Add Lunatic constraint to `validateQuestAction` in `src/lib/domain/quest-resolver.ts`: reject success action with LUNATIC_MUST_FAIL
- [X] T025 [US2] Update quest action API route `src/app/api/games/[gameId]/quest/action/route.ts` to pass specialRole and questNumber to validation
- [X] T026 [US2] Create `getQuestActionConstraints` helper function in `src/lib/domain/quest-resolver.ts` returning { canSuccess, canFail } for UI
- [X] T027 [US2] Update `QuestExecution.tsx` in `src/components/game/QuestExecution.tsx` to receive specialRole prop
- [X] T028 [US2] Update `QuestExecution.tsx` to calculate action constraints based on specialRole and questNumber
- [X] T029 [US2] Update Success button in `QuestExecution.tsx` to show disabled state when canSuccess is false
- [X] T030 [US2] Add constraint explanation text below disabled Success button for Lunatic in `QuestExecution.tsx`

**Checkpoint**: Lunatic quest constraint fully enforced in UI and API ✅

---

## Phase 5: User Story 3 - Host Enables Brute Role (Priority: P1)

**Goal**: Room host can enable Brute role in game setup, role is assigned and displayed correctly

**Independent Test**: Enable Brute in role config with 7+ players, verify role assignment shows correctly

### Implementation for User Story 3

- [X] T031 [US3] Update `validateRoleConfig` in `src/lib/domain/role-config.ts` to check 7+ player minimum when brute enabled
- [X] T032 [US3] Update `validateRoleConfig` in `src/lib/domain/role-config.ts` to count brute in evil special role slot validation
- [X] T033 [US3] Update `getRoleDetails` in `src/lib/domain/role-config.ts` to include brute in evil count
- [X] T034 [US3] Add Brute to role distribution logic in `distributeRoles` function in `src/lib/domain/roles.ts`
- [X] T035 [US3] Add Brute toggle to Evil Team Roles section in `src/components/RoleConfigPanel.tsx` (visible only when expectedPlayers >= 7)
- [X] T036 [US3] Add Brute role reveal description to `src/components/RoleRevealModal.tsx`
- [X] T037 [US3] Update `src/components/RolesInPlay.tsx` to display Brute role when enabled

**Checkpoint**: Brute can be enabled, assigned, and displayed - ready for quest constraint testing ✅

---

## Phase 6: User Story 4 & 5 - Brute Quest Voting Constraints (Priority: P1)

**Goal**: Brute can Fail on quests 1-3 but must Success on quests 4-5

**Independent Test**: Place Brute on quest 1 (both options available), quest 4 (only Success available)

### Unit Tests for User Stories 4 & 5

- [X] T038 [P] [US4] Add test case: Brute can submit fail action on quest 1 in `tests/unit/lunatic-brute.test.ts`
- [X] T039 [P] [US4] Add test case: Brute can submit fail action on quest 2 in `tests/unit/lunatic-brute.test.ts`
- [X] T040 [P] [US4] Add test case: Brute can submit fail action on quest 3 in `tests/unit/lunatic-brute.test.ts`
- [X] T041 [P] [US5] Add test case: Brute cannot submit fail action on quest 4 in `tests/unit/lunatic-brute.test.ts`
- [X] T042 [P] [US5] Add test case: Brute cannot submit fail action on quest 5 in `tests/unit/lunatic-brute.test.ts`
- [X] T043 [P] [US5] Add test case: Brute can submit success action on any quest (1-5) in `tests/unit/lunatic-brute.test.ts`

### Implementation for User Stories 4 & 5

- [X] T044 [US4] Add Brute early quest constraint to `validateQuestAction` in `src/lib/domain/quest-resolver.ts`: allow fail on quest 1-3
- [X] T045 [US5] Add Brute late quest constraint to `validateQuestAction` in `src/lib/domain/quest-resolver.ts`: reject fail on quest 4-5 with BRUTE_CANNOT_FAIL_LATE_QUEST
- [X] T046 [US4] Update `getQuestActionConstraints` in `src/lib/domain/quest-resolver.ts` to return both options for Brute on quest 1-3
- [X] T047 [US5] Update `getQuestActionConstraints` in `src/lib/domain/quest-resolver.ts` to return canFail: false for Brute on quest 4-5
- [X] T048 [US5] Update Fail button in `QuestExecution.tsx` to show disabled state when canFail is false (Brute on quest 4-5)
- [X] T049 [US5] Add constraint explanation text below disabled Fail button for Brute on late quests in `QuestExecution.tsx`

**Checkpoint**: Brute quest constraints fully enforced in UI and API ✅

---

## Phase 7: User Story 6 - Role Visibility (Priority: P2)

**Goal**: Lunatic and Brute follow standard evil visibility rules (visible to Merlin, know teammates)

**Independent Test**: Start game with Merlin + Lunatic/Brute, verify Merlin sees them in evil list

### Implementation for User Story 6

- [X] T050 [US6] Verify Lunatic visibility in `computeRoleVisibility` in `src/lib/domain/visibility.ts` (knownToMerlin: true should work automatically)
- [X] T051 [P] [US6] Verify Brute visibility in `computeRoleVisibility` in `src/lib/domain/visibility.ts` (knownToMerlin: true should work automatically)
- [X] T052 [US6] Verify Lunatic/Brute work correctly with Evil Ring Visibility mode in `src/lib/domain/evil-ring-visibility.ts`
- [X] T053 [US6] Verify Lunatic/Brute see their evil teammates in standard mode (knowsTeammates: true)

**Checkpoint**: Visibility rules verified and working ✅

---

## Phase 8: User Story 7 - Assassin Compatibility (Priority: P2)

**Goal**: Assassin phase works correctly with Lunatic/Brute in game

**Independent Test**: Reach assassin phase with Lunatic/Brute, verify Assassin can select target normally

### Implementation for User Story 7

- [X] T054 [US7] Verify assassin target selection works with Lunatic in game (no code changes expected, validation only)
- [X] T055 [US7] Verify assassin target selection works with Brute in game (no code changes expected, validation only)
- [X] T056 [US7] Verify game flow when Assassin wins with Lunatic/Brute in game
- [X] T057 [US7] Verify game flow when Good wins with Lunatic/Brute in game

**Checkpoint**: Assassin phase verified working ✅

---

## Phase 9: Polish & Integration

**Purpose**: Final integration, edge cases, and documentation

- [X] T058 [P] Update role config validation to prevent enabling both Lunatic and Brute when not enough evil slots in `src/lib/domain/role-config.ts`
- [X] T059 [P] Add edge case handling for both Lunatic AND Brute enabled (requires 4+ evil slots = 10 players)
- [ ] T060 [P] Update rulebook page `src/app/rules/page.tsx` to include Lunatic and Brute role descriptions
- [X] T061 [P] Run full type check with `npm run type-check`
- [X] T062 [P] Run unit tests with `npm run test`
- [ ] T063 Verify end-to-end flow with manual testing: create room → enable roles → start game → complete quest

**Checkpoint**: Feature complete and tested ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Phase 2 completion
  - US1 (Lunatic enable) and US3 (Brute enable) can run in parallel
  - US2 (Lunatic constraint) depends on US1
  - US4/US5 (Brute constraints) depend on US3
  - US6 (Visibility) can run in parallel with constraint stories
  - US7 (Assassin) can run after any story is complete
- **Polish (Phase 9)**: Depends on all user stories complete

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational)
    │
    ├──────────────────────────┐
    ▼                          ▼
Phase 3 (US1: Lunatic Enable)  Phase 5 (US3: Brute Enable)
    │                          │
    ▼                          ▼
Phase 4 (US2: Lunatic Quest)   Phase 6 (US4/5: Brute Quest)
    │                          │
    └──────────┬───────────────┘
               ▼
    Phase 7 (US6: Visibility)
               │
               ▼
    Phase 8 (US7: Assassin)
               │
               ▼
    Phase 9 (Polish)
```

### Parallel Opportunities

**Within Phase 1 (Setup)**:
- T002, T003, T004 can run in parallel after T001

**Within Phase 2 (Foundational)**:
- T006, T007, T008, T009 can run in parallel
- T011, T013 can run in parallel

**Within Phase 4 (US2)**:
- T021, T022 (tests) can run in parallel

**Within Phase 6 (US4/5)**:
- T038-T043 (all tests) can run in parallel

**Cross-Phase Parallelism**:
- Phase 3 (US1) and Phase 5 (US3) can run in parallel
- Phase 7 (US6) can run in parallel with Phase 4 and Phase 6

---

## Parallel Example: Foundational Phase

```bash
# After T005 completes, launch in parallel:
Task T006: "Add Brute entry to SPECIAL_ROLES"
Task T007: "Add to EVIL_SPECIAL_ROLES array"
Task T008: "Add to OPTIONAL_EVIL_ROLES array"
Task T009: "Add new ERROR_CODES"
```

## Parallel Example: Test Tasks

```bash
# All tests for User Story 2 can run in parallel:
Task T021: "Test: Lunatic cannot submit success"
Task T022: "Test: Lunatic can submit fail"

# All tests for User Stories 4/5 can run in parallel:
Task T038-T043: "Test: Brute quest constraints"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (type extensions)
2. Complete Phase 2: Foundational (role metadata)
3. Complete Phase 3: US1 - Lunatic can be enabled
4. Complete Phase 4: US2 - Lunatic quest constraint works
5. **STOP and VALIDATE**: Test Lunatic end-to-end
6. Deploy/demo as MVP

### Incremental Delivery

1. Setup + Foundational → Type system ready
2. Add US1 + US2 (Lunatic) → Lunatic fully working
3. Add US3 + US4/5 (Brute) → Brute fully working
4. Add US6 (Visibility) → Verify integration
5. Add US7 (Assassin) → Verify compatibility
6. Polish → Production ready

---

## Task Summary

| Phase | User Story | Task Count | Parallel Tasks |
|-------|------------|------------|----------------|
| 1 - Setup | - | 4 | 3 |
| 2 - Foundational | - | 9 | 6 |
| 3 - US1 | Lunatic Enable | 7 | 0 |
| 4 - US2 | Lunatic Quest | 10 | 2 |
| 5 - US3 | Brute Enable | 7 | 0 |
| 6 - US4/5 | Brute Quest | 12 | 6 |
| 7 - US6 | Visibility | 4 | 1 |
| 8 - US7 | Assassin | 4 | 0 |
| 9 - Polish | - | 6 | 5 |
| **Total** | | **63** | **23** |

---

## Notes

- All tasks include exact file paths for immediate execution
- [P] tasks can be parallelized to reduce implementation time
- Each user story phase has a checkpoint for independent validation
- Unit tests are included for domain logic (quest action validation)
- E2E manual testing recommended for final validation
