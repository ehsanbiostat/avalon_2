# Research: Real-Time Broadcast Updates

**Feature**: 016-realtime-broadcast
**Date**: 2025-12-25

## Research Topics

### 1. Supabase Realtime Broadcast API

**Decision**: Use Supabase Realtime Broadcast channels (not Postgres Changes)

**Rationale**:
- Broadcast channels are lightweight and don't require database triggers
- Messages are sent directly between clients via Supabase infrastructure
- No database query overhead for receiving updates
- Perfect for ephemeral state updates (draft selections, vote status)
- Built into existing `@supabase/supabase-js` dependency

**Alternatives Considered**:
1. **Postgres Changes (Realtime subscriptions)**: Would require database triggers and send full row data. Rejected because: higher latency, more bandwidth, exposes DB schema to clients.
2. **Custom WebSocket Server**: Full control but requires separate infrastructure. Rejected because: Vercel serverless doesn't support persistent WebSocket servers, would need additional hosting.
3. **Polling with shorter intervals**: Simple but wastes resources. Rejected because: 200ms polling would create 5x API load.

**Key API Methods**:
```typescript
// Subscribe to a channel
const channel = supabase.channel(`game:${gameId}`)
  .on('broadcast', { event: 'draft_update' }, (payload) => { ... })
  .subscribe()

// Send a broadcast (server-side)
await supabase.channel(`game:${gameId}`)
  .send({
    type: 'broadcast',
    event: 'draft_update',
    payload: { draft_team: [...] }
  })
```

---

### 2. Channel Lifecycle Management

**Decision**: Create channel on game start, destroy on game end or 2-hour inactivity

**Rationale**:
- Channels are created when games transition to `team_building` phase
- This aligns with when real-time updates become valuable
- 2-hour inactivity timeout handles abandoned games
- No persistent channel storage needed (in-memory tracking)

**Alternatives Considered**:
1. **Create on room creation**: Would create channels for games that never start. Rejected: wasted resources.
2. **Manual cleanup only**: Risk of orphaned channels. Rejected: resource leak.
3. **Per-quest channels**: Too granular, unnecessary complexity. Rejected: over-engineering.

**Implementation Approach**:
- Track active channels in server memory (Map)
- Set 2-hour timeout on channel creation
- Clear timeout and destroy channel on `game_over` phase
- Periodic cleanup sweep for edge cases

---

### 3. Broadcast Event Types

**Decision**: Define specific event types for each game action

**Rationale**:
- Typed events enable client-side type safety
- Clients can selectively listen to relevant events
- Payload is minimal and action-specific

**Event Types**:

| Event | Trigger | Payload |
|-------|---------|---------|
| `draft_update` | Leader selects/deselects player | `{ draft_team: string[] }` |
| `vote_submitted` | Player submits vote | `{ player_id: string, votes_count: number }` |
| `action_submitted` | Team member submits action | `{ actions_count: number }` |
| `phase_transition` | Game phase changes | `{ phase: GamePhase, trigger: string }` |
| `game_over` | Game ends | `{ winner: 'good'|'evil', reason: string }` |

**Alternatives Considered**:
1. **Single `state_update` event with full state**: Simpler but larger payloads. Rejected: bandwidth concerns, violates minimal payload goal.
2. **Database row broadcasting**: Automatic but exposes schema. Rejected: security concerns.

---

### 4. Client-Side State Integration

**Decision**: Broadcast updates supplement polling, not replace it

**Rationale**:
- Polling is the reliable fallback (FR-007)
- Broadcast provides instant updates when connected
- On broadcast receipt, update relevant state slice immediately
- Full state refresh happens on next poll (ensures consistency)

**Alternatives Considered**:
1. **Replace polling entirely**: Risky if connection drops. Rejected: reliability concerns.
2. **Optimistic updates only**: No server confirmation. Rejected: could show incorrect state.

**Integration Pattern**:
```typescript
// In useGameState hook
useEffect(() => {
  const channel = supabase.channel(`game:${gameId}`)
    .on('broadcast', { event: 'draft_update' }, ({ payload }) => {
      // Immediately update local state
      setGameState(prev => ({ ...prev, draft_team: payload.draft_team }));
    })
    .subscribe();

  return () => { channel.unsubscribe(); };
}, [gameId]);

// Polling continues independently as backup
```

---

### 5. Server-Side Broadcast Triggering

**Decision**: Broadcast after successful database write (server-confirmed state)

