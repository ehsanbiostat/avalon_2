# Research: Endgame Merlin Quiz

**Feature**: 010-endgame-merlin-quiz
**Date**: 2025-12-20

## Research Questions

### RQ-001: How to ensure quiz only appears after Assassin phase?

**Decision**: Check game phase strictly equals `game_over`

**Rationale**: 
- The game state machine guarantees `assassin` → `game_over` transition
- By checking `game.phase === 'game_over'`, we ensure all game mechanics (including Assassin's Merlin guess) have completed
- The quiz has zero visibility into game state before this point

**Alternatives Considered**:
- Add a new `quiz` phase: Rejected - adds complexity to existing state machine
- Use a flag on the games table: Rejected - phase is sufficient and cleaner

### RQ-002: How to handle quiz timeout without server-side timers?

**Decision**: Client-side countdown with server-validated timestamps

**Rationale**:
- Store `quiz_started_at` as the first vote timestamp (or game `ended_at`)
- Client displays 60s countdown from this timestamp
- When timeout reached, client triggers "auto-complete" behavior
- Server validates that if votes exist for 60+s, quiz is considered complete
- No need for background jobs or WebSocket timers

**Alternatives Considered**:
- Server-side cron job: Rejected - adds infrastructure complexity
- Supabase edge function with timeout: Rejected - overkill for this use case
- No timeout: Rejected - could block role reveal indefinitely

### RQ-003: How to detect when all players have voted?

**Decision**: Compare vote count to connected player count

**Rationale**:
- Get connected players from `room_players` where `is_connected = true`
- Count votes in `merlin_quiz_votes` for game
- When counts match, quiz is complete
- Disconnected players don't block completion

**Alternatives Considered**:
- Count against total seating_order: Rejected - disconnected players would block
- Required all to vote: Rejected - poor UX if someone leaves

### RQ-004: Should quiz results reveal individual votes?

**Decision**: No - show only aggregate vote counts (anonymous)

**Rationale**:
- Per spec assumption: "Vote counts are anonymous in results"
- Shows "Alice: 3 votes" not "Alice: voted by Bob, Charlie, Dave"
- Simpler UI, less potential for post-game drama
- Still fun and informative for the guessing experience

**Alternatives Considered**:
- Show who voted for whom: Rejected - could cause player friction
- Show nothing, just highlight winner: Rejected - less engaging

### RQ-005: How to detect if Merlin was in the game?

**Decision**: Query `player_roles` table for `special_role = 'merlin'`

**Rationale**:
- Existing pattern used by Assassin phase logic
- Single query at game end to determine quiz eligibility
- Can cache result in API response for efficiency

**Implementation**:
```typescript
const { data: merlinCheck } = await supabase
  .from('player_roles')
  .select('id')
  .eq('room_id', game.room_id)
  .eq('special_role', 'merlin')
  .single();

const hasMerlin = !!merlinCheck;
```

### RQ-006: Real-time updates pattern for quiz votes?

**Decision**: Supabase Realtime subscription on `merlin_quiz_votes` table

**Rationale**:
- Existing pattern used for proposals and votes tables
- Subscribe to INSERT events filtered by `game_id`
- Client updates vote count in real-time
- No polling required

**Implementation**:
```typescript
const channel = supabase
  .channel(`quiz-votes-${gameId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'merlin_quiz_votes',
    filter: `game_id=eq.${gameId}`
  }, handleNewVote)
  .subscribe();
```

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Quiz phase tracking | Implicit via vote state | No schema changes to games table |
| Timeout mechanism | Client-side countdown | Simple, no server jobs needed |
| Completion detection | Vote count vs connected players | Handles disconnects gracefully |
| Results anonymity | Aggregate counts only | Better UX, per spec |
| Merlin detection | Query player_roles | Existing pattern |
| Real-time updates | Supabase Realtime | Existing infrastructure |

## Risks Identified

1. **Clock drift**: Client timeout might differ from server time
   - Mitigation: Use server timestamp as quiz start; accept ±5s variance

2. **Reconnection during quiz**: Player reconnects after timeout
   - Mitigation: Check quiz state on mount; if complete, show results

3. **Multiple browsers**: Player has two tabs open
   - Mitigation: Unique constraint prevents duplicate votes; show "already voted" state

