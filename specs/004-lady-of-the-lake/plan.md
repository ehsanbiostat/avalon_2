# Phase 4: Lady of the Lake – Implementation Plan

| Field | Value |
|-------|-------|
| **Plan ID** | 004 |
| **Title** | Lady of the Lake – Investigation Mechanic |
| **Status** | Draft |
| **Created** | 2024-12-05 |
| **Spec Reference** | [spec.md](./spec.md) |

---

## 1. Technical Context

### 1.1 Existing Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| `rooms.lady_of_lake_enabled` | ✅ Exists | Boolean flag for Lady in game |
| `rooms.lady_of_lake_holder_id` | ✅ Exists | Current Lady holder |
| `player_roles.has_lady_of_lake` | ✅ Exists | Initial Lady assignment |
| `game_phase` enum | Needs update | Add 'lady_of_lake' phase |
| `games` table | Needs update | Track investigated players |

### 1.2 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single target handling | Show UI, require confirmation | Consistent UX |
| Timeout | No timeout | Avoid punishing slow decisions |
| Result display | Wait for "Continue" click | Let Lady holder process info |
| Public announcement | Show who investigated whom | Adds strategic information |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Flow                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  quest_result (Quest 2/3/4) ──► lady_of_lake ──► team_building  │
│          │                           │                           │
│          │                           ▼                           │
│          │                   LadyOfLakePhase                     │
│          │                      Component                        │
│          │                           │                           │
│          │                   POST /lady-investigate              │
│          │                           │                           │
│          │                           ▼                           │
│          │                   InvestigationResult                 │
│          │                      Component                        │
│          │                           │                           │
│          └───── (Lady disabled) ─────┴───────────────────────►  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Updates

### 3.1 Update `game_phase` Enum

```sql
ALTER TYPE game_phase ADD VALUE IF NOT EXISTS 'lady_of_lake' AFTER 'quest_result';
```

### 3.2 New Table: `lady_investigations`

```sql
CREATE TABLE lady_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quest_number INT NOT NULL CHECK (quest_number BETWEEN 2 AND 4),
  investigator_id UUID NOT NULL REFERENCES players(id),
  target_id UUID NOT NULL REFERENCES players(id),
  result TEXT NOT NULL CHECK (result IN ('good', 'evil')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure each player investigated only once per game
  UNIQUE (game_id, target_id)
);

-- Index for fast lookups
CREATE INDEX idx_lady_investigations_game ON lady_investigations(game_id);
```

### 3.3 Update `games` Table

```sql
-- Add column to track current Lady holder (moves from rooms to games during active game)
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS lady_holder_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- Add column to track if Lady is enabled for this game
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS lady_enabled BOOLEAN DEFAULT FALSE;
```

### 3.4 RLS Policies

```sql
-- Lady investigations: Players in game can view
CREATE POLICY "Players can view investigations in their game"
ON lady_investigations FOR SELECT
TO authenticated, anon
USING (
  game_id IN (
    SELECT g.id FROM games g
    WHERE g.room_id IN (
      SELECT p.room_id FROM players p WHERE p.player_id = current_setting('app.player_id', true)::uuid
    )
  )
);

-- Lady investigations: Only Lady holder can insert
CREATE POLICY "Lady holder can create investigation"
ON lady_investigations FOR INSERT
TO authenticated, anon
WITH CHECK (true); -- Validation done in API
```

---

## 4. TypeScript Types

### 4.1 New Types

