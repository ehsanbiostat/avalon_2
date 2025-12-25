# Research: Watcher Mode

**Feature**: 015-watcher-mode
**Date**: 2024-12-25

## Research Questions

### Q1: How to store watcher sessions without affecting game database?

**Decision**: In-memory Map structure on the server

**Rationale**:
- NFR-004 explicitly prohibits foreign keys to game tables
- In-memory storage provides complete isolation
- Ephemeral by nature (exactly what spec requires - NFR-006)
- No database migrations needed
- Zero impact on game table performance

**Alternatives Considered**:
- **Supabase separate table**: Rejected - still creates DB overhead, potential for accidental FK
- **Redis/Upstash**: Rejected - adds external dependency for simple requirement
- **LocalStorage + validation**: Rejected - client-side storage not suitable for server-side limit enforcement

**Implementation**:
```typescript
// In-memory storage (server-side only)
const watcherSessions = new Map<string, Set<WatcherInfo>>();

interface WatcherInfo {
  nickname: string;
  joinedAt: number; // timestamp for cleanup
  lastSeen: number; // for timeout detection
}
```

---

### Q2: How to provide neutral observer game state without exposing player-specific data?

**Decision**: Create dedicated watcher API endpoint that strips sensitive data

**Rationale**:
- Existing `/api/games/[gameId]` returns player-specific data (my_vote, am_team_member, etc.)
- Watchers need a "neutral" view with no player-specific fields
- Complete API separation ensures no accidental data leakage

**Alternatives Considered**:
- **Query parameter on existing endpoint**: Rejected - risk of bypass, harder to audit
- **Response transformer**: Rejected - still executes player logic, potential leaks
- **Shared utility with different projections**: Selected - clean separation

**Implementation**:
```typescript
// New endpoint: GET /api/watch/[gameId]
// Returns WatcherGameState (subset of GameState without player-specific fields)

interface WatcherGameState {
  game: Game;
  players: WatcherPlayerInfo[]; // No role info
  current_proposal: TeamProposal | null;
  quest_requirement: QuestRequirement;
  // NO my_vote, NO am_team_member, NO can_submit_action
  votes_submitted: number;
  total_players: number;
  last_vote_result: LastVoteResult | null; // Only after reveal
}
```

---

### Q3: How to handle watcher cleanup on disconnect?

**Decision**: Timestamp-based timeout with lazy cleanup

**Rationale**:
- Watchers poll every 3 seconds (same as players)
- If no poll for 30 seconds, consider disconnected
- Clean up stale sessions when checking watcher count
- No need for WebSocket or explicit disconnect detection

**Alternatives Considered**:
- **WebSocket heartbeat**: Rejected - adds complexity, project uses polling
- **Browser beforeunload**: Rejected - unreliable, doesn't work for tab crashes
- **Explicit leave endpoint only**: Rejected - doesn't handle unexpected disconnects

**Implementation**:
```typescript
function cleanupStaleWatchers(gameId: string): void {
  const watchers = watcherSessions.get(gameId);
  if (!watchers) return;
  
  const now = Date.now();
  const TIMEOUT_MS = 30000; // 30 seconds
  
  for (const watcher of watchers) {
    if (now - watcher.lastSeen > TIMEOUT_MS) {
      watchers.delete(watcher);
    }
  }
}
```

---

### Q4: How to modify GameBoard for watcher mode without breaking player experience?

**Decision**: Add `isWatcher` boolean prop that conditionally disables all interactive elements

**Rationale**:
- Reuses existing UI (per spec - FR-009 says same page)
- Single source of truth for game board rendering
- Easy to test in isolation

**Alternatives Considered**:
- **Separate WatcherGameBoard component**: Rejected - code duplication, drift risk
- **CSS-only disabled state**: Rejected - doesn't prevent API calls from devtools
- **HOC wrapper**: Rejected - overly complex for boolean flag

**Implementation**:
```tsx
// GameBoard.tsx
interface GameBoardProps {
  gameId: string;
  isWatcher?: boolean; // NEW: defaults to false
}

// In component, use isWatcher to:
// 1. Hide all action buttons
// 2. Skip player-specific state (my_vote, etc.)
// 3. Show "Watching" indicator instead of role
```

---

### Q5: How to determine if a game is watchable (started but not ended)?

**Decision**: Query room status from existing room endpoint

**Rationale**:
- Room status already exists: 'waiting' | 'roles_distributed' | 'started' | 'closed'
- Game exists only after 'started' status
- No new database queries needed

**Implementation**:
```typescript
// Watchable when:
// 1. Room exists
// 2. Room status is 'started' (game in progress)
// OR Room has a game with phase !== 'game_over' (for post-started phases)

async function isGameWatchable(roomCode: string): Promise<{
  watchable: boolean;
  gameId: string | null;
  reason?: string;
}>;
```

---

## Best Practices Applied

### Spectator Mode Patterns (from gaming industry)
1. **Read-only state subscription**: Watchers subscribe to same state feed but cannot emit actions
2. **Information hiding tiers**: "Neutral observer" sees only public information
3. **Capacity limits**: Prevent server overload with watcher cap (10 per spec)
4. **Graceful degradation**: Watchers can be dropped without affecting game

### Performance Isolation
1. **Separate code paths**: Watcher API endpoints don't share code with player endpoints
2. **No database writes**: Watcher operations never write to game tables
3. **Lazy cleanup**: Don't do expensive cleanup on every request

### Security Considerations
1. **No privilege escalation**: Watcher cannot become player mid-game
2. **Information boundary**: Watcher API explicitly excludes sensitive fields
3. **Rate limiting**: Standard rate limits apply (no special watcher limits needed)

