# Implementation Plan: Player Recovery & Reconnection

**Feature**: 006-player-reconnection
**Branch**: `006-player-reconnection`
**Date**: 2025-12-05
**Status**: Ready for Implementation

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Spec-Driven Development | ✅ Pass | Spec complete, plan in progress |
| TypeScript Strict | ✅ Pass | All new code will use strict types |
| Domain Logic Isolation | ✅ Pass | Connection status logic in `lib/domain/` |
| RLS Enabled | ✅ Pass | Service role used for reclaim operations |
| Server-side Validation | ✅ Pass | All reclaim logic is server-side |
| Error Handling | ✅ Pass | Clear error codes defined |
| Real-time Updates | ✅ Pass | Existing polling shows connection status |

---

## Technical Context

### Existing Infrastructure

| Component | Current State | Changes Needed |
|-----------|---------------|----------------|
| Players table | Has `player_id`, `nickname` | Add `last_activity_at`, `nickname_lower` |
| room_players | Has `is_connected`, `disconnected_at` (unused) | Use computed status instead |
| Player identity | localStorage UUID + server record | Add heartbeat mechanism |
| Room polling | 3-second interval | Add connection status to response |
| API authentication | `x-player-id` header | Same mechanism for heartbeat |

### Dependencies

- **Supabase**: Generated columns, functions
- **Next.js**: API routes for heartbeat, reclaim
- **React**: useEffect for heartbeat interval

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PLAYER RECONNECTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  NORMAL FLOW (Same Browser)                                             │
│  ─────────────────────────                                              │
│  1. Player opens app                                                    │
│  2. localStorage has player_id → Auto-identified                        │
│  3. Heartbeat starts → Updates last_activity_at                         │
│                                                                         │
│  REGISTRATION FLOW (New Browser/Device)                                 │
│  ─────────────────────────────────────                                  │
│  1. No localStorage → Show registration screen                          │
│  2. Enter nickname → POST /api/players/check-nickname                   │
│  3. If available → POST /api/players/register                           │
│  4. Store player_id in localStorage → Proceed to home                   │
│                                                                         │
│  RECOVERY FLOW (Lost Session)                                           │
│  ───────────────────────────                                            │
│  1. Enter nickname on home page                                         │
│  2. GET /api/players/find-game → Shows active room                      │
│  3. Click "Rejoin" → POST /api/rooms/[code]/reclaim                     │
│  4. Server validates: disconnected + past grace period                  │
│  5. Success → Transfer seat to new player_id                            │
│  6. Redirect to room/game                                               │
│                                                                         │
│  HEARTBEAT FLOW                                                         │
│  ──────────────                                                         │
│  [Client]                          [Server]                             │
│  Every 30s → POST /heartbeat  →  UPDATE last_activity_at                │
│  Tab visible → POST /heartbeat →  UPDATE last_activity_at               │
│  Any API call → [implicit activity]                                     │
│                                                                         │
│  DISCONNECT DETECTION                                                   │
│  ───────────────────                                                    │
│  Server computes:                                                       │
│  - is_connected = last_activity_at > NOW() - 60s                        │
│  - can_reclaim = last_activity_at < NOW() - 90s                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Schema (Priority: P0)

**Goal**: Add required columns and functions to database

**Tasks**:
1. Create migration `010_player_reconnection.sql`
2. Add `last_activity_at` column to players
3. Add `nickname_lower` generated column with unique index
4. Create helper functions: `check_nickname_available`, `find_player_in_room`, `reclaim_seat`
5. Backfill `last_activity_at` for existing players

**Files**:
- `supabase/migrations/010_player_reconnection.sql`

**Verification**:
- Run migration on local Supabase
- Test unique constraint rejects duplicate nicknames (case-insensitive)
- Test functions return expected results

---

### Phase 2: TypeScript Types (Priority: P0)

**Goal**: Update TypeScript types for new fields

