# Tasks: Player Recovery & Reconnection

**Feature**: 006-player-reconnection
**Branch**: `006-player-reconnection`
**Generated**: 2025-12-05
**Total Tasks**: 78

> **Note**: Plan.md has 13 implementation phases; this tasks.md consolidates them into 10 phases by merging related plan phases (e.g., Plan Phases 6+7 → Tasks Phase 3 "US1", Plan Phases 4+5 → Tasks Phase 4 "US4").

---

## User Story Summary

| Story | Priority | Description | Task Count |
|-------|----------|-------------|------------|
| US1 | P1 | Register with Unique Nickname | 12 |
| US2 | P1 | Reclaim Seat After Disconnect | 10 |
| US3 | P1 | Disconnect Detection | 8 |
| US4 | P2 | Activity Heartbeat | 8 |
| US5 | P2 | Rejoin from Home Page | 10 |
| US6 | P2 | Prevent Seat Stealing | 6 |
| Setup | - | Project initialization | 8 |
| Foundational | - | Shared prerequisites | 8 |
| Session Takeover | - | Old session notification | 6 |
| Polish | - | Cross-cutting concerns | 2 |

---

## Phase 1: Setup

**Goal**: Database schema and project infrastructure

### Database Migration

- [x] T001 Create migration file `supabase/migrations/010_player_reconnection.sql`
- [x] T002 Add `last_activity_at` column to players table in `supabase/migrations/010_player_reconnection.sql`
- [x] T003 Add `nickname_lower` generated column with UNIQUE index in `supabase/migrations/010_player_reconnection.sql`
- [x] T004 Create `check_nickname_available` function in `supabase/migrations/010_player_reconnection.sql`
- [x] T005 Create `find_player_in_room` function in `supabase/migrations/010_player_reconnection.sql`
- [x] T006 Create `reclaim_seat` function in `supabase/migrations/010_player_reconnection.sql`
- [x] T007 Add backfill query for existing players in `supabase/migrations/010_player_reconnection.sql`
- [x] T008 Add activity index `players_last_activity_idx` in `supabase/migrations/010_player_reconnection.sql`

---

## Phase 2: Foundational

**Goal**: TypeScript types and domain logic (blocking prerequisites)

### TypeScript Types

- [x] T009 [P] Update Player interface with `last_activity_at` and `nickname_lower` in `src/types/database.ts`
- [x] T010 [P] Create new file `src/types/player.ts` with ConnectionStatus and ReclaimResult interfaces
- [x] T011 [P] Add API request/response types for player endpoints in `src/types/player.ts`

### Domain Logic

- [x] T012 [P] Create `src/lib/domain/connection-status.ts` with constants for thresholds
- [x] T013 Create `getConnectionStatus(lastActivityAt)` function in `src/lib/domain/connection-status.ts`
- [x] T014 Create `canReclaimSeat(lastActivityAt)` function in `src/lib/domain/connection-status.ts`
- [x] T015 [P] Create `src/lib/domain/nickname-validation.ts` with validation constants
- [x] T016 Create `validateNickname(nickname)` function in `src/lib/domain/nickname-validation.ts`

---

## Phase 3: US1 - Register with Unique Nickname

**Story**: As a new player, I must choose a globally unique nickname when first using the app, so my identity can be recovered later if I lose my browser session.

**Independent Test**: New player enters nickname → System validates uniqueness → Player registered or shown "nickname taken" error.

### API Endpoints

- [x] T017 [US1] Create `src/app/api/players/check-nickname/route.ts` for GET endpoint
- [x] T018 [US1] Implement nickname availability check using `check_nickname_available` function in `src/app/api/players/check-nickname/route.ts`
- [x] T019 [US1] Create `src/app/api/players/register/route.ts` for POST endpoint
- [x] T020 [US1] Implement registration with uniqueness validation in `src/app/api/players/register/route.ts`
- [x] T021 [US1] Return proper error codes (409 NICKNAME_TAKEN, 400 INVALID_NICKNAME) in `src/app/api/players/register/route.ts`

### Data Layer

