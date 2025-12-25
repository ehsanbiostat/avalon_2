# Quickstart: Real-Time Broadcast Updates

**Feature**: 016-realtime-broadcast
**Date**: 2025-12-25

## Quick Reference

### What This Feature Does

Adds instant updates for game actions (draft team selection, voting, quest actions, phase changes) using Supabase Realtime Broadcast. Reduces perceived latency from ~3 seconds to <200ms.

### Key Files to Create

| File | Purpose |
|------|---------|
| `src/types/broadcast.ts` | TypeScript types for events |
| `src/lib/broadcast/event-types.ts` | Event type definitions |
| `src/lib/broadcast/broadcaster.ts` | Server-side broadcast functions |
| `src/lib/broadcast/channel-manager.ts` | Channel lifecycle management |
| `src/lib/broadcast/debounce.ts` | Debounce utility |
| `src/hooks/useBroadcastChannel.ts` | Client-side subscription hook |

### Key Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useGameState.ts` | Add broadcast subscription |
| `src/hooks/useWatcherState.ts` | Add broadcast subscription |
| `src/app/api/games/[gameId]/draft-team/route.ts` | Broadcast after update |
| `src/app/api/games/[gameId]/vote/route.ts` | Broadcast after vote |
| `src/app/api/games/[gameId]/quest/action/route.ts` | Broadcast after action |
| `src/app/api/games/[gameId]/propose/route.ts` | Broadcast phase change |
| `src/app/api/games/[gameId]/continue/route.ts` | Broadcast phase change |

---

## Implementation Steps

### Step 1: Create Types

```typescript
// src/types/broadcast.ts
export type BroadcastEventType =
  | 'draft_update'
  | 'vote_submitted'
  | 'action_submitted'
  | 'phase_transition'
  | 'game_over';

export interface DraftUpdatePayload {
  draft_team: string[];
}
// ... other payload types (see data-model.md)
```

### Step 2: Create Broadcaster Module

```typescript
// src/lib/broadcast/broadcaster.ts
import { createServerClient } from '@/lib/supabase/server';

export async function broadcastDraftUpdate(
  gameId: string,
  draftTeam: string[]
): Promise<void> {
  const supabase = createServerClient();

  await supabase.channel(`game:${gameId}`).send({
    type: 'broadcast',
    event: 'draft_update',
    payload: { draft_team: draftTeam },
  });
}
// ... other broadcast functions
```

### Step 3: Create Client Hook

```typescript
// src/hooks/useBroadcastChannel.ts
import { useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useBroadcastChannel(
  gameId: string | null,
  handlers: BroadcastHandlers
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`game:${gameId}`)
      .on('broadcast', { event: 'draft_update' }, handlers.onDraftUpdate)
      .on('broadcast', { event: 'vote_submitted' }, handlers.onVoteSubmitted)
      // ... other events
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);
}
```

### Step 4: Integrate into useGameState

```typescript
// src/hooks/useGameState.ts - Add to existing hook
useBroadcastChannel(gameId, {
  onDraftUpdate: ({ payload }) => {
    setGameState(prev => prev ? {
      ...prev,
      draft_team: payload.draft_team,
      is_draft_in_progress: payload.draft_team.length > 0,
    } : null);
  },
  onVoteSubmitted: ({ payload }) => {
    setGameState(prev => prev ? {
      ...prev,
      votes_submitted: payload.votes_count,
    } : null);
  },
  // ... other handlers
});
```

### Step 5: Add Broadcasts to API Routes

```typescript
// src/app/api/games/[gameId]/draft-team/route.ts
// After successful DB update:
await broadcastDraftUpdate(gameId, updatedGame.draft_team || []);
```

---

## Testing Checklist

### Unit Tests
- [ ] Event types are correctly defined
- [ ] Debounce logic works as expected
- [ ] Broadcaster functions don't throw on errors

### Integration Tests
- [ ] Broadcast is received by other clients
- [ ] Multiple events in sequence work correctly
- [ ] Channel cleanup on game end

### Manual E2E Tests
- [ ] Leader selects player → other players see highlight <200ms
- [ ] Player votes → badge appears on other screens <200ms
- [ ] Disconnect WiFi → updates continue via polling
- [ ] Reconnect WiFi → broadcasts resume automatically

---

## Common Patterns

### Broadcasting After DB Write

```typescript
// 1. Validate
// 2. Update DB
const result = await updateDatabase(data);
// 3. Broadcast (after success)
await broadcastEvent(gameId, result);
// 4. Return response
return NextResponse.json({ data: result });
```

### Handling Broadcast in Client

```typescript
// Optimistically update local state
setGameState(prev => ({ ...prev, ...updateFromBroadcast }));
// Polling will confirm state on next cycle
```

### Debouncing Rapid Updates

```typescript
// Multiple calls within 50ms window
updateDraft(['p1']);         // Queued
updateDraft(['p1', 'p2']);   // Replaces queued
// Only ['p1', 'p2'] is broadcast
```

---

## Troubleshooting

### Broadcasts Not Received

1. Check channel name matches: `game:${gameId}`
2. Verify subscription status in console logs
3. Check Supabase dashboard for Realtime status
4. Ensure browser supports WebSockets

### Duplicate Updates

1. Verify debounce is working (check timestamps)
2. Ensure broadcast is only called after DB write
3. Check for multiple useEffect triggers

### State Mismatch

1. Polling should eventually sync state
2. Check if broadcast payload matches expected format
3. Verify handler is updating correct state fields

---

## References

- [Supabase Broadcast Docs](https://supabase.com/docs/guides/realtime/broadcast)
- [Feature Spec](./spec.md)
- [Data Model](./data-model.md)
- [Event Contracts](./contracts/broadcast-events.md)
