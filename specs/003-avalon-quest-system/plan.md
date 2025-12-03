# Implementation Plan: Phase 3 – Quest System

**Feature**: 003-avalon-quest-system
**Created**: 2025-12-03
**Status**: Draft
**Estimated Complexity**: High (Core gameplay loop)

---

## Technical Context

### Existing Foundation (from Phases 1 & 2)

- **Database**: Supabase Postgres with `players`, `rooms`, `room_players`, `player_roles` tables
- **Authentication**: Player ID via localStorage + X-Player-ID header
- **Real-time**: Polling-based updates (3-second interval)
- **State**: Rooms have statuses: `waiting`, `roles_distributed`, `started`
- **Roles**: Full special role support (Merlin, Percival, Morgana, Mordred, Oberon, etc.)

### New Requirements

- Game state machine (phases beyond `started`)
- Quest tracking and progression
- Team proposals and voting
- Quest execution with secret actions
- Win condition detection
- Game history logging

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           QUEST SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐  │
│  │   Game     │    │   Quest    │    │  Proposal  │    │   Vote     │  │
│  │   State    │───▶│   Track    │───▶│   System   │───▶│   System   │  │
│  │  Machine   │    │            │    │            │    │            │  │
│  └────────────┘    └────────────┘    └────────────┘    └────────────┘  │
│        │                                                      │         │
│        │                                                      ▼         │
│        │           ┌────────────┐    ┌────────────┐    ┌────────────┐  │
│        │           │   Win      │◀───│   Quest    │◀───│   Action   │  │
│        └──────────▶│ Condition  │    │   Result   │    │   System   │  │
│                    │  Checker   │    │            │    │            │  │
│                    └────────────┘    └────────────┘    └────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Tables

#### `games` Table
```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- Game state
  phase game_phase NOT NULL DEFAULT 'team_building',
  current_quest INT NOT NULL DEFAULT 1,  -- 1-5
  current_leader_id UUID NOT NULL REFERENCES players(id),
  vote_track INT NOT NULL DEFAULT 0,     -- 0-5 rejections
  
  -- Results
  quest_results JSONB NOT NULL DEFAULT '[]',  -- [{quest: 1, result: 'success'}, ...]
  
  -- Seating order (randomized player IDs)
  seating_order UUID[] NOT NULL,
  leader_index INT NOT NULL DEFAULT 0,  -- Index into seating_order
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Winner (set when game ends)
  winner TEXT,  -- 'good', 'evil', NULL if ongoing
  win_reason TEXT,  -- '3_quests', '5_rejections', etc.
  
  UNIQUE(room_id)  -- One active game per room
);

CREATE TYPE game_phase AS ENUM (
  'team_building',    -- Leader selecting team
  'voting',           -- All players voting on team
  'quest',            -- Team executing quest
  'quest_result',     -- Showing quest result
  'game_over'         -- Game ended
);
```

#### `team_proposals` Table
```sql
CREATE TABLE team_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quest_number INT NOT NULL,
  proposal_number INT NOT NULL,  -- 1-5 for vote tracking
  leader_id UUID NOT NULL REFERENCES players(id),
  team_member_ids UUID[] NOT NULL,
  
  -- Status
  status proposal_status NOT NULL DEFAULT 'pending',
  
  -- Result
  approve_count INT DEFAULT 0,
  reject_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TYPE proposal_status AS ENUM (
  'pending',    -- Waiting for votes
  'approved',   -- Majority approved
  'rejected'    -- Majority rejected or tie
);
```

#### `votes` Table
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES team_proposals(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  vote vote_choice NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(proposal_id, player_id)  -- One vote per player per proposal
);

CREATE TYPE vote_choice AS ENUM ('approve', 'reject');
```

#### `quest_actions` Table
```sql
CREATE TABLE quest_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quest_number INT NOT NULL,
  player_id UUID NOT NULL REFERENCES players(id),
  action quest_action_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(game_id, quest_number, player_id)  -- One action per player per quest
);