```typescript
// Add to game_phase
export type GamePhase =
  | 'team_building'
  | 'voting'
  | 'quest'
  | 'quest_result'
  | 'lady_of_lake'  // NEW
  | 'assassin'
  | 'game_over';

// New interface for Lady investigation
export interface LadyInvestigation {
  id: string;
  game_id: string;
  quest_number: number;
  investigator_id: string;
  target_id: string;
  result: 'good' | 'evil';
  created_at: string;
}

// Lady state in GameState
export interface LadyOfLakeState {
  enabled: boolean;
  holder_id: string | null;
  holder_nickname: string | null;
  investigated_player_ids: string[];
  is_holder: boolean;           // Current player is Lady holder
  can_investigate: boolean;     // In lady_of_lake phase and is holder
  last_investigation: {         // For public announcement
    investigator_nickname: string;
    target_nickname: string;
  } | null;
}

// API request/response
export interface LadyInvestigateRequest {
  target_player_id: string;
}

export interface LadyInvestigateResponse {
  success: boolean;
  result: 'good' | 'evil';      // Only for Lady holder
  new_holder_id: string;
  new_holder_nickname: string;
}
```

---

## 5. API Contracts

### 5.1 POST /api/games/[gameId]/lady-investigate

**Purpose**: Submit Lady of the Lake investigation

**Request:**
```json
{
  "target_player_id": "uuid"
}
```

**Response (200):**
```json
{
  "data": {
    "success": true,
    "result": "good",
    "new_holder_id": "uuid",
    "new_holder_nickname": "Alice"
  }
}
```

**Error Responses:**
| Status | Code | Message |
|--------|------|---------|
| 400 | NOT_LADY_PHASE | Game is not in Lady of the Lake phase |
| 400 | INVALID_TARGET | Cannot investigate this player |
| 400 | ALREADY_INVESTIGATED | This player has already been investigated |
| 400 | CANNOT_INVESTIGATE_SELF | Cannot investigate yourself |
| 403 | NOT_LADY_HOLDER | You are not the Lady of the Lake holder |
| 404 | GAME_NOT_FOUND | Game not found |

### 5.2 GET /api/games/[gameId] (Updated)

**Add to response:**
```json
{
  "data": {
    "game": { ... },
    "players": [ ... ],
    "lady_of_lake": {
      "enabled": true,
      "holder_id": "uuid",
      "holder_nickname": "Bob",
      "investigated_player_ids": ["uuid1", "uuid2"],
      "is_holder": false,
      "can_investigate": false,
      "last_investigation": {
        "investigator_nickname": "Alice",
        "target_nickname": "Bob"
      }
    }
  }
}
```

---

## 6. Domain Logic

### 6.1 Lady Phase Trigger

```typescript
// src/lib/domain/lady-of-lake.ts

/**
 * Check if Lady phase should trigger after quest result
 */
export function shouldTriggerLadyPhase(
  questNumber: number,
  ladyEnabled: boolean,
  investigatedCount: number,
  totalPlayers: number
): boolean {
  // Only after Quest 2, 3, 4
  if (questNumber < 2 || questNumber > 4) return false;
  
  // Lady must be enabled
  if (!ladyEnabled) return false;
  
  // Must have valid targets (at least 1 uninvestigated player besides holder)
  const validTargetCount = totalPlayers - investigatedCount - 1; // -1 for holder
  return validTargetCount > 0;
}

/**
 * Get valid investigation targets
 */
export function getValidTargets(
  allPlayerIds: string[],
  investigatedIds: string[],
  holderId: string
): string[] {
  return allPlayerIds.filter(
    (id) => id !== holderId && !investigatedIds.includes(id)
  );
}

/**
 * Validate investigation target
 */
export function validateInvestigationTarget(
  targetId: string,
  holderId: string,
  investigatedIds: string[],
  allPlayerIds: string[]
): string | null {
  if (targetId === holderId) {
    return 'Cannot investigate yourself';
  }
  if (investigatedIds.includes(targetId)) {
    return 'This player has already been investigated';
  }
  if (!allPlayerIds.includes(targetId)) {
    return 'Invalid player';
  }
  return null; // Valid
}
```

---

## 7. Frontend Components

### 7.1 LadyOfLakePhase

Main component for Lady investigation selection.

