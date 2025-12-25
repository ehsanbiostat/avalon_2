# Quickstart: Room Game-Over Cleanup

**Feature**: 017-room-game-over-cleanup
**Date**: 2025-12-25

## Quick Reference

### What This Feature Does

Automatically closes rooms when games end, removing them from the "Browse Active Rooms" list so users only see joinable/watchable rooms.

### Key Changes

| File | Change |
|------|--------|
| `src/lib/domain/room-state.ts` | Add `started` → `closed` transition |
| `src/lib/supabase/games.ts` | Update `endGame()` to close room |
| `src/app/api/games/[gameId]/quest/action/route.ts` | Close room on game_over |
| `src/app/api/games/[gameId]/assassin-guess/route.ts` | Close room on game_over |

### Testing Checklist

#### Test 1: Game End via Quests
1. Start a 5-player game
2. Play until one team wins 3 quests
3. After game ends, browse active rooms
4. **Expected**: Room does NOT appear in list

#### Test 2: Game End via 5 Rejections
1. Start a game
2. Reject 5 proposals in a row
3. After game ends, browse active rooms
4. **Expected**: Room does NOT appear in list

#### Test 3: Game End via Assassin
1. Start a game with Merlin
2. Good wins 3 quests
3. Assassin guesses (correct or not)
4. After game ends, browse active rooms
5. **Expected**: Room does NOT appear in list

#### Test 4: Game History Preserved
1. Complete a game
2. Navigate to the game URL directly
3. **Expected**: Game over screen shows with full results

### Code Snippets

#### State Transition Change
```typescript
// src/lib/domain/room-state.ts
const STATE_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  waiting: ['roles_distributed'],
  roles_distributed: ['started'],
  started: ['closed'], // ← NEW: Allow closing when game ends
  closed: [],
};
```

#### Room Closure Call
```typescript
// After game phase is set to 'game_over'
import { updateRoomStatus } from '@/lib/supabase/rooms';

// Close the room
await updateRoomStatus(supabase, game.room_id, 'closed');
```

### Verification Commands

```bash
# Check room status in database
SELECT id, code, status FROM rooms WHERE status = 'closed' ORDER BY created_at DESC LIMIT 5;

# Check if any 'started' rooms have finished games
SELECT r.code, r.status, g.phase, g.ended_at
FROM rooms r
JOIN games g ON g.room_id = r.id
WHERE r.status = 'started' AND g.phase = 'game_over';
-- Should return 0 rows after fix
```
