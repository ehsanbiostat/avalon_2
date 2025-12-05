# Data Model: Center Game Messages

**Feature**: 008-center-game-messages
**Date**: 2025-12-05
**Phase**: 1 - Design & Contracts

## Overview

**Status**: ✅ **N/A - No Data Model Changes Required**

This feature is a **frontend-only UI modification** that replaces static text with dynamic messages derived from existing game state. No database schema changes, new tables, or API modifications are needed.

---

## Existing Data Dependencies

This feature **consumes** existing data but does not modify the data model:

### Game State (Already Exists)

**Table**: `games`
**Relevant Fields**:
```typescript
{
  phase: 'team_building' | 'voting' | 'quest' | 'quest_result' | 'assassin' | 'lady_of_lake' | 'game_over',
  current_quest: number,          // 1-5
  current_leader_id: string,      // UUID
  player_count: number,           // Total players in game
  seating_order: string[],        // Array of player UUIDs
  // ... other fields not used by this feature
}
```

**Usage**: 
- `phase` → Determines which message template to use
- `current_quest` → Displayed in "Quest {N}" messages
- `current_leader_id` → Used to find leader's nickname
- `player_count` → Used to determine quest team size

### Player Data (Already Exists)

**Table**: `players`
**Relevant Fields**:
```typescript
{
  id: string,                     // UUID
  nickname: string,               // Display name
  // ... other fields not used
}
```

**Usage**:
- `nickname` → Displayed in "{Leader} is selecting a team" messages
- Must be truncated if >15 characters to fit center circle

### Quest Requirements (Already Exists)

**Domain Logic**: `lib/domain/quest-config.ts`
**Function**: `getQuestRequirement(playerCount, questNumber)`
```typescript
{
  size: number,                   // Required team size (2-5)
  failsRequired: number,          // Fails needed to fail quest
  // ... other fields not used
}
```

**Usage**:
- `size` → Displayed in "Select {size} players for the quest"

---

## Type Definitions

### New TypeScript Types (Component-Level)

These types are **not stored in the database**. They are ephemeral types used only for rendering:

```typescript
// Message structure for center display
interface CenterMessage {
  line1: string;        // Primary text (e.g., "Quest 1")
  line2: string;        // Secondary text (e.g., "Select 2 players")
}

// Helper type for message selection
type GamePhase = 
  | 'team_building' 
  | 'voting' 
  | 'quest' 
  | 'quest_result' 
  | 'assassin' 
  | 'lady_of_lake' 
  | 'game_over';

// Props for PlayerSeats component (updated)
interface PlayerSeatsProps {
  // ... existing props ...
  game: Game;                    // Full game state (already passed)
  players: GamePlayer[];         // Player info (already passed)
  currentPlayerId: string | null; // Current player's ID (already passed)
  questRequirement: QuestRequirement; // Quest config (already passed)
  // No new props needed - all data already available!
}
```

---

## Data Flow

**Read-Only Data Flow** (No Writes):

```
Database (Supabase)
  └── games table (phase, current_quest, current_leader_id)
  └── players table (nickname)
       ↓
  [Existing API: GET /api/games/{gameId}]
       ↓
  [Existing Hook: useGameState]
       ↓
  GameBoard component (already fetches all data)
       ↓
  PlayerSeats component (NEW: uses data for center message)
       ↓
  Center Circle Display (NEW: renders dynamic message)
```

**Key Point**: No new API calls, no new data fetching. All required data is already being fetched and passed to PlayerSeats via existing props.

---

## Validation & Constraints

### Input Validation (Defensive Rendering)

The component must handle these edge cases:

| Case | Validation | Fallback |
|------|------------|----------|
| Missing phase | `if (!game.phase)` | Display "Game in progress..." |
| Invalid quest number | `if (quest < 1 or > 5)` | Display quest 1 |
| Missing leader | `if (!leader)` | Display "Unknown" |
| Long nickname | `if (nickname.length > 15)` | Truncate to 15 chars + "..." |
| Undefined team size | `if (!questReq.size)` | Display "team" instead of number |

### Display Constraints

| Constraint | Requirement | Reason |
|------------|-------------|--------|
| Max text length | ~40 characters per line | Center circle is 128px wide |
| Font sizes | Line 1: text-lg, Line 2: text-sm | Readability in limited space |
| Contrast ratio | ≥ 4.5:1 (WCAG AA) | Accessibility requirement |
| Line breaks | Max 2 lines | Visual space limitation |

---

## State Management

**No State Changes Required**

This feature is **purely presentational**:
- ✅ Uses existing game state (read-only)
- ✅ No user input that modifies state
- ✅ No API calls from this component
- ✅ No local state except for message selection logic

**Existing State Flow**:
```
useGameState (polls every 3s)
  └── Fetches game.phase, game.current_quest, etc.
      └── React re-renders on state change
          └── PlayerSeats receives new props
              └── Center message updates automatically
```

**Performance**: Message updates happen automatically via existing polling mechanism (every 3 seconds). No additional performance considerations needed.

---

## Migration Requirements

**Database Migrations**: ✅ **None Required**

**Backward Compatibility**: ✅ **Fully Compatible**
- No breaking changes to existing data structures
- Component API remains backward compatible
- Old code (if any) using PlayerSeats continues to work
- Can deploy without coordinating with database changes

---

## Testing Data Requirements

For manual testing, need games in various phases:

| Test Scenario | Required Game State | How to Create |
|---------------|---------------------|---------------|
| Team building | phase = 'team_building' | Start new game, stop at team selection |
| Voting | phase = 'voting' | Propose a team |
| Quest execution | phase = 'quest' | After vote passes |
| Assassin phase | phase = 'assassin' | Good wins 3 quests |
| Lady of Lake | phase = 'lady_of_lake' | After quest with Lady enabled |
| Game over | phase = 'game_over' | Complete a full game |
| Long nickname | player with nickname > 15 chars | Create player with long name |

See [quickstart.md](./quickstart.md) for detailed test scenarios.

---

## Summary

**Data Model Impact**: **ZERO**

This feature is a pure UI change that:
- ✅ Reads existing data only
- ✅ Requires no database migrations
- ✅ Adds no new API endpoints
- ✅ Modifies no existing data structures
- ✅ Has no backward compatibility concerns

**Risk Level**: **Very Low** - Cannot break data integrity or existing features.

