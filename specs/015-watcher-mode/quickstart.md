# Quickstart: Watcher Mode

**Feature**: 015-watcher-mode
**Date**: 2024-12-25

## Overview

This guide covers implementing the watcher/spectator mode for Avalon Online.

## Key Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/lib/domain/watcher-session.ts` | In-memory watcher session management |
| `src/app/api/watch/[gameId]/route.ts` | GET watcher game state |
| `src/app/api/watch/[gameId]/join/route.ts` | POST join as watcher |
| `src/app/api/watch/[gameId]/leave/route.ts` | POST leave watching |
| `src/app/watch/[gameId]/page.tsx` | Watcher view page |
| `src/hooks/useWatcherState.ts` | Watcher game state polling hook |
| `src/types/watcher.ts` | TypeScript types for watcher feature |

### Modified Files

| File | Change |
|------|--------|
| `src/app/page.tsx` | Add "Watch" option for room code entry |
| `src/components/game/GameBoard.tsx` | Add `isWatcher` prop for read-only mode |

## Component Hierarchy

```
WatcherPage (/app/watch/[gameId]/page.tsx)
└── GameBoard (isWatcher=true)
    ├── QuestTracker (unchanged)
    ├── PlayerSeats (unchanged - no role info shown)
    ├── VotingPanel (hidden for watchers)
    ├── TeamProposal (read-only for watchers)
    ├── QuestExecution (hidden for watchers)
    └── StopWatchingButton (new for watchers)
```

## Key Implementation Patterns

### 1. In-Memory Session Storage

```typescript
// src/lib/domain/watcher-session.ts

interface WatcherInfo {
  nickname: string;
  playerId: string;
  joinedAt: number;
  lastSeen: number;
}

// Server-side only - NOT persisted
const watcherSessions = new Map<string, Set<WatcherInfo>>();

export function addWatcher(gameId: string, info: WatcherInfo): boolean {
  cleanupStaleWatchers(gameId);
  
  const watchers = watcherSessions.get(gameId) || new Set();
  if (watchers.size >= MAX_WATCHERS) {
    return false;
  }
  
  // Remove existing entry for same player (allows rejoin)
  for (const w of watchers) {
    if (w.playerId === info.playerId) {
      watchers.delete(w);
      break;
    }
  }
  
  watchers.add(info);
  watcherSessions.set(gameId, watchers);
  return true;
}

export function getWatcherCount(gameId: string): number {
  cleanupStaleWatchers(gameId);
  return watcherSessions.get(gameId)?.size || 0;
}
```

### 2. Neutral Observer Game State

```typescript
// src/app/api/watch/[gameId]/route.ts

export async function GET(request: Request, { params }: RouteParams) {
  const { gameId } = await params;
  
  // Verify watcher is registered
  const watcherId = getPlayerIdFromRequest(request);
  if (!isWatcher(gameId, watcherId)) {
    return errors.unauthorized();
  }
  
  // Update lastSeen for timeout tracking
  updateWatcherLastSeen(gameId, watcherId);
  
  // Get game state (READ ONLY)
  const game = await getGameById(supabase, gameId);
  
  // Build NEUTRAL observer view
  const watcherState: WatcherGameState = {
    game,
    players: buildWatcherPlayerList(game), // No role info
    current_proposal: await getCurrentProposal(supabase, gameId),
    quest_requirement: getQuestRequirement(game.player_count, game.current_quest),
    votes_submitted: await getVoteCount(supabase, proposalId),
    total_players: game.player_count,
    // NO my_vote, NO am_team_member, NO can_submit_action
    last_vote_result: game.phase !== 'voting' ? await getLastVoteResult(...) : null,
  };
  
  return NextResponse.json({ data: watcherState });
}
```

### 3. GameBoard Watcher Mode

```tsx
// src/components/game/GameBoard.tsx

interface GameBoardProps {
  gameId: string;
  isWatcher?: boolean; // NEW
}

export function GameBoard({ gameId, isWatcher = false }: GameBoardProps) {
  // Use different hook based on mode
  const gameData = isWatcher 
    ? useWatcherState(gameId) 
    : useGameState(gameId);
  
  return (
    <div>
      {/* Show "Watching" indicator for watchers */}
      {isWatcher && (
        <div className="watching-banner">
          👁️ Watching • Read-only mode
        </div>
      )}
      
      {/* Quest tracker - same for everyone */}
      <QuestTracker {...} />
      
      {/* Player seats - no role info for watchers */}
      <PlayerSeats 
        players={gameData.players}
        showRoles={!isWatcher && gameData.game.phase === 'game_over'}
      />
      
      {/* Action panels - hidden for watchers */}
      {!isWatcher && (
        <>
          <VotingPanel {...} />
          <QuestExecution {...} />
          <TeamProposal {...} />
        </>
      )}
      
      {/* Stop watching button - only for watchers */}
      {isWatcher && (
        <Button onClick={handleStopWatching}>
          Stop Watching
        </Button>
      )}
    </div>
  );
}
```

### 4. useWatcherState Hook

```typescript
// src/hooks/useWatcherState.ts

export function useWatcherState(gameId: string) {
  const [state, setState] = useState<WatcherGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const playerId = getPlayerId();
      const response = await fetch(`/api/watch/${gameId}`, {
        headers: { 'X-Player-ID': playerId },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch game state');
      }
      
      const data = await response.json();
      setState(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Poll every 3 seconds (same as players)
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  return { state, loading, error, refetch: fetchState };
}
```

## Manual Testing Checklist

### Entry Flow
- [ ] Enter room code for game in progress → "Watch" option appears
- [ ] Enter room code for waiting room → "Watch" option disabled with tooltip
- [ ] Click "Watch" without nickname → Prompted to enter nickname
- [ ] Click "Watch" with valid nickname → Redirected to watcher view

### Watcher Limit
- [ ] 10 watchers can join successfully
- [ ] 11th watcher sees "Maximum spectators reached" error
- [ ] When a watcher leaves, new watcher can join

### Read-Only Experience
- [ ] No vote buttons visible
- [ ] No team selection controls
- [ ] No quest action buttons
- [ ] "Watching" indicator shown
- [ ] "Stop Watching" button works

### Information Visibility
- [ ] Can see player positions and nicknames
- [ ] Can see current game phase
- [ ] Can see quest track and results
- [ ] Can see vote counts (not individual votes until reveal)
- [ ] Can see team proposals
- [ ] Cannot see player roles (until game over)
- [ ] Cannot see Lady of the Lake results

### Lifecycle
- [ ] Watcher can leave and rejoin
- [ ] After 30s of inactivity, slot is freed
- [ ] Game over screen shows all roles (same as players)

### Performance Isolation
- [ ] Player API response times unchanged with watchers present
- [ ] No watcher data in player game state responses
- [ ] No database writes when watcher joins/leaves

