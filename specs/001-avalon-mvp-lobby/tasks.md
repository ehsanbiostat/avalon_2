# Tasks: Avalon Online – MVP Lobby & Role Distribution

**Input**: Design documents from `/specs/001-avalon-mvp-lobby/`
**Prerequisites**: plan.md ✅, spec.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: Constitution requires smoke tests for critical flows and unit tests for domain logic. Tests are included where specified.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## User Story Mapping

| Story | Title | Priority | Key Deliverables |
|-------|-------|----------|------------------|
| US1 | Create a Room | P1 | Room creation, manager assignment |
| US2 | View Active Rooms | P2 | Room list, real-time updates |
| US3 | Join a Room | P1 | Join by code, validation |
| US4 | Rejoin a Room | P2 | Reconnection handling |
| US5 | Room Lobby Experience | P1 | Real-time lobby, player list |
| US6 | Distribute Roles | P1 | Role assignment, private reveal |
| US7 | Confirm Role | P1 | Role confirmation tracking |
| US8 | Start Game | P2 | Game state transition |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Next.js 14+ project with App Router and TypeScript in project root
- [X] T002 Configure Tailwind CSS 3.x with globals.css in src/styles/globals.css
- [X] T003 [P] Configure ESLint and Prettier with strict TypeScript rules
- [X] T004 [P] Create .env.example with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- [X] T005 [P] Create base layout with providers in src/app/layout.tsx
- [X] T006 [P] Create shared TypeScript types in src/types/database.ts (from data-model.md)
- [X] T007 [P] Create room types in src/types/room.ts
- [X] T008 [P] Create player types in src/types/player.ts
- [X] T009 [P] Create role types in src/types/role.ts

**Checkpoint**: Project scaffolding complete, runs with `npm run dev`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Setup

- [X] T010 Create Supabase migration SQL file in supabase/migrations/001_initial_schema.sql
- [X] T011 Create RLS policies SQL file in supabase/migrations/002_rls_policies.sql
- [X] T012 Create database functions SQL in supabase/migrations/003_functions.sql (get_evil_teammates, cleanup_stale_rooms)
- [X] T013 Document Supabase setup steps in README.md

### Supabase Client Setup

- [X] T014 [P] Create browser Supabase client in src/lib/supabase/client.ts
- [X] T015 [P] Create server Supabase client (service role) in src/lib/supabase/server.ts

### Player Identity System

- [X] T016 Create player ID utility (localStorage UUID) in src/lib/utils/player-id.ts
- [X] T017 Create usePlayer hook in src/hooks/usePlayer.ts
- [X] T018 Create POST /api/players endpoint in src/app/api/players/route.ts
- [X] T019 [P] Create player queries module in src/lib/supabase/players.ts

### Shared Utilities

- [X] T020 [P] Create room code generator in src/lib/utils/room-code.ts
- [X] T021 [P] Create constants (role ratios, limits) in src/lib/utils/constants.ts
- [X] T022 [P] Create input validation module in src/lib/domain/validation.ts
- [X] T023 [P] Create error response utilities in src/lib/utils/errors.ts

### Base UI Components

- [X] T024 [P] Create Button component in src/components/ui/Button.tsx
- [X] T025 [P] Create Input component in src/components/ui/Input.tsx
- [X] T026 [P] Create Modal component in src/components/ui/Modal.tsx
- [X] T027 [P] Create Card component in src/components/ui/Card.tsx

### Unit Tests for Foundational Utilities

- [X] T028 [P] Create unit tests for room code generation in tests/unit/utils/room-code.test.ts
- [X] T029 [P] Create unit tests for validation module in tests/unit/domain/validation.test.ts

**Checkpoint**: Foundation ready - player can register nickname, Supabase connected

---

## Phase 3: User Story 1 - Create a Room (Priority: P1) 🎯 MVP

**Goal**: Players can create game rooms and become room manager

**Independent Test**: A single player can create a room and see themselves in an empty lobby with a shareable room code.

### Implementation for User Story 1

