# Implementation Plan: Room Game-Over Cleanup

**Branch**: `017-room-game-over-cleanup` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-room-game-over-cleanup/spec.md`

## Summary

Fix the issue where finished game rooms remain visible in the "Browse Active Rooms" list as "Full" waiting rooms. When a game ends (`game_over` phase), automatically transition the room status from `started` to `closed`.

## Technical Context

**Language/Version**: TypeScript 5.7.2, React 18.3.1, Next.js 15.1.9
**Primary Dependencies**: Supabase (existing), no new dependencies
**Storage**: Supabase Postgres - existing `rooms` table, `status` column
**Testing**: Manual E2E testing

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Spec-Driven Development | ✅ PASS | Spec created before plan |
| Domain Logic Isolation | ✅ PASS | State transition in `lib/domain/room-state.ts` |
| Server-Side Authority | ✅ PASS | Room closure in API routes only |
| Data Persistence | ✅ PASS | Room status update in Postgres |
| No Breaking Changes | ✅ PASS | Additive transition, existing rooms unaffected |

## Architecture Overview

### Current State

```
Game ends (game_over) → Room status remains 'started' → Shows in active rooms as "Full"
```

### Target State

```
Game ends (game_over) → Room status changes to 'closed' → Hidden from active rooms
```

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/domain/room-state.ts` | Add `started` → `closed` transition |
| `src/lib/supabase/games.ts` | Update `endGame()` to also close room |
| `src/app/api/games/[gameId]/quest/action/route.ts` | Close room on game_over |
| `src/app/api/games/[gameId]/assassin-guess/route.ts` | Close room on game_over |

## Implementation Details

### Step 1: Update Room State Machine

Modify `src/lib/domain/room-state.ts`:

```typescript
// BEFORE
const STATE_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  waiting: ['roles_distributed'],
  roles_distributed: ['started'],
  started: [], // Terminal state (game in progress)
  closed: [], // Terminal state (archived)
};

// AFTER
const STATE_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  waiting: ['roles_distributed'],
  roles_distributed: ['started'],
  started: ['closed'], // Can transition to closed when game ends
  closed: [], // Terminal state (archived)
};
```

### Step 2: Create Room Closure Helper

Add to `src/lib/supabase/games.ts`:

```typescript
/**
 * Close the room when game ends
 * Called after game phase transitions to game_over
 */
export async function closeRoomOnGameEnd(
  client: SupabaseClient,
  roomId: string
): Promise<void> {
  await updateRoomStatus(client, roomId, 'closed');
}
```

### Step 3: Update Game End Locations

Three places where game ends:

1. **`endGame()` function** in `games.ts` - 5 rejections
2. **`quest/action/route.ts`** - Win via quests
3. **`assassin-guess/route.ts`** - Assassin phase result

After each `phase: 'game_over'` update, call `closeRoomOnGameEnd(client, roomId)`.

### Step 4: Verification

The `getWaitingRooms()` function already filters by:
```typescript
.in('status', ['waiting', 'started'])
```

Rooms with `closed` status are already excluded - no changes needed.

## Project Structure

```
src/
├── lib/
│   ├── domain/
│   │   └── room-state.ts          # MODIFY: Add started→closed transition
│   └── supabase/
│       ├── games.ts               # MODIFY: Add closeRoomOnGameEnd helper
│       └── rooms.ts               # NO CHANGE: updateRoomStatus exists
├── app/api/games/[gameId]/
│   ├── vote/route.ts              # MODIFY: Close room on 5 rejections
│   ├── quest/action/route.ts      # MODIFY: Close room on game_over
│   └── assassin-guess/route.ts    # MODIFY: Close room on game_over
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition on simultaneous game end | Low | Low | Closing already-closed room is idempotent (no-op) |
| Existing finished rooms not cleaned up | Medium | Low | Existing 48h cleanup job will eventually archive them |
| Room closed before all players see result | Low | Medium | Room closure happens AFTER game_over is set |

## Edge Cases Handled

1. **Idempotent closure**: Calling `closeRoomOnGameEnd` multiple times is safe
2. **Game history preserved**: `closed` status doesn't delete any game data
3. **Watchers**: Can still view game_over screen (room access not blocked, just hidden from list)

## Success Verification

1. Play a game to completion → Room disappears from "Browse Active Rooms"
2. Direct URL to finished game → Game over screen displays correctly
3. Check database → Room status is `closed`, all game data preserved