**Tasks**:
1. Update `Player` interface with new columns
2. Add `ConnectionStatus` interface
3. Add `ReclaimResult` interface
4. Add API request/response types

**Files**:
- `src/types/database.ts`
- `src/types/player.ts` (new)

---

### Phase 3: Domain Logic (Priority: P0)

**Goal**: Create pure functions for connection status and validation

**Tasks**:
1. Create `getConnectionStatus(lastActivityAt)` function
2. Create `validateNickname(nickname)` function
3. Create `canReclaimSeat(lastActivityAt)` function

**Files**:
- `src/lib/domain/connection-status.ts` (new)
- `src/lib/domain/nickname-validation.ts` (new)

---

### Phase 4: Heartbeat API (Priority: P1)

**Goal**: Implement heartbeat endpoint to track activity

**Tasks**:
1. Create `POST /api/players/heartbeat` endpoint
2. Update `last_activity_at` in players table
3. Handle missing player gracefully

**Files**:
- `src/app/api/players/heartbeat/route.ts` (new)

---

### Phase 5: Heartbeat Client Hook (Priority: P1)

**Goal**: Send heartbeat from client every 30 seconds

**Tasks**:
1. Create `useHeartbeat` hook
2. Handle tab visibility changes
3. Integrate with existing room/game pages

**Files**:
- `src/hooks/useHeartbeat.ts` (new)
- `src/app/room/[code]/page.tsx` (update)
- `src/app/game/[gameId]/page.tsx` (update)

---

### Phase 6: Nickname Registration (Priority: P1)

**Goal**: Enforce globally unique nicknames at registration

**Tasks**:
1. Create `POST /api/players/register` endpoint
2. Create `GET /api/players/check-nickname` endpoint
3. Update existing player upsert to check uniqueness
4. Create registration UI component

**Files**:
- `src/app/api/players/register/route.ts` (new)
- `src/app/api/players/check-nickname/route.ts` (new)
- `src/lib/supabase/players.ts` (update)
- `src/components/NicknameRegistration.tsx` (new)

---

### Phase 7: Registration Flow UI (Priority: P1)

**Goal**: Show registration screen for new players

**Tasks**:
1. Create `NicknameRegistration` component
2. Update home page to check for existing identity
3. Show registration modal if no localStorage player_id
4. Store player_id after successful registration

**Files**:
- `src/components/NicknameRegistration.tsx`
- `src/app/page.tsx` (update)

---

### Phase 8: Connection Status Display (Priority: P2)

**Goal**: Show disconnect indicators in UI

**Tasks**:
1. Update room details API to include connection status
2. Update game state API to include connection status
3. Add disconnect badge to player avatars
4. Style disconnected players (grayed out)

**Files**:
- `src/app/api/rooms/[code]/route.ts` (update)
- `src/app/api/games/[gameId]/route.ts` (update)
- `src/components/PlayerAvatar.tsx` (update or new)
- `src/components/game/PlayerSeats.tsx` (update)

---

### Phase 9: Find My Game (Priority: P2)

**Goal**: Allow players to find their active game by nickname

**Tasks**:
1. Create `GET /api/players/find-game` endpoint
2. Add "Find My Game" section to home page
3. Show room info and rejoin button if found

**Files**:
- `src/app/api/players/find-game/route.ts` (new)
- `src/components/FindMyGame.tsx` (new)
- `src/app/page.tsx` (update)

---

### Phase 10: Seat Reclaim (Priority: P1)

**Goal**: Implement seat reclaim functionality

**Tasks**:
1. Create `POST /api/rooms/[code]/reclaim` endpoint
2. Call database `reclaim_seat` function
3. Handle all error cases (active, grace period, not found)
4. Transfer player_id references in all related tables

**Files**:
- `src/app/api/rooms/[code]/reclaim/route.ts` (new)
- `src/lib/supabase/players.ts` (update)

