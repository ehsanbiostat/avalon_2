# Tasks: Avalon Online – Phase 2: Special Roles & Configurations

**Input**: Design documents from `/specs/002-avalon-special-roles/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/api.md ✅
**Depends On**: MVP (001-avalon-mvp-lobby) ✅ Complete

**Tests**: Constitution requires unit tests for domain logic and smoke tests for critical flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## User Story Mapping

| Story | Title | Priority | Key Deliverables |
|-------|-------|----------|------------------|
| US1 | Configure Game Roles | P1 | Role config UI, validation, storage |
| US2 | Lady of the Lake Setup | P2 | Token designation, display |
| US3 | View Active Roles | P1 | Roles in play display |
| US4 | Percival Role Reveal | P1 | Merlin candidates visibility |
| US5 | Morgana Role Reveal | P1 | Disguise ability messaging |
| US6 | Mordred Role Reveal | P1 | Hidden from Merlin messaging |
| US7 | Oberon Role Reveal | P1 | Standard/Chaos mode display |
| US8 | Updated Merlin Reveal | P1 | Visibility matrix for Merlin |

---

## Phase 1: Setup (Database & Types)

**Purpose**: Schema ready, types defined for Phase 2

- [X] T001 Create database migration in supabase/migrations/006_special_roles_config.sql
- [ ] T002 Run migration on Supabase via SQL Editor (verify enum extension works)
- [X] T003 [P] Create role configuration types in src/types/role-config.ts
- [X] T004 [P] Update database types to include new fields in src/types/database.ts
- [X] T005 [P] Update role types with new special roles in src/types/role.ts
- [X] T006 [P] Add role definitions to constants in src/lib/utils/constants.ts

**Checkpoint**: Database accepts new columns, TypeScript compiles

---

## Phase 2: Foundational (Domain Logic - Blocking)

**Purpose**: Core validation and visibility logic MUST be complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Role Configuration Validation

- [X] T007 Create validateRoleConfig function in src/lib/domain/role-config.ts
- [X] T008 Create getRolesForConfig function in src/lib/domain/role-config.ts
- [X] T009 Create getDefaultConfig function in src/lib/domain/role-config.ts
- [X] T010 Create computeRolesInPlay helper in src/lib/domain/role-config.ts
- [X] T011 [P] Create unit tests for role-config in tests/unit/domain/role-config.test.ts

### Visibility Matrix Logic

- [X] T012 Create getVisibilityForRole function in src/lib/domain/visibility.ts
- [X] T013 Create getMerlinVisibility (sees evil except Mordred/Oberon Chaos) in src/lib/domain/visibility.ts
- [X] T014 Create getPercivalVisibility (Merlin candidates) in src/lib/domain/visibility.ts
- [X] T015 Create getEvilVisibility (teammates except Oberon) in src/lib/domain/visibility.ts
- [X] T016 Create getOberonVisibility (Standard vs Chaos modes) in src/lib/domain/visibility.ts
- [X] T017 [P] Create unit tests for basic visibility functions (individual role visibility) in tests/unit/domain/visibility.test.ts

### Role Distribution Updates

- [X] T018 Update distributeRoles to accept roleConfig parameter in src/lib/domain/roles.ts
- [X] T019 Create generateRolePool function for config-based distribution in src/lib/domain/roles.ts
- [ ] T020 [P] Update existing role distribution tests in tests/unit/domain/roles.test.ts

**Checkpoint**: Domain logic validated with tests, visibility matrix correct for all combinations

---

## Phase 3: User Story 1 - Configure Game Roles (Priority: P1) 🎯

**Goal**: Room managers can select which special roles to include when creating a room

**Independent Test**: Room manager can create a room with a custom role configuration

### API Updates for US1

- [X] T021 [US1] Update POST /api/rooms to accept role_config in src/app/api/rooms/route.ts
- [X] T022 [US1] Add role config validation in POST /api/rooms in src/app/api/rooms/route.ts
- [X] T023 [US1] Store role_config in database when creating room in src/lib/supabase/rooms.ts
- [X] T024 [US1] Create POST /api/rooms/validate-config endpoint in src/app/api/rooms/validate-config/route.ts

### UI Components for US1

- [X] T025 [P] [US1] Create RoleConfigPanel component in src/components/RoleConfigPanel.tsx
- [X] T026 [P] [US1] Create RoleConfigSummary component in src/components/RoleConfigSummary.tsx
- [X] T027 [US1] Update CreateRoomModal to include role configuration in src/components/CreateRoomModal.tsx
- [X] T028 [US1] Add Oberon mode toggle (Standard/Chaos) to RoleConfigPanel in src/components/RoleConfigPanel.tsx
- [X] T029 [US1] Add validation warnings display to RoleConfigPanel in src/components/RoleConfigPanel.tsx
- [X] T029a [US1] Add balance recommendations (e.g., "Percival works best with Morgana") to RoleConfigPanel in src/components/RoleConfigPanel.tsx
- [X] T029b [US1] Re-validate role_config when expected_players changes in src/components/RoleConfigPanel.tsx
- [X] T030 [US1] Update landing page to pass role_config to API in src/app/page.tsx

**Checkpoint**: Manager can configure and create room with custom roles

---

## Phase 4: User Story 3 - View Active Roles (Priority: P1) 🎯

**Goal**: All players can see which roles are active in their game

**Independent Test**: All players in a room can see the list of active roles

### API Updates for US3

- [ ] T031 [US3] Update GET /api/rooms/[code] to include roles_in_play in src/app/api/rooms/[code]/route.ts
- [ ] T032 [US3] Add role_config to room details response in src/lib/supabase/rooms.ts

### UI Components for US3

- [ ] T033 [P] [US3] Create RolesInPlay component in src/components/RolesInPlay.tsx
- [ ] T034 [US3] Update Lobby to display RolesInPlay section in src/components/Lobby.tsx
- [ ] T035 [US3] Show Oberon mode indicator (Standard/Chaos) in RolesInPlay in src/components/RolesInPlay.tsx
- [ ] T036 [US3] Update useRoom hook to include role_config in src/hooks/useRoom.ts

**Checkpoint**: All players see roles in play before and after distribution

---

## Phase 5: User Story 2 - Lady of the Lake Setup (Priority: P2)

**Goal**: Room managers can enable Lady of the Lake and players see who holds it

**Independent Test**: Lady of the Lake holder is correctly designated and displayed

### Domain Logic for US2

- [ ] T037 [US2] Create designateLadyOfLakeHolder function in src/lib/domain/role-config.ts
- [ ] T038 [US2] Add Lady of Lake designation to role distribution in src/lib/domain/roles.ts

### API Updates for US2

- [ ] T039 [US2] Update POST /api/rooms/[code]/distribute to set Lady holder in src/app/api/rooms/[code]/distribute/route.ts
- [ ] T040 [US2] Update room database functions for Lady of Lake in src/lib/supabase/rooms.ts
- [ ] T041 [US2] Include lady_of_lake_holder_id in room details in src/app/api/rooms/[code]/route.ts

### UI Components for US2

- [ ] T042 [P] [US2] Create LadyOfLakeBadge component in src/components/LadyOfLakeBadge.tsx
- [ ] T043 [US2] Add Lady of Lake toggle to RoleConfigPanel in src/components/RoleConfigPanel.tsx
- [ ] T044 [US2] Add player count warning (<7 players) for Lady in src/components/RoleConfigPanel.tsx
- [ ] T045 [US2] Display Lady of Lake holder badge in Lobby in src/components/Lobby.tsx
- [ ] T046 [US2] Show Lady of Lake designation on holder's role card in src/components/RoleRevealModal.tsx

**Checkpoint**: Lady of Lake holder correctly designated and displayed

---

## Phase 6: User Story 4 - Percival Role Reveal (Priority: P1) 🎯

**Goal**: Percival sees Merlin candidates (Merlin + Morgana) without knowing which is real

**Independent Test**: Percival sees exactly the correct players marked as "Merlin candidates"

### API Updates for US4

- [ ] T047 [US4] Update GET /api/rooms/[code]/role for Percival in src/app/api/rooms/[code]/role/route.ts
- [ ] T048 [US4] Add getMerlinCandidates to role queries in src/lib/supabase/roles.ts

### UI Updates for US4

- [ ] T049 [US4] Add Percival-specific role reveal content in src/components/RoleRevealModal.tsx
- [ ] T050 [US4] Show "One of these is Merlin" label for Percival in src/components/RoleRevealModal.tsx
- [ ] T051 [US4] Handle edge case: Percival without Morgana (sees only Merlin) in src/components/RoleRevealModal.tsx

**Checkpoint**: Percival sees correct Merlin candidates with proper messaging

---

## Phase 7: User Story 5 - Morgana Role Reveal (Priority: P1) 🎯

**Goal**: Morgana knows she appears as Merlin to Percival

**Independent Test**: Morgana sees evil teammates and disguise ability note

### API Updates for US5

- [ ] T052 [US5] Update GET /api/rooms/[code]/role for Morgana in src/app/api/rooms/[code]/role/route.ts

### UI Updates for US5

- [ ] T053 [US5] Add Morgana-specific role reveal content in src/components/RoleRevealModal.tsx
- [ ] T054 [US5] Show "You appear as Merlin to Percival" ability note in src/components/RoleRevealModal.tsx
- [ ] T055 [US5] Handle edge case: Morgana without Percival (note about no effect) in src/components/RoleRevealModal.tsx

**Checkpoint**: Morgana sees correct information with disguise note

---

## Phase 8: User Story 6 - Mordred Role Reveal (Priority: P1) 🎯

**Goal**: Mordred knows they are hidden from Merlin

**Independent Test**: Mordred sees evil teammates and hidden status note

### API Updates for US6

- [ ] T056 [US6] Update GET /api/rooms/[code]/role for Mordred in src/app/api/rooms/[code]/role/route.ts

### UI Updates for US6

- [ ] T057 [US6] Add Mordred-specific role reveal content in src/components/RoleRevealModal.tsx
- [ ] T058 [US6] Show "Merlin does not know you are evil" ability note in src/components/RoleRevealModal.tsx

**Checkpoint**: Mordred sees correct information with hidden status note

---

## Phase 9: User Story 7 - Oberon Role Reveal (Priority: P1) 🎯

**Goal**: Oberon sees mode-specific information (Standard vs Chaos)

**Independent Test**: Oberon sees appropriate information based on variant mode

### API Updates for US7

- [ ] T059 [US7] Update GET /api/rooms/[code]/role for Oberon Standard in src/app/api/rooms/[code]/role/route.ts
- [ ] T060 [US7] Update GET /api/rooms/[code]/role for Oberon Chaos in src/app/api/rooms/[code]/role/route.ts

### UI Updates for US7

- [ ] T061 [US7] Add Oberon Standard role reveal content in src/components/RoleRevealModal.tsx
- [ ] T062 [US7] Add Oberon Chaos role reveal content in src/components/RoleRevealModal.tsx
- [ ] T063 [US7] Show mode-specific messaging (Merlin visibility warning) in src/components/RoleRevealModal.tsx

**Checkpoint**: Oberon sees correct mode-specific information

---

## Phase 10: User Story 8 - Updated Merlin Reveal (Priority: P1) 🎯

**Goal**: Merlin sees only evil players visible to them (excludes Mordred, Oberon Chaos)

**Independent Test**: Merlin's visible evil list correctly excludes hidden roles

### API Updates for US8

- [ ] T064 [US8] Update GET /api/rooms/[code]/role to use visibility matrix for Merlin in src/app/api/rooms/[code]/role/route.ts
- [ ] T065 [US8] Add hidden_evil_count to Merlin response in src/app/api/rooms/[code]/role/route.ts
- [ ] T066 [US8] Update getPlayersVisibleToMerlin in src/lib/supabase/roles.ts

### UI Updates for US8

- [ ] T067 [US8] Update Merlin role reveal to show hidden count warning in src/components/RoleRevealModal.tsx
- [ ] T068 [US8] Show "X evil players are hidden from you!" when applicable in src/components/RoleRevealModal.tsx

**Checkpoint**: Merlin sees correct evil players with hidden count warning

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Error Handling & UX

- [ ] T069 Add error handling for invalid role configs in: POST /api/rooms, POST /api/rooms/[code]/distribute, POST /api/rooms/validate-config
- [ ] T070 [P] Add loading states for role configuration in src/components/RoleConfigPanel.tsx
- [ ] T071 [P] Add form validation feedback for role config in src/components/RoleConfigPanel.tsx

### Mobile & Responsive

- [ ] T072 [P] Mobile responsiveness pass for RoleConfigPanel in src/components/RoleConfigPanel.tsx
- [ ] T073 [P] Mobile responsiveness pass for RolesInPlay in src/components/RolesInPlay.tsx
- [ ] T074 [P] Mobile responsiveness pass for updated RoleRevealModal in src/components/RoleRevealModal.tsx

### Final Testing

- [ ] T075 E2E smoke test: role configuration flow in tests/e2e/role-config.spec.ts
- [ ] T076 [P] Comprehensive test: all 20+ visibility combinations (Merlin+Mordred, Merlin+Oberon, etc.) in tests/unit/domain/visibility.test.ts
- [ ] T077 [P] Integration test: Lady of Lake designation in tests/unit/domain/role-config.test.ts
- [ ] T078 Verify backward compatibility with default (MVP) config

**Checkpoint**: Phase 2 feature complete

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup: Database & Types)
    │
    ▼
Phase 2 (Foundational: Domain Logic) ─── BLOCKS ALL USER STORIES
    │
    ├──────────────────────────────────────────────────────┐
    │                                                      │
    ▼                                                      ▼
Phase 3 (US1: Configure Roles)                   Phase 5 (US2: Lady of Lake)
    │                                                      │
    ▼                                                      │
Phase 4 (US3: View Active Roles) ◄─────────────────────────┘
    │
    ├──────────────────────────────────────────────────────┐
    │                                                      │
    ▼                                                      │
Phase 6 (US4: Percival)                                    │
    │                                                      │
    ▼                                                      │
Phase 7 (US5: Morgana)                                     │
    │                                                      │
    ▼                                                      │
Phase 8 (US6: Mordred)                                     │
    │                                                      │
    ▼                                                      │
Phase 9 (US7: Oberon)                                      │
    │                                                      │
    ▼                                                      │
Phase 10 (US8: Merlin Update) ◄────────────────────────────┘
    │
    ▼
Phase 11 (Polish)
```