- [x] T022 [US1] Add `checkNicknameAvailable(nickname)` function to `src/lib/supabase/players.ts`
- [x] T023 [US1] Add `registerPlayer(playerId, nickname)` function to `src/lib/supabase/players.ts`
- [x] T024 [US1] Update `upsertPlayer` to validate uniqueness in `src/lib/supabase/players.ts`

### UI Components

- [x] T025 [US1] Create `src/components/NicknameRegistration.tsx` component with form
- [x] T026 [US1] Add real-time nickname availability check (debounced) in `src/components/NicknameRegistration.tsx`
- [x] T027 [US1] Show validation errors and "taken" state in `src/components/NicknameRegistration.tsx`
- [x] T028 [US1] Update `src/app/page.tsx` to show registration modal if no localStorage player

---

## Phase 4: US4 - Activity Heartbeat

**Story**: As a player in a room or game, my connection status should be tracked automatically so disconnects are detected without manual action.

**Independent Test**: Player is active → System records activity → Player goes idle → Marked as disconnected after timeout.

### API Endpoint

- [x] T029 [US4] Create `src/app/api/players/heartbeat/route.ts` for POST endpoint
- [x] T030 [US4] Implement `last_activity_at` update in `src/app/api/players/heartbeat/route.ts`
- [x] T031 [US4] Handle missing player gracefully (return 404) in `src/app/api/players/heartbeat/route.ts`

### Data Layer

- [x] T032 [US4] Add `updatePlayerActivity(playerId)` function to `src/lib/supabase/players.ts`

### Client Hook

- [x] T033 [US4] Create `src/hooks/useHeartbeat.ts` hook with 30-second interval
- [x] T034 [US4] Handle tab visibility changes (send heartbeat on tab focus) in `src/hooks/useHeartbeat.ts`
- [x] T035 [US4] Integrate useHeartbeat hook in `src/app/room/[code]/page.tsx`
- [x] T036 [US4] Integrate useHeartbeat hook in `src/app/game/[gameId]/page.tsx`

---

## Phase 5: US3 - Disconnect Detection

**Story**: As a player in a game, I want to see when other players disconnect so I know if the game can continue or if we're waiting for someone.

**Independent Test**: Player closes browser → Other players see them marked as "Disconnected" within 60 seconds.

### API Updates

- [x] T037 [US3] Update room details API to include player `last_activity_at` in `src/app/api/rooms/[code]/route.ts`
- [x] T038 [US3] Compute and return `is_connected` and `seconds_since_activity` per player in `src/app/api/rooms/[code]/route.ts`
- [x] T039 [US3] Update game state API to include player activity status in `src/app/api/games/[gameId]/route.ts`
- [x] T040 [US3] Compute and return `is_connected` per player in game response in `src/app/api/games/[gameId]/route.ts`

### UI Components

- [x] T041 [US3] Create `src/components/DisconnectedBadge.tsx` component for disconnect indicator
- [x] T042 [US3] Update `src/components/game/PlayerSeats.tsx` to show disconnect status
- [x] T043 [US3] Style disconnected players with grayed-out appearance in `src/components/game/PlayerSeats.tsx`
- [x] T044 [US3] Update room lobby player list to show disconnect status in `src/app/room/[code]/page.tsx`

---

## Phase 6: US2 - Reclaim Seat After Disconnect

**Story**: As a player who lost my browser session (different device/browser), I want to reclaim my seat in an ongoing game by entering my unique nickname and room code.

**Independent Test**: Player disconnects → Opens different browser → Enters room code + nickname → Reclaims seat → Can continue playing.

### API Endpoint

- [x] T045 [US2] Create `src/app/api/rooms/[code]/reclaim/route.ts` for POST endpoint
- [x] T046 [US2] Validate request has nickname and x-player-id header in `src/app/api/rooms/[code]/reclaim/route.ts`
- [x] T047 [US2] Call `reclaim_seat` database function in `src/app/api/rooms/[code]/reclaim/route.ts`
- [x] T048 [US2] Handle error codes (PLAYER_NOT_FOUND, PLAYER_ACTIVE, GRACE_PERIOD) in `src/app/api/rooms/[code]/reclaim/route.ts`
- [x] T049 [US2] Return success response with room/game info in `src/app/api/rooms/[code]/reclaim/route.ts`