---

### Phase 11: Reclaim UI (Priority: P2)

**Goal**: UI for confirming seat reclaim

**Tasks**:
1. Create `ReclaimConfirmation` modal component
2. Show when joining room with existing nickname
3. Handle reclaim success/failure
4. Redirect to room/game after success

**Files**:
- `src/components/ReclaimConfirmation.tsx` (new)
- `src/app/room/[code]/page.tsx` (update)

---

### Phase 12: Session Takeover Detection (Priority: P2)

**Goal**: Notify old session when seat is reclaimed

**Tasks**:
1. Detect player no longer in room during polling
2. Show "Session taken over" message
3. Clear localStorage room reference
4. Redirect to home page

**Files**:
- `src/hooks/useRoomState.ts` (update)
- `src/hooks/useGameState.ts` (update)
- `src/components/SessionTakeoverAlert.tsx` (new)

---

### Phase 13: Integration Testing (Priority: P2)

**Goal**: Verify complete reconnection flow

**Tests**:
1. Register new player with unique nickname
2. Reject duplicate nickname (case-insensitive)
3. Send heartbeat updates `last_activity_at`
4. Player marked disconnected after 60s inactivity
5. Reclaim denied for active player
6. Reclaim denied during grace period
7. Reclaim succeeds after grace period
8. All game state transfers to new player_id
9. Old session sees takeover message

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/010_player_reconnection.sql` | Database schema changes |
| `src/types/player.ts` | Connection status types |
| `src/lib/domain/connection-status.ts` | Connection status logic |
| `src/lib/domain/nickname-validation.ts` | Nickname validation |
| `src/hooks/useHeartbeat.ts` | Heartbeat sending hook |
| `src/app/api/players/heartbeat/route.ts` | Heartbeat endpoint |
| `src/app/api/players/register/route.ts` | Registration endpoint |
| `src/app/api/players/check-nickname/route.ts` | Nickname check endpoint |
| `src/app/api/players/find-game/route.ts` | Find active game endpoint |
| `src/app/api/rooms/[code]/reclaim/route.ts` | Seat reclaim endpoint |
| `src/components/NicknameRegistration.tsx` | Registration UI |
| `src/components/FindMyGame.tsx` | Find game UI |
| `src/components/ReclaimConfirmation.tsx` | Reclaim confirmation modal |
| `src/components/SessionTakeoverAlert.tsx` | Session takeover notice |
| `src/components/DisconnectedBadge.tsx` | Disconnect indicator |

### Updated Files

| File | Changes |
|------|---------|
| `src/types/database.ts` | Add new Player columns |
| `src/lib/supabase/players.ts` | Add nickname uniqueness check |
| `src/app/api/rooms/[code]/route.ts` | Add connection status |
| `src/app/api/games/[gameId]/route.ts` | Add connection status |
| `src/app/page.tsx` | Add registration check, find game |
| `src/app/room/[code]/page.tsx` | Add heartbeat, reclaim handling |
| `src/app/game/[gameId]/page.tsx` | Add heartbeat |
| `src/components/game/PlayerSeats.tsx` | Show disconnect status |
| `src/hooks/useRoomState.ts` | Add session takeover detection |
| `src/hooks/useGameState.ts` | Add session takeover detection |

---

## Key Technical Decisions

### 1. Computed Connection Status vs Stored

**Decision**: Compute from `last_activity_at` rather than maintaining `is_connected` field

**Rationale**:
- Single source of truth
- No sync issues between heartbeat and connection status
- Simpler implementation

### 2. Polling vs Supabase Realtime

**Decision**: Use existing 3-second polling infrastructure instead of Supabase Realtime

**Rationale**:
- Existing polling is already working well for room/game state (tested in production)
- Connection status is a simple computed field added to existing responses
- Adding Realtime channels specifically for heartbeat would increase complexity
- Heartbeat is write-heavy (every 30s per player); Realtime optimized for read-heavy subscriptions
- 3-second polling is fast enough for disconnect detection (60s threshold)

**Constitution Note**: Constitution recommends Realtime for "multiplayer state", but connection status is metadata about players, not game state. The primary game state (rooms, roles, quests) already uses polling successfully. This is a justified deviation for this specific feature.

### 3. Heartbeat Frequency

**Decision**: 30 seconds

**Rationale**:
- Balances responsiveness (60s disconnect threshold) with server load
- Existing polling is 3s, heartbeat is 10x less frequent

### 3. Grace Period Duration

**Decision**: 30 seconds after disconnect

**Rationale**:
- Short enough to not block legitimate recovery
- Long enough to handle brief network issues

### 4. Nickname Uniqueness Scope

**Decision**: Globally unique (entire system)

**Rationale**:
- Enables recovery without remembering room codes
- Simpler mental model for players
- Future-proofs for cross-room features

### 5. Duplicate Nickname Handling (Migration)

**Decision**: Keep first-registered player, auto-rename duplicates with `_N` suffix

**Rationale**:
- Preserves original player's identity
- Automatic resolution avoids manual intervention
- Renamed players can re-register if they prefer a different name

### 6. Old Player Record After Reclaim

**Decision**: Leave old player record orphaned (no deletion)

**Rationale**:
- Simplest implementation for MVP
- Old record just has no room memberships
- Can add cleanup job later if storage becomes concern

### 7. Reclaim During Active Game Phases

**Decision**: Allow reclaim anytime, including during voting/quest execution

**Rationale**:
- Core purpose is seamless game continuation
- Blocking would defeat the feature's purpose
- New session inherits all pending actions

### 8. Background Tab Heartbeat

**Decision**: Stop heartbeat when tab is hidden; resume on visibility change

**Rationale**:
- Matches user intent (minimized = "away")
- Reduces server load from backgrounded tabs
- Immediate heartbeat on return marks player connected again

### 9. Find My Game Prerequisites

**Decision**: Require registration before "Find My Game" lookup

**Rationale**:
- Ensures nickname is claimed before any actions
- Prevents probing for existing nicknames
- Cleaner flow: register → then search/reclaim

---

## Testing Strategy

### Unit Tests

| Test | File |
|------|------|
| Nickname validation rules | `nickname-validation.test.ts` |
| Connection status calculation | `connection-status.test.ts` |
| Grace period logic | `connection-status.test.ts` |

### Integration Tests

| Test | Description |
|------|-------------|
| Registration flow | New player registers unique nickname |
| Duplicate rejection | Same nickname (case variants) rejected |
| Heartbeat updates | Activity timestamp updates on heartbeat |
| Reclaim success | Full reclaim flow after grace period |
| Session transfer | All game state moves to new player |

### E2E Tests

| Test | Description |
|------|-------------|
| New device recovery | Player loses session, recovers on new device |
| Active protection | Cannot steal active player's seat |
| Find my game | Player finds and rejoins active game |

---

## Migration Notes

### Pre-Deployment

1. **Existing Players**: Migration backfills `last_activity_at` from most recent room activity
2. **Duplicate Nicknames**: If duplicates exist, migration will fail - resolve manually first
3. **Schema Verification**: Run `SELECT * FROM players WHERE nickname_lower IS NULL` after migration

### Post-Deployment

1. Deploy code changes
2. Verify heartbeat endpoint is working
3. Monitor for duplicate nickname errors at registration
4. Check disconnect indicators appear correctly

---

## Rollback Plan

If issues arise:

1. **Heartbeat failing**: Disable heartbeat hook client-side (no server changes needed)
2. **Reclaim broken**: API returns 500 → Old flow still works, just no reclaim
3. **Nickname constraint**: Can drop unique index temporarily (not recommended)

Migration is **non-destructive** - can be rolled forward without data loss.