### User Story Dependencies

- **US1 (Configure Roles)**: Can start after Phase 2 - Foundation for all other stories
- **US3 (View Roles)**: Depends on US1 (rooms must have role_config)
- **US2 (Lady of Lake)**: Can start after Phase 2, independent of US1
- **US4-US8 (Role Reveals)**: Depend on US1 + visibility matrix from Phase 2
- **US8 (Merlin Update)**: Should be last as it validates entire visibility system

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:

**Phase 1 Parallel**: T003, T004, T005, T006
**Phase 2 Parallel**: T011, T017, T020
**Phase 3 Parallel**: T025, T026
**Phase 4 Parallel**: T033
**Phase 5 Parallel**: T042
**Phase 11 Parallel**: T070/T071, T072/T073/T074, T075/T076/T077

---

## Parallel Example: Phase 2 Foundation

```bash
# Launch sequentially:
T007 → T008 → T009 → T010

# Launch in parallel:
T011 (role-config tests) | T012 → T013 → T014 → T015 → T016 → T017 (visibility)

# Then:
T018 → T019 → T020
```

---

## Implementation Strategy

### MVP First (Phases 1-4)

1. Complete Phase 1: Database & Types
2. Complete Phase 2: Domain Logic (CRITICAL - blocks all stories)
3. Complete Phase 3: US1 - Configure Roles (core feature)
4. Complete Phase 4: US3 - View Active Roles
5. **STOP and VALIDATE**: Manager can configure roles, all players see roles in play
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Configure Roles) → Can configure roles
3. Add US3 (View Roles) → Can see roles in play
4. Add US2 (Lady of Lake) → Token designation works
5. Add US4-US8 (Role Reveals) → All character reveals work
6. Polish → Production ready

### Task Count Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| 1. Setup | 6 | 4 |
| 2. Foundational | 14 | 3 |
| 3. US1 Configure Roles | 12 | 2 |
| 4. US3 View Roles | 6 | 1 |
| 5. US2 Lady of Lake | 10 | 1 |
| 6. US4 Percival | 5 | 0 |
| 7. US5 Morgana | 4 | 0 |
| 8. US6 Mordred | 3 | 0 |
| 9. US7 Oberon | 5 | 0 |
| 10. US8 Merlin | 5 | 0 |
| 11. Polish | 10 | 6 |
| **Total** | **80** | **17** |

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP scope: Phases 1-4 (setup, foundation, configure roles, view roles)
- Tests are included per constitution requirements
- All changes are backward compatible with MVP functionality