- [X] T030 [P] [US1] Create room queries module in src/lib/supabase/rooms.ts
- [X] T031 [US1] Implement POST /api/rooms endpoint (create room) in src/app/api/rooms/route.ts
- [X] T032 [US1] Create CreateRoomModal component in src/components/CreateRoomModal.tsx
- [X] T033 [US1] Create landing page with nickname input and create room button in src/app/page.tsx
- [X] T034 [US1] Add room creation flow integration (landing → lobby redirect)
- [X] T035 [US1] Add error handling for room creation (player count validation, player already in room)

**Checkpoint**: Player can enter nickname, create room, get room code

---

## Phase 4: User Story 3 - Join a Room (Priority: P1) 🎯 MVP

**Goal**: Players can join existing rooms by code

**Independent Test**: A player can enter a valid room code and appear in that room's lobby alongside other players.

### Implementation for User Story 3

- [X] T036 [US3] Implement POST /api/rooms/[code]/join endpoint in src/app/api/rooms/[code]/join/route.ts
- [X] T037 [US3] Create JoinRoomForm component in src/components/JoinRoomForm.tsx
- [X] T038 [US3] Add join by code form to landing page in src/app/page.tsx
- [X] T039 [US3] Handle join validation errors (room not found, room full, nickname taken)
- [X] T040 [US3] Implement rejoin detection (returning player recognition)

**Checkpoint**: Multiple players can join same room via code

---

## Phase 5: User Story 5 - Room Lobby Experience (Priority: P1) 🎯 MVP

**Goal**: Real-time lobby showing all players and room status

**Independent Test**: Multiple players in the same room all see identical, real-time lobby state.

### Implementation for User Story 5

- [X] T041 [US5] Implement GET /api/rooms/[code] endpoint in src/app/api/rooms/[code]/route.ts
- [X] T042 [US5] Create Lobby component in src/components/Lobby.tsx
- [X] T043 [US5] Create PlayerList component in src/components/PlayerList.tsx
- [X] T044 [US5] Create PlayerCard component in src/components/PlayerCard.tsx
- [X] T045 [US5] Create useRoom hook with Supabase Realtime in src/hooks/useRoom.ts
- [X] T046 [US5] Create useLobby hook for lobby-specific state in src/hooks/useLobby.ts
- [X] T047 [US5] Create room lobby page in src/app/rooms/[code]/page.tsx
- [X] T048 [US5] Implement "Copy Room Code" functionality in Lobby component
- [X] T049 [US5] Implement POST /api/rooms/[code]/leave endpoint in src/app/api/rooms/[code]/leave/route.ts
- [X] T050 [US5] Add leave room button to lobby
- [X] T051 [US5] Handle player disconnect/reconnect states (show "Disconnected" badge)

**Checkpoint**: Lobby updates in real-time (<2s), shows all players, manager badge visible

---

## Phase 6: User Story 6 - Distribute Roles (Priority: P1) 🎯 MVP

**Goal**: Manager can distribute roles to all players

**Independent Test**: The manager can trigger role distribution and each player receives a private role.

### Domain Logic

- [X] T052 [P] [US6] Implement role distribution algorithm in src/lib/domain/roles.ts
- [X] T053 [P] [US6] Create unit tests for role distribution in tests/unit/domain/roles.test.ts

### Implementation for User Story 6

- [X] T054 [US6] Create role queries module in src/lib/supabase/roles.ts
- [X] T055 [US6] Implement POST /api/rooms/[code]/distribute endpoint in src/app/api/rooms/[code]/distribute/route.ts
- [X] T056 [US6] Add "Distribute Roles" button to lobby (manager only, when room full)
- [X] T057 [US6] Create RoleRevealModal component in src/components/RoleRevealModal.tsx
- [X] T058 [US6] Implement GET /api/rooms/[code]/role endpoint in src/app/api/rooms/[code]/role/route.ts
- [X] T059 [US6] Create useRole hook in src/hooks/useRole.ts
- [X] T060 [US6] Show Evil teammates to Evil players in RoleRevealModal

**Checkpoint**: Roles assigned correctly per Avalon ratios, each player sees only their role

