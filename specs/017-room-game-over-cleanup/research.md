# Research: Room Game-Over Cleanup

**Feature**: 017-room-game-over-cleanup
**Date**: 2025-12-25

## Research Topics

### 1. Game End Locations

**Decision**: Update all three locations where game ends to also close the room

**Findings**:
Game can end in three ways:

1. **5th Rejection** (`src/app/api/games/[gameId]/vote/route.ts`)
   - Calls `endGame(supabase, gameId, 'evil', '5_rejections')`
   - Update `endGame()` function to also close room

2. **Quest Win/Loss** (`src/app/api/games/[gameId]/quest/action/route.ts`)
   - Directly updates `phase: 'game_over'`
   - Add room closure after game update

3. **Assassin Guess** (`src/app/api/games/[gameId]/assassin-guess/route.ts`)
   - Directly updates `phase: 'game_over'`
   - Add room closure after game update

**Rationale**: Centralizing closure logic in `endGame()` would require refactoring quest and assassin routes to use it. Simpler to add room closure at each location.

### 2. State Transition Validity

**Decision**: Add `started` → `closed` as valid transition

**Current State Machine**:
```typescript
const STATE_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  waiting: ['roles_distributed'],
  roles_distributed: ['started'],
  started: [], // Terminal - NO transitions allowed
  closed: [],
};
```

**New State Machine**:
```typescript
const STATE_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  waiting: ['roles_distributed'],
  roles_distributed: ['started'],
  started: ['closed'], // Can close when game ends
  closed: [],
};
```

**Rationale**: The `started` → `closed` transition is semantically correct. A game in progress (`started`) can only end (`closed`), not go back to waiting.

### 3. Idempotency

**Decision**: No special handling needed - closing an already-closed room is a no-op

**Rationale**:
- Supabase `UPDATE` on same status is idempotent
- Multiple simultaneous game-end triggers (rare) won't cause errors
- Existing room status check in `updateRoomStatus` handles edge cases

### 4. Existing Rooms with Finished Games

**Decision**: Don't backfill - let existing cleanup job handle them

**Rationale**:
- There's an existing 48h cleanup job that archives stale `started` rooms
- Backfill migration would add complexity for temporary issue
- New rooms will be cleaned up immediately via this fix

## Alternatives Considered

### Alternative 1: Periodic Cleanup Job
Update the existing cleanup job to also close rooms with finished games.

**Rejected because**: Delay between game end and room closure (up to job interval). User experience suffers.

### Alternative 2: Add New Room Status `completed`
Create new status `completed` distinct from `closed`.

**Rejected because**: `closed` already serves this purpose. Adding new status requires DB migration and more code changes.

### Alternative 3: Soft Delete via Flag
Add `is_game_finished` flag instead of changing status.

**Rejected because**: Room status already captures this semantically. Adding flag duplicates state.