```
┌─────────────────────────────────────────┐
│         🌊 Lady of the Lake 🌊          │
│                                          │
│  [For Lady Holder]                       │
│  Select a player to investigate:         │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 👤   │ │ 👤   │ │ 🚫   │ │ 👤   │   │
│  │Alice │ │ Bob  │ │Carol │ │ Dave │   │
│  │      │ │ ✓    │ │(inv.)│ │      │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                          │
│         [ 🔍 Investigate Bob ]          │
│                                          │
│  [For Other Players]                     │
│  Alice is using the Lady of the Lake... │
│  🌊 ~~~~~ 🌊                             │
└─────────────────────────────────────────┘
```

### 7.2 InvestigationResult

Shows result to Lady holder after investigation.

```
┌─────────────────────────────────────────┐
│                                          │
│              🌊 REVEALED 🌊              │
│                                          │
│           Bob's alignment is:            │
│                                          │
│         ╔═══════════════════╗           │
│         ║       EVIL        ║           │
│         ║        😈         ║           │
│         ╚═══════════════════╝           │
│                                          │
│    The Lady passes to Bob.               │
│                                          │
│           [ Continue ]                   │
│                                          │
└─────────────────────────────────────────┘
```

### 7.3 LadyHolderBadge

Small badge shown on player who holds Lady.

```tsx
// Added to PlayerSeats component
{player.hasLady && (
  <span className="absolute -top-1 -right-1 text-lg" title="Lady of the Lake">
    🌊
  </span>
)}
```

### 7.4 InvestigatedBadge

Small badge on investigated players.

```tsx
// Added to player cards
{player.wasInvestigated && (
  <span className="text-xs text-gray-400" title="Already investigated">
    👁️
  </span>
)}
```

---

## 8. Implementation Phases

### Phase 1: Database & Types (1-2 hours)
- [ ] Create migration `009_lady_of_lake_phase.sql`
- [ ] Add `lady_of_lake` to `game_phase` enum
- [ ] Create `lady_investigations` table
- [ ] Add `lady_holder_id` and `lady_enabled` to `games` table
- [ ] Update TypeScript types in `src/types/game.ts`

### Phase 2: Domain Logic (1-2 hours)
- [ ] Create `src/lib/domain/lady-of-lake.ts`
- [ ] Implement `shouldTriggerLadyPhase()`
- [ ] Implement `getValidTargets()`
- [ ] Implement `validateInvestigationTarget()`
- [ ] Update game state machine for `lady_of_lake` phase

### Phase 3: Supabase Queries (1-2 hours)
- [ ] Create `src/lib/supabase/lady-investigations.ts`
- [ ] Implement `createInvestigation()`
- [ ] Implement `getInvestigations()`
- [ ] Implement `getInvestigatedPlayerIds()`
- [ ] Update `src/lib/supabase/games.ts` for Lady holder

### Phase 4: API Endpoints (2-3 hours)
- [ ] Create `POST /api/games/[gameId]/lady-investigate/route.ts`
- [ ] Update `GET /api/games/[gameId]/route.ts` to include Lady state
- [ ] Update quest action API to trigger Lady phase

### Phase 5: Game Flow Integration (1-2 hours)
- [ ] Update `quest/action` API to check for Lady phase after quest
- [ ] Update `continue` API to transition from Lady phase
- [ ] Copy `lady_of_lake_holder_id` from room to game on game start
- [ ] Handle Lady phase skip when no valid targets

### Phase 6: Frontend Components (3-4 hours)
- [ ] Create `src/components/game/LadyOfLakePhase.tsx`
- [ ] Create `src/components/game/InvestigationResult.tsx`
- [ ] Add `LadyHolderBadge` to `PlayerSeats.tsx`
- [ ] Add `InvestigatedBadge` to player display
- [ ] Update `GameBoard.tsx` to render Lady phase

### Phase 7: Hook & State Updates (1-2 hours)
- [ ] Update `useGameState` hook to include Lady state
- [ ] Add Lady holder indicator to UI
- [ ] Show investigation announcement to all players