---

## Phase 7: User Story 7 - Confirm Role (Priority: P1) 🎯 MVP

**Goal**: Players confirm they have seen their role

**Independent Test**: Each player can confirm their role, and the system tracks confirmation status.

### Implementation for User Story 7

- [X] T061 [US7] Implement POST /api/rooms/[code]/confirm endpoint in src/app/api/rooms/[code]/confirm/route.ts
- [X] T062 [US7] Add "Confirm Role" button to RoleRevealModal
- [X] T063 [US7] Display confirmation progress in lobby ("X/Y players confirmed")
- [X] T064 [US7] Update useLobby hook to track confirmation status via Realtime

**Checkpoint**: All players can confirm roles, manager sees confirmation progress

---

## Phase 8: User Story 8 - Start Game (Priority: P2)

**Goal**: Manager can start game after all confirmations

**Independent Test**: Manager can click "Start Game" and all players see the game state transition.

### Implementation for User Story 8

- [X] T065 [US8] Implement room state transitions in src/lib/domain/room-state.ts
- [X] T066 [US8] Create unit tests for state transitions in tests/unit/domain/room-state.test.ts
- [X] T067 [US8] Implement POST /api/rooms/[code]/start endpoint in src/app/api/rooms/[code]/start/route.ts
- [X] T068 [US8] Add "Start Game" button to lobby (manager only, when all confirmed)
- [X] T069 [US8] Create GameStartedView component in src/components/GameStartedView.tsx
- [X] T070 [US8] Create game placeholder page in src/app/game/[code]/page.tsx
- [X] T071 [US8] Handle game started redirect for all players

**Checkpoint**: Full flow works: create → join → distribute → confirm → start

---

## Phase 9: User Story 2 - View Active Rooms (Priority: P2)

**Goal**: Players can browse and discover available rooms

**Independent Test**: A player can view the active rooms page and see room details without joining.

### Implementation for User Story 2

- [X] T072 [US2] Implement GET /api/rooms endpoint (list waiting rooms) in src/app/api/rooms/route.ts
- [X] T073 [US2] Create RoomList component in src/components/RoomList.tsx
- [X] T074 [US2] Create RoomCard component in src/components/RoomCard.tsx
- [X] T075 [US2] Create active rooms page in src/app/rooms/page.tsx
- [X] T076 [US2] Add real-time subscription for room list updates
- [X] T077 [US2] Add "Join" button to RoomCard (connects to US3 join flow)
- [X] T078 [US2] Handle empty state ("No active rooms. Create one!")

**Checkpoint**: Room list shows all waiting rooms, updates in real-time

---

## Phase 10: User Story 4 - Rejoin a Room (Priority: P2)

**Goal**: Disconnected players can rejoin their room

**Independent Test**: A player can close their browser, reopen the app, and rejoin their previous room with the same identity.

### Implementation for User Story 4

- [X] T079 [US4] Enhance join endpoint to handle rejoin logic in src/app/api/rooms/[code]/join/route.ts
- [X] T080 [US4] Implement grace period tracking for disconnected players
- [X] T081 [US4] Add manager transfer logic when manager disconnects past grace period
- [X] T082 [US4] Update PlayerCard to show "Disconnected" state
- [X] T083 [US4] Handle reconnection via Realtime subscription

**Checkpoint**: Disconnected players can rejoin, manager transfers if needed

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Error Handling & UX

- [X] T084 Implement consistent error handling across all API routes
- [X] T085 Add user-friendly error messages (per contracts/api.md error codes)
- [X] T086 [P] Add loading states for all async operations
- [X] T087 [P] Add form validation feedback in all input components

### Mobile & Responsive

- [X] T088 Mobile responsiveness pass for landing page
- [X] T089 [P] Mobile responsiveness pass for lobby page
- [X] T090 [P] Mobile responsiveness pass for room list page

### Cleanup & Observability

- [X] T091 Implement room cleanup job trigger (24h/48h inactivity)
- [X] T092 Add structured logging for key events (room created, player joined, roles distributed)