CREATE TYPE quest_action_type AS ENUM ('success', 'fail');
```

#### `game_events` Table (History)
```sql
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_game_events_game_id ON game_events(game_id);
```

---

## API Contracts

### Game Initialization

#### POST `/api/games/[roomId]/start`
Start the game (called when transitioning from `roles_distributed` to gameplay).

**Request**: Empty body (manager must be authenticated)

**Response** (201):
```typescript
{
  data: {
    game_id: string;
    phase: 'team_building';
    current_quest: 1;
    current_leader_id: string;
    seating_order: string[];  // Player IDs in order
    quest_requirements: {
      1: { team_size: 2, fails_required: 1 },
      2: { team_size: 3, fails_required: 1 },
      // ...
    }
  }
}
```

---

### Team Building Phase

#### POST `/api/games/[gameId]/propose`
Propose a team for the current quest.

**Request**:
```typescript
{
  team_member_ids: string[];  // Exactly quest's team_size
}
```

**Response** (201):
```typescript
{
  data: {
    proposal_id: string;
    quest_number: number;
    proposal_number: number;  // 1-5
    team_member_ids: string[];
    leader_id: string;
  }
}
```

**Errors**:
- `NOT_LEADER`: Only current leader can propose
- `INVALID_TEAM_SIZE`: Wrong number of players
- `INVALID_PHASE`: Not in team_building phase

---

### Voting Phase

#### GET `/api/games/[gameId]/proposal/current`
Get current proposal and voting status.

**Response**:
```typescript
{
  data: {
    proposal_id: string;
    team_member_ids: string[];
    leader_id: string;
    votes_submitted: number;
    total_players: number;
    my_vote: 'approve' | 'reject' | null;
    all_votes?: { player_id: string; vote: string }[];  // Only after all voted
  }
}
```

#### POST `/api/games/[gameId]/vote`
Submit vote on current proposal.

**Request**:
```typescript
{
  vote: 'approve' | 'reject';
}
```

**Response** (200):
```typescript
{
  data: {
    recorded: true;
    votes_submitted: number;
    total_players: number;
  }
}
```

**Errors**:
- `ALREADY_VOTED`: Player already voted
- `INVALID_PHASE`: Not in voting phase

---

### Quest Execution Phase

#### GET `/api/games/[gameId]/quest/current`
Get current quest status.

**Response**:
```typescript
{
  data: {
    quest_number: number;
    team_member_ids: string[];
    is_team_member: boolean;
    can_submit_action: boolean;  // Team member who hasn't submitted
    actions_submitted: number;
    total_team_members: number;
    quest_result?: {  // Only after all submitted
      success_count: number;
      fail_count: number;
      outcome: 'success' | 'fail';
    }
  }
}
```

#### POST `/api/games/[gameId]/quest/action`
Submit quest action (team members only).

**Request**:
```typescript
{
  action: 'success' | 'fail';
}
```

**Response** (200):
```typescript
{
  data: {
    recorded: true;
    actions_submitted: number;
    total_team_members: number;
  }
}
```

**Errors**:
- `NOT_TEAM_MEMBER`: Player not on quest team
- `ALREADY_SUBMITTED`: Action already submitted
- `INVALID_ACTION`: Good player tried to submit 'fail'
- `INVALID_PHASE`: Not in quest phase

---

### Game State

#### GET `/api/games/[gameId]`
Get full game state.

**Response**:
```typescript
{
  data: {
    id: string;
    room_id: string;
    phase: GamePhase;
    current_quest: number;
    current_leader_id: string;
    vote_track: number;
    quest_results: QuestResult[];
    seating_order: string[];
    leader_index: number;
    players: {
      id: string;
      nickname: string;
      seat_position: number;
      is_leader: boolean;
      is_on_team: boolean;  // Current proposal
    }[];
    current_proposal?: Proposal;
    winner?: 'good' | 'evil';
    win_reason?: string;
  }
}
```

---

### Game History

#### GET `/api/games/[gameId]/history`
Get game event history.

**Response**:
```typescript
{
  data: {
    events: {
      type: string;
      data: object;
      created_at: string;
    }[];
    proposals: {
      quest_number: number;
      proposal_number: number;
      team_member_ids: string[];
      votes: { player_id: string; vote: string }[];
      status: string;
    }[];
    quest_results: {
      quest_number: number;
      outcome: string;
      success_count: number;
      fail_count: number;
    }[];
  }
}
```

---

## Frontend Components

### New Components

```
src/components/
├── game/
│   ├── GameBoard.tsx           # Main game container
│   ├── QuestTrack.tsx          # 5 quest slots with status
│   ├── VoteTrack.tsx           # 5 rejection markers
│   ├── SeatingCircle.tsx       # Players in circular arrangement
│   ├── PlayerSeat.tsx          # Individual player in circle
│   ├── LeaderBadge.tsx         # Crown indicator for leader
│   ├── TeamSelection.tsx       # Leader's team picker
│   ├── TeamProposal.tsx        # Display proposed team
│   ├── VotingPanel.tsx         # Approve/Reject buttons
│   ├── VoteReveal.tsx          # Show all votes after voting
│   ├── QuestExecution.tsx      # Success/Fail buttons for team
│   ├── QuestResult.tsx         # Show shuffled results
│   ├── GameOverScreen.tsx      # Winner announcement
│   ├── GameHistory.tsx         # Event log sidebar
│   └── QuestRequirements.tsx   # Show team size, fails needed
```

### Updated Components

```
src/components/
├── Lobby.tsx                   # Add "Start Game" transition
└── RoleRevealModal.tsx         # Keep role reference during game
```

### New Pages

```
src/app/
└── game/
    └── [code]/
        └── page.tsx            # Game view (update existing placeholder)
```

---

## Domain Logic

### New Modules

```
src/lib/domain/
├── quest-config.ts        # Quest requirements by player count
├── game-state.ts          # State machine transitions
├── team-validation.ts     # Validate team proposals
├── vote-calculator.ts     # Calculate vote outcomes
├── quest-resolver.ts      # Calculate quest success/fail
├── win-conditions.ts      # Check game end conditions
└── seating.ts             # Randomize seating, rotate leader
```

### Quest Configuration

```typescript
// src/lib/domain/quest-config.ts