### Phase 8: Testing & Polish (1-2 hours)
- [ ] Test Lady phase with 7+ players
- [ ] Test edge cases (single target, all investigated)
- [ ] Test phase transitions
- [ ] Add loading states and error handling

---

## 9. File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `supabase/migrations/009_lady_of_lake_phase.sql` | Database migration |
| `src/lib/domain/lady-of-lake.ts` | Lady domain logic |
| `src/lib/supabase/lady-investigations.ts` | Database queries |
| `src/app/api/games/[gameId]/lady-investigate/route.ts` | Investigation API |
| `src/components/game/LadyOfLakePhase.tsx` | Main Lady UI |
| `src/components/game/InvestigationResult.tsx` | Result display |

### Modified Files
| File | Changes |
|------|---------|
| `src/types/game.ts` | Add Lady types, update GamePhase |
| `src/lib/domain/game-state-machine.ts` | Add Lady phase transitions |
| `src/app/api/games/[gameId]/route.ts` | Add Lady state to response |
| `src/app/api/games/[gameId]/quest/action/route.ts` | Trigger Lady phase |
| `src/app/api/games/[gameId]/continue/route.ts` | Handle Lady → team_building |
| `src/components/game/GameBoard.tsx` | Render Lady phase |
| `src/components/game/PlayerSeats.tsx` | Lady holder badge |
| `src/hooks/useGameState.ts` | Include Lady state |
| `src/lib/domain/game-start.ts` | Copy Lady holder to game |

---

## 10. Migration Notes

### Production Deployment Order

1. **Apply migration** `009_lady_of_lake_phase.sql` in Supabase
2. **Deploy code** to Vercel
3. **Verify** existing games continue working (Lady disabled)
4. **Test** new game with Lady enabled

### Backward Compatibility

- Existing games: Lady will be disabled (`lady_enabled = false`)
- New games: Lady enabled based on room configuration
- No data migration needed for existing games

---

## 11. Testing Checklist

### Happy Path
- [ ] Create game with 7+ players and Lady enabled
- [ ] Complete Quest 2 → Lady phase triggers
- [ ] Lady holder can select and investigate player
- [ ] Result shows correctly (Good/Evil)
- [ ] Lady token transfers to investigated player
- [ ] All players see public announcement
- [ ] Investigated player marked, cannot be selected again
- [ ] Quest 3 complete → Lady phase (new holder investigates)
- [ ] Quest 4 complete → Lady phase
- [ ] Quest 5 complete → No Lady phase (game ends)

### Edge Cases
- [ ] Game with Lady disabled → No Lady phase
- [ ] Only one valid target → UI shows, requires confirmation
- [ ] All players investigated → Lady phase skipped
- [ ] Lady holder is only uninvestigated → Lady phase skipped

### Error Cases
- [ ] Non-holder tries to investigate → 403 error
- [ ] Invalid target (already investigated) → 400 error
- [ ] Self-investigation attempt → 400 error

---

## 12. Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Database & Types | 1-2 hours | 2 hours |
| Domain Logic | 1-2 hours | 4 hours |
| Supabase Queries | 1-2 hours | 6 hours |
| API Endpoints | 2-3 hours | 9 hours |
| Game Flow Integration | 1-2 hours | 11 hours |
| Frontend Components | 3-4 hours | 15 hours |
| Hook & State Updates | 1-2 hours | 17 hours |
| Testing & Polish | 1-2 hours | 19 hours |

**Total Estimate: 12-19 hours**

---

## 13. Open Items

- [ ] Confirm Lady phase UI design with user
- [ ] Decide on animation style for Lady token transfer
- [ ] Consider adding sound effect for investigation

---

## Appendix A: SQL Migration Script

```sql
-- Full migration: 009_lady_of_lake_phase.sql
-- See section 3 for complete SQL
```