### Final Testing

- [X] T093 E2E smoke test: create room flow in tests/e2e/create-room.spec.ts
- [X] T094 [P] E2E smoke test: join room flow in tests/e2e/join-room.spec.ts
- [X] T095 [P] E2E smoke test: role distribution flow in tests/e2e/role-distribution.spec.ts
- [X] T096 Run full quickstart.md validation

**Checkpoint**: MVP ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── BLOCKS ALL USER STORIES
    │
    ├──────────────────────────────────────────────────────┐
    │                                                      │
    ▼                                                      ▼
Phase 3 (US1: Create Room) ◄─────────────────────── Phase 9 (US2: View Rooms)
    │                                                      │
    ▼                                                      │
Phase 4 (US3: Join Room) ◄─────────────────────────────────┘
    │
    ▼
Phase 5 (US5: Lobby) ◄──────────────────────────── Phase 10 (US4: Rejoin)
    │
    ▼
Phase 6 (US6: Distribute Roles)
    │
    ▼
Phase 7 (US7: Confirm Role)
    │
    ▼
Phase 8 (US8: Start Game)
    │
    ▼
Phase 11 (Polish)
```

### User Story Dependencies

- **US1 (Create Room)**: Can start after Phase 2 - Foundation for all other stories
- **US3 (Join Room)**: Depends on US1 (rooms must exist to join)
- **US5 (Lobby)**: Depends on US1 + US3 (players must be in room)
- **US6 (Distribute)**: Depends on US5 (requires full lobby)
- **US7 (Confirm)**: Depends on US6 (requires roles to confirm)
- **US8 (Start)**: Depends on US7 (requires all confirmations)
- **US2 (View Rooms)**: Can start after Phase 2, independent of US1
- **US4 (Rejoin)**: Can start after US5, extends join logic

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:

**Phase 1 Parallel**: T003, T004, T005, T006, T007, T008, T009
**Phase 2 Parallel**: T014/T015, T019, T020, T021, T022, T023, T024, T025, T026, T027, T028, T029
**Phase 6 Parallel**: T052, T053
**Phase 11 Parallel**: T086/T087, T088/T089/T090, T093/T094/T095

---

## Parallel Example: Phase 2 Foundation

```bash
# Launch database setup sequentially:
T010 → T011 → T012 → T013

# Launch these in parallel while DB setup completes:
T014 (browser client) | T015 (server client)
T020 (room code) | T021 (constants) | T022 (validation) | T023 (errors)
T024 (Button) | T025 (Input) | T026 (Modal) | T027 (Card)
T028 (room code tests) | T029 (validation tests)

# Then sequentially:
T016 → T017 → T018 → T019
```

---

## Implementation Strategy

### MVP First (Phases 1-7)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phases 3-7: Core user stories (US1, US3, US5, US6, US7)
4. **STOP and VALIDATE**: Full create → join → distribute → confirm flow works
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Create Room) → Can create rooms
3. Add US3 (Join Room) → Can join rooms
4. Add US5 (Lobby) → Real-time lobby works
5. Add US6 + US7 (Roles) → Role distribution works
6. Add US8 (Start Game) → Complete pre-game flow
7. Add US2 (View Rooms) → Discovery feature
8. Add US4 (Rejoin) → Reconnection handling
9. Polish → Production ready

### Task Count Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| 1. Setup | 9 | 7 |
| 2. Foundational | 20 | 14 |
| 3. US1 Create Room | 6 | 1 |
| 4. US3 Join Room | 5 | 0 |
| 5. US5 Lobby | 11 | 0 |
| 6. US6 Distribute | 9 | 2 |
| 7. US7 Confirm | 4 | 0 |
| 8. US8 Start Game | 7 | 1 |
| 9. US2 View Rooms | 7 | 0 |
| 10. US4 Rejoin | 5 | 0 |
| 11. Polish | 13 | 7 |
| **Total** | **96** | **32** |

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP scope: Phases 1-7 (create, join, lobby, distribute, confirm)
- Tests are included per constitution requirements (smoke tests, unit tests for domain logic)