export const QUEST_CONFIG: Record<number, QuestRequirement[]> = {
  5:  [{ size: 2, fails: 1 }, { size: 3, fails: 1 }, { size: 2, fails: 1 }, { size: 3, fails: 1 }, { size: 3, fails: 1 }],
  6:  [{ size: 2, fails: 1 }, { size: 3, fails: 1 }, { size: 4, fails: 1 }, { size: 3, fails: 1 }, { size: 4, fails: 1 }],
  7:  [{ size: 2, fails: 1 }, { size: 3, fails: 1 }, { size: 3, fails: 1 }, { size: 4, fails: 2 }, { size: 4, fails: 1 }],
  8:  [{ size: 3, fails: 1 }, { size: 4, fails: 1 }, { size: 4, fails: 1 }, { size: 5, fails: 2 }, { size: 5, fails: 1 }],
  9:  [{ size: 3, fails: 1 }, { size: 4, fails: 1 }, { size: 4, fails: 1 }, { size: 5, fails: 2 }, { size: 5, fails: 1 }],
  10: [{ size: 3, fails: 1 }, { size: 4, fails: 1 }, { size: 4, fails: 1 }, { size: 5, fails: 2 }, { size: 5, fails: 1 }],
};

export interface QuestRequirement {
  size: number;      // Team size required
  fails: number;     // Fails needed for quest to fail
}
```

---

## Implementation Phases

### Phase 3.1: Database & Types (Foundation)
1. Create migration for new tables (games, team_proposals, votes, quest_actions, game_events)
2. Create TypeScript types for all new entities
3. Create Supabase query functions
4. Update RLS policies for new tables

### Phase 3.2: Game Initialization
1. Create game start endpoint (POST /api/games/[roomId]/start)
2. Implement seating randomization
3. Implement leader selection
4. Create quest configuration logic
5. Update room status handling

### Phase 3.3: Team Building
1. Create team proposal endpoint
2. Implement team validation
3. Create TeamSelection component
4. Update game state on proposal

### Phase 3.4: Voting System
1. Create vote submission endpoint
2. Implement vote counting
3. Create VotingPanel component
4. Create VoteReveal component
5. Implement vote track updates
6. Handle 5-rejection Evil win

### Phase 3.5: Quest Execution
1. Create quest action endpoint
2. Implement action validation (Good can't fail)
3. Create QuestExecution component
4. Implement quest result calculation
5. Create QuestResult component

### Phase 3.6: Game Progression
1. Implement quest completion flow
2. Update quest track
3. Implement leader rotation
4. Handle game end conditions
5. Create GameOverScreen

### Phase 3.7: Game Board UI
1. Create main GameBoard layout
2. Create QuestTrack component
3. Create VoteTrack component
4. Create SeatingCircle component
5. Implement real-time updates

### Phase 3.8: History & Polish
1. Create game history tracking
2. Create GameHistory component
3. Add animations and transitions
4. Mobile responsiveness
5. Error handling improvements

---

## Key Technical Decisions

### 1. Seating Randomization
- Use Fisher-Yates shuffle algorithm
- Shuffle performed server-side at game start
- Stored in `games.seating_order` array

### 2. Vote Hiding
- Votes stored immediately but not revealed in API
- `all_votes` field only populated when all votes submitted
- Client polls until voting complete

### 3. Quest Action Security
- Server validates Good players can only submit 'success'
- Actions shuffled before returning results
- No timing-based information leaks

### 4. State Transitions
- All state changes happen server-side
- Client receives new state via polling
- Optimistic UI updates where appropriate

### 5. Polling Strategy
- Continue using 3-second polling interval
- Add specific endpoints for minimal data transfer
- Consider websocket upgrade in future

---

## Testing Strategy

### Unit Tests
- Quest configuration logic
- Vote calculation
- Quest result calculation
- Win condition detection
- Seating/leader rotation

### Integration Tests
- Full game flow API tests
- State transition validation
- Concurrent vote handling

### E2E Tests
- Complete 5-quest game
- Evil win by 5 rejections
- Good win by 3 successes
- Reconnection during game

---

## Migration Notes

### Database Migration Order
1. Create enums (game_phase, proposal_status, vote_choice, quest_action_type)
2. Create games table
3. Create team_proposals table
4. Create votes table
5. Create quest_actions table
6. Create game_events table
7. Create indexes
8. Create RLS policies

### Backward Compatibility
- Existing rooms with `started` status will need migration to games table
- Or: treat as new feature, existing `started` rooms stay as-is

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| State desync between clients | Medium | High | Frequent polling, server as source of truth |
| Vote timing attacks | Low | Medium | Server-side reveal only when complete |
| Quest action leaks | Low | High | Shuffle actions, no attribution |
| Complex state machine bugs | Medium | High | Comprehensive unit tests |
| Performance with history | Low | Medium | Pagination, lazy loading |