### Data Layer

- [x] T050 [US2] Add `reclaimSeat(roomCode, nickname, newPlayerId)` wrapper function to `src/lib/supabase/players.ts`

### UI Components

- [x] T051 [US2] Create `src/components/ReclaimConfirmation.tsx` modal component
- [x] T052 [US2] Show reclaim prompt when joining room with existing nickname in `src/components/ReclaimConfirmation.tsx`
- [x] T053 [US2] Handle reclaim success (redirect to room/game) in `src/components/ReclaimConfirmation.tsx`
- [x] T054 [US2] Handle reclaim failure (show error message) in `src/components/ReclaimConfirmation.tsx`

---

## Phase 7: US6 - Prevent Seat Stealing

**Story**: As a legitimate player, I want protection against someone else claiming my seat while I'm still actively playing.

**Independent Test**: Player A is actively playing → Player B tries to reclaim A's seat → B is denied because A is active.

### Server-Side Validation

- [x] T055 [US6] Ensure reclaim API checks `last_activity_at < NOW() - 60s` in `src/app/api/rooms/[code]/reclaim/route.ts`
- [x] T056 [US6] Ensure reclaim API enforces 30-second grace period in `src/app/api/rooms/[code]/reclaim/route.ts`
- [x] T057 [US6] Return `grace_period_remaining` in error response in `src/app/api/rooms/[code]/reclaim/route.ts`

### UI Feedback

- [x] T058 [US6] Show "Player is currently active" error in `src/components/ReclaimConfirmation.tsx`
- [x] T059 [US6] Show "Please wait X seconds" countdown for grace period in `src/components/ReclaimConfirmation.tsx`
- [x] T060 [US6] Auto-retry reclaim after grace period expires in `src/components/ReclaimConfirmation.tsx`

---

## Phase 8: US5 - Rejoin from Home Page

**Story**: As a player who lost my session, I want to find and rejoin my active game from the home page without needing to remember the room code.

**Independent Test**: Player loses session → Opens app in new browser → Enters nickname → Sees "You have an active game in room [CODE]" → Can rejoin.

### API Endpoint

- [x] T061 [US5] Create `src/app/api/players/find-game/route.ts` for GET endpoint
- [x] T062 [US5] Query active rooms for player by nickname in `src/app/api/players/find-game/route.ts`
- [x] T063 [US5] Return room info, status, and reclaim eligibility in `src/app/api/players/find-game/route.ts`

### Data Layer

- [x] T064 [US5] Add `findActiveGameByNickname(nickname)` function to `src/lib/supabase/players.ts`

### UI Components

- [x] T065 [US5] Create `src/components/FindMyGame.tsx` component with nickname input
- [x] T066 [US5] Show search results with room code and status in `src/components/FindMyGame.tsx`
- [x] T067 [US5] Add "Rejoin" button that triggers reclaim flow in `src/components/FindMyGame.tsx`
- [x] T068 [US5] Show "No active games found" message if none found in `src/components/FindMyGame.tsx`
- [x] T069 [US5] Add FindMyGame section to `src/app/page.tsx`
- [x] T070 [US5] Handle reclaim success (redirect to room/game) from FindMyGame in `src/app/page.tsx`

---

## Phase 9: Session Takeover Detection

**Story**: Old session must be notified when their seat is reclaimed by another device.

### Client Detection

- [x] T071 Create `src/components/SessionTakeoverAlert.tsx` component
- [x] T072 Update `src/hooks/useRoomState.ts` to detect player removal from room
- [x] T073 Update `src/hooks/useGameState.ts` to detect player removal from game
- [x] T074 Show "Session taken over by another device" message in `src/components/SessionTakeoverAlert.tsx`
- [x] T075 Clear localStorage room reference on session takeover in `src/hooks/useRoomState.ts`
- [x] T076 Redirect to home page after acknowledgment in `src/components/SessionTakeoverAlert.tsx`