**Rationale**:
- FR-011 requires server state as source of truth
- Broadcast only after DB transaction commits
- Ensures all clients see confirmed state
- Prevents optimistic broadcasts of failed actions

**Alternatives Considered**:
1. **Broadcast before DB write**: Faster but risky. Rejected: could show state that fails to persist.
2. **Separate broadcast service**: Additional infrastructure. Rejected: over-engineering for current scale.

**Implementation Pattern**:
```typescript
// In API route handler
// 1. Validate request
// 2. Update database
const updatedGame = await updateDraftTeam(supabase, gameId, normalizedTeam);
// 3. Broadcast after successful update
await broadcastDraftUpdate(gameId, updatedGame.draft_team || []);
// 4. Return response
```

---

### 6. Debouncing Strategy

**Decision**: 50ms minimum between broadcasts per game channel

**Rationale**:
- FR-010 requires debouncing to prevent flooding
- 50ms allows rapid updates without overwhelming clients
- Implemented at broadcaster level, not per-event
- Last-write-wins for same event type within window

**Alternatives Considered**:
1. **No debouncing**: Could flood on rapid clicks. Rejected: performance risk.
2. **100ms+ debounce**: Noticeable delay. Rejected: conflicts with 200ms target.
3. **Per-client throttling**: Complex to implement. Rejected: unnecessary.

---

### 7. Error Handling and Fallback

**Decision**: Seamless fallback to polling on connection failure

**Rationale**:
- FR-007 requires polling fallback
- No visible indicator per spec clarification
- Auto-reconnect handled by Supabase client
- Log errors for debugging (FR-015)

**Alternatives Considered**:
1. **Show connection indicator**: User requested no visible indicator. Rejected.
2. **Disable polling when connected**: Risky if connection drops silently. Rejected: reliability.

**Error Handling**:
```typescript
channel
  .on('system', {}, (status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Broadcast] Connected to game:${gameId}`);
    }
  })
  .subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.error(`[Broadcast] Error on game:${gameId}:`, err);
      // Polling continues automatically as fallback
    }
  });
```

---

### 8. Watcher Integration

**Decision**: Watchers subscribe to same channel, receive same events

**Rationale**:
- FR-009 includes watchers in broadcast
- Same channel avoids duplication
- No special handling needed (watchers are read-only anyway)
- Same restrictions apply (no hidden info in broadcasts)

**Implementation**:
- `useWatcherState` hook adds broadcast subscription (same as player hook)
- Watcher receives `draft_update`, `vote_submitted`, `action_submitted`, `phase_transition`, `game_over`
- No additional events for watchers (same view as players)

---

## Security Considerations

### Information Disclosure Prevention

- **Vote values**: Never broadcast. Only `vote_submitted { player_id, votes_count }` (who voted, not how)
- **Quest actions**: Never broadcast action type. Only `action_submitted { actions_count }` (progress only)
- **Roles**: Never in any broadcast
- **Assassin guess**: Only via phase_transition when game ends

### Channel Authorization

Per spec clarification: No authorization needed for broadcast subscriptions because:
1. Broadcast messages contain only public information
2. Game state polling already restricts sensitive data
3. Channel names use game IDs (not guessable room codes)

---

## Performance Considerations

### Message Size

| Event | Estimated Size |
|-------|---------------|
| `draft_update` | ~200 bytes (7 player IDs max) |
| `vote_submitted` | ~80 bytes |
| `action_submitted` | ~50 bytes |
| `phase_transition` | ~100 bytes |
| `game_over` | ~120 bytes |

All under 1KB requirement.

### Connection Overhead

- Supabase uses single WebSocket per client (shared across channels)
- Channel subscription is lightweight
- Minimal overhead for games with no active updates

### Scalability

- Each game channel: ~20 subscribers max (10 players + 10 watchers)
- Supabase handles fan-out efficiently
- No server-side connection management needed

---

## Testing Strategy

### Unit Tests
- Event type validation
- Payload structure verification
- Debounce logic

### Integration Tests
- Broadcast reaches all subscribers
- Fallback to polling on disconnect
- Channel cleanup on game end

### E2E Tests
- Leader selects player → others see highlight within 200ms
- Player votes → badge appears on other screens within 200ms
- Connection drop → updates continue via polling

---

## Dependencies

### Existing
- `@supabase/supabase-js ^2.47.12` - Realtime Broadcast included

### New
- None required

### Configuration
- Ensure Supabase project has Realtime enabled (already enabled for current plan)