---

## Phase 10: Polish & Cross-Cutting

**Goal**: Final integration, error handling, and edge cases

- [x] T077 Add error boundary for registration flow in `src/app/page.tsx`
- [x] T078 Ensure all API errors have user-friendly messages across all new endpoints

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
    ├── Phase 3 (US1: Registration) ─────────────┐
    │                                            │
    ├── Phase 4 (US4: Heartbeat) ────┐           │
    │                                ↓           │
    │                        Phase 5 (US3: Disconnect Detection)
    │                                            │
    └── Phase 6 (US2: Reclaim) ←─────────────────┘
            ↓
    Phase 7 (US6: Prevent Stealing)
            ↓
    Phase 8 (US5: Find My Game)
            ↓
    Phase 9 (Session Takeover)
            ↓
    Phase 10 (Polish)
```

### Story Dependencies

| Story | Depends On | Reason |
|-------|------------|--------|
| US1 | Setup, Foundational | Needs DB schema and types |
| US4 | Setup, Foundational | Needs `last_activity_at` column |
| US3 | US4 | Needs heartbeat to detect activity |
| US2 | US1, US3 | Needs unique nicknames and disconnect status |
| US6 | US2 | Built into reclaim API |
| US5 | US1, US2 | Needs registration and reclaim |

---

## Parallel Execution Opportunities

### Within Phase 1 (Setup)
- T001-T008 must be sequential (single migration file)

### Within Phase 2 (Foundational)
- T009, T010, T011 can run in parallel (different files)
- T012, T015 can run in parallel (different files)
- T013, T014 depend on T012
- T016 depends on T015

### Within Phase 3 (US1)
- T017-T021 (API) can run in parallel with T022-T024 (Data Layer)
- T025-T028 (UI) depend on API completion

### Within Phase 4 (US4)
- T029-T031 (API) can run in parallel with T033-T034 (Hook)
- T035-T036 depend on T033

### Within Phase 5 (US3)
- T037-T038 can run in parallel with T039-T040
- T041-T044 depend on API updates

### Within Phase 6 (US2)
- T045-T049 (API) can run in parallel with T051 (UI structure)
- T052-T054 depend on API completion

---

## MVP Scope

**Recommended MVP**: Phases 1-6 (Setup + Foundational + US1 + US4 + US3 + US2)

This provides:
- ✅ Unique nickname registration
- ✅ Heartbeat for activity tracking
- ✅ Disconnect detection display
- ✅ Basic seat reclaim functionality

**Can defer to v1.1**:
- US5 (Find My Game) - nice-to-have UX improvement
- US6 enhancements (auto-retry countdown)
- Session takeover detection (old session just gets 404s)

---

## Implementation Strategy

1. **Start with database migration** - Foundation for everything
2. **Types and domain logic next** - Enables parallel work
3. **Heartbeat before disconnect detection** - Activity data needed first
4. **Registration before reclaim** - Unique nicknames are prerequisite
5. **Test each story independently** - Verify acceptance criteria
6. **Polish last** - Error handling and edge cases

---

---

## Testing Notes

> **Testing Strategy**: Unit tests for domain logic (`connection-status.ts`, `nickname-validation.ts`) are recommended but deferred to post-implementation for MVP speed. Integration tests should be added before production deployment.

---

## Verification Checklist

After each phase, verify:

- [x] **Phase 1**: Migration applies without errors, indexes created
- [x] **Phase 2**: Types compile, domain functions have correct logic
- [x] **Phase 3**: Can register unique nickname, duplicates rejected
- [x] **Phase 4**: Heartbeat updates `last_activity_at` every 30s
- [x] **Phase 5**: Disconnected players shown with visual indicator
- [x] **Phase 6**: Can reclaim seat after grace period
- [x] **Phase 7**: Active players cannot be reclaimed
- [x] **Phase 8**: Can find game by nickname and rejoin
- [x] **Phase 9**: Old session sees takeover message
- [x] **Phase 10**: All error messages are user-friendly
