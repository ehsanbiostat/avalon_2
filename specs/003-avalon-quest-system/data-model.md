# Data Model: Phase 3 – Quest System

**Feature**: 003-avalon-quest-system
**Created**: 2025-12-03

---

## Schema Overview

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   rooms     │────▶│      games      │────▶│team_proposals│
│             │     │                 │     │             │
└─────────────┘     └────────┬────────┘     └──────┬──────┘
                             │                     │
                             │                     ▼
                    ┌────────┴────────┐     ┌─────────────┐
                    │  quest_actions  │     │    votes    │
                    │                 │     │             │
                    └─────────────────┘     └─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  game_events    │
                    │                 │
                    └─────────────────┘
```

---

## New Enums

### `game_phase`
```sql
CREATE TYPE game_phase AS ENUM (
  'team_building',    -- Leader selecting team
  'voting',           -- All players voting on team
  'quest',            -- Team executing quest
  'quest_result',     -- Showing quest result
  'game_over'         -- Game ended
);
```

### `proposal_status`
```sql
CREATE TYPE proposal_status AS ENUM (
  'pending',    -- Waiting for votes
  'approved',   -- Majority approved
  'rejected'    -- Majority rejected or tie
);
```

### `vote_choice`
```sql
CREATE TYPE vote_choice AS ENUM ('approve', 'reject');
```

### `quest_action_type`
```sql
CREATE TYPE quest_action_type AS ENUM ('success', 'fail');
```

---

## New Tables

### `games`

Primary game state table. One game per room. Created automatically when all players confirm roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique game identifier |
| `room_id` | UUID | FK rooms(id), UNIQUE, NOT NULL | Associated room |
| `player_count` | INT | NOT NULL | Number of players (5-10), for quest requirements |
| `phase` | game_phase | NOT NULL, DEFAULT 'team_building' | Current game phase |
| `current_quest` | INT | NOT NULL, DEFAULT 1 | Quest number (1-5) |
| `current_leader_id` | UUID | FK players(id), NOT NULL | Current team leader |
| `vote_track` | INT | NOT NULL, DEFAULT 0 | Consecutive rejections (0-5) |
| `quest_results` | JSONB | NOT NULL, DEFAULT '[]' | Array of quest outcomes |
| `seating_order` | UUID[] | NOT NULL | Randomized player order |
| `leader_index` | INT | NOT NULL, DEFAULT 0 | Index into seating_order |
| `winner` | TEXT | NULL | 'good', 'evil', or NULL |
| `win_reason` | TEXT | NULL | Reason for win |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Game start time |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update time |
| `ended_at` | TIMESTAMPTZ | NULL | Game end time |

**Indexes:**
- `idx_games_room_id` ON (room_id)

---

### `team_proposals`

Track each team proposal for voting.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique proposal ID |
| `game_id` | UUID | FK games(id), NOT NULL | Associated game |
| `quest_number` | INT | NOT NULL | Quest this proposal is for (1-5) |
| `proposal_number` | INT | NOT NULL | Proposal attempt (1-5) |
| `leader_id` | UUID | FK players(id), NOT NULL | Who proposed |
| `team_member_ids` | UUID[] | NOT NULL | Selected team members |
| `status` | proposal_status | NOT NULL, DEFAULT 'pending' | Proposal status |
| `approve_count` | INT | DEFAULT 0 | Approval votes |
| `reject_count` | INT | DEFAULT 0 | Rejection votes |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Proposal time |
| `resolved_at` | TIMESTAMPTZ | NULL | When voting completed |

**Indexes:**
- `idx_proposals_game_id` ON (game_id)
- `idx_proposals_game_quest` ON (game_id, quest_number)

---

### `votes`

Individual player votes on team proposals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique vote ID |
| `proposal_id` | UUID | FK team_proposals(id), NOT NULL | Proposal voted on |
| `player_id` | UUID | FK players(id), NOT NULL | Who voted |
| `vote` | vote_choice | NOT NULL | 'approve' or 'reject' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vote time |

**Constraints:**
- UNIQUE(proposal_id, player_id) — One vote per player per proposal

**Indexes:**
- `idx_votes_proposal_id` ON (proposal_id)

---

### `quest_actions`

Secret actions submitted by quest team members.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique action ID |
| `game_id` | UUID | FK games(id), NOT NULL | Associated game |
| `quest_number` | INT | NOT NULL | Quest number (1-5) |
| `player_id` | UUID | FK players(id), NOT NULL | Who submitted |
| `action` | quest_action_type | NOT NULL | 'success' or 'fail' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Submission time |

**Constraints:**
- UNIQUE(game_id, quest_number, player_id) — One action per player per quest

**Indexes:**
- `idx_quest_actions_game_quest` ON (game_id, quest_number)

---

### `game_events`

Audit log of all game events for history display.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique event ID |
| `game_id` | UUID | FK games(id), NOT NULL | Associated game |
| `event_type` | TEXT | NOT NULL | Event type identifier |
| `event_data` | JSONB | NOT NULL, DEFAULT '{}' | Event payload |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event time |

**Event Types:**
- `game_started` — Game began
- `team_proposed` — Leader proposed team
- `vote_submitted` — Player voted (hidden until reveal)
- `votes_revealed` — All votes shown
- `quest_started` — Team going on quest
- `quest_action` — Player submitted action (hidden)
- `quest_completed` — Quest result revealed
- `game_ended` — Winner determined

**Indexes:**
- `idx_game_events_game_id` ON (game_id)
- `idx_game_events_created_at` ON (game_id, created_at)

---

## JSONB Structures

### `quest_results` (in games table)
```typescript
type QuestResults = {
  quest: number;           // 1-5
  result: 'success' | 'fail';
  success_count: number;   // Cards played
  fail_count: number;      // Cards played
  team_member_ids: string[];
  completed_at: string;    // ISO timestamp
}[];
```

### `event_data` Examples

**game_started:**
```json
{
  "seating_order": ["uuid1", "uuid2", ...],
  "first_leader_id": "uuid1",
  "player_count": 7
}
```

**team_proposed:**
```json
{
  "quest_number": 1,
  "proposal_number": 1,
  "leader_id": "uuid1",
  "team_member_ids": ["uuid1", "uuid3"]
}
```

**votes_revealed:**
```json
{
  "proposal_id": "uuid",
  "votes": [
    { "player_id": "uuid1", "vote": "approve" },
    { "player_id": "uuid2", "vote": "reject" }
  ],
  "result": "approved",
  "approve_count": 4,
  "reject_count": 3
}
```

**quest_completed:**
```json
{
  "quest_number": 2,
  "result": "fail",
  "success_count": 2,
  "fail_count": 1,
  "team_size": 3
}
```

**game_ended:**
```json
{
  "winner": "evil",
  "win_reason": "3_quest_failures",
  "final_score": { "good": 2, "evil": 3 }
}
```

---

## Row-Level Security Policies

### `games` Table

```sql
-- Anyone in the room can read game state
CREATE POLICY "Room members can read game"
  ON games FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM room_players rp
      JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );

-- Only server can insert/update (via service role)
CREATE POLICY "Service role manages games"
  ON games FOR ALL
  USING (auth.role() = 'service_role');
```

### `team_proposals` Table

```sql
-- Room members can read proposals
CREATE POLICY "Room members can read proposals"
  ON team_proposals FOR SELECT
  USING (
    game_id IN (
      SELECT g.id FROM games g
      JOIN room_players rp ON g.room_id = rp.room_id
      JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );
```

### `votes` Table

```sql
-- Players can read their own vote immediately
CREATE POLICY "Players can read own vote"
  ON votes FOR SELECT
  USING (
    player_id = (
      SELECT id FROM players
      WHERE player_id = current_setting('app.player_id', true)
    )
  );

-- All votes visible after proposal resolved
CREATE POLICY "All votes visible after resolved"
  ON votes FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM team_proposals
      WHERE status != 'pending'
    )
  );
```

### `quest_actions` Table

```sql
-- Quest actions are NEVER directly readable
-- Results are computed and returned via API
-- This prevents timing attacks and information leaks
CREATE POLICY "Quest actions server only"
  ON quest_actions FOR ALL
  USING (auth.role() = 'service_role');
```

### `game_events` Table

```sql
-- Room members can read events
CREATE POLICY "Room members can read events"
  ON game_events FOR SELECT
  USING (
    game_id IN (
      SELECT g.id FROM games g
      JOIN room_players rp ON g.room_id = rp.room_id
      JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );
```

---

## TypeScript Types

```typescript
// src/types/game.ts

export type GamePhase = 
  | 'team_building' 
  | 'voting' 
  | 'quest' 
  | 'quest_result' 
  | 'game_over';

export type ProposalStatus = 'pending' | 'approved' | 'rejected';
export type VoteChoice = 'approve' | 'reject';
export type QuestActionType = 'success' | 'fail';
export type GameWinner = 'good' | 'evil';

export interface Game {
  id: string;
  room_id: string;
  player_count: number;  // 5-10, for quest requirements lookup
  phase: GamePhase;
  current_quest: number;
  current_leader_id: string;
  vote_track: number;
  quest_results: QuestResult[];
  seating_order: string[];
  leader_index: number;
  winner: GameWinner | null;
  win_reason: string | null;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
}

export interface QuestResult {
  quest: number;
  result: 'success' | 'fail';
  success_count: number;
  fail_count: number;
  team_member_ids: string[];
  completed_at: string;
}

export interface TeamProposal {
  id: string;
  game_id: string;
  quest_number: number;
  proposal_number: number;
  leader_id: string;
  team_member_ids: string[];
  status: ProposalStatus;
  approve_count: number;
  reject_count: number;
  created_at: string;
  resolved_at: string | null;
}

export interface Vote {
  id: string;
  proposal_id: string;
  player_id: string;
  vote: VoteChoice;
  created_at: string;
}

export interface QuestAction {
  id: string;
  game_id: string;
  quest_number: number;
  player_id: string;
  action: QuestActionType;
  created_at: string;
}

export interface GameEvent {
  id: string;
  game_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

// Quest configuration
export interface QuestRequirement {
  size: number;      // Team size
  fails: number;     // Fails needed for quest to fail
}

// Full game state for client
export interface GameState {
  game: Game;
  players: GamePlayer[];
  current_proposal: TeamProposal | null;
  my_vote: VoteChoice | null;
  votes_submitted: number;
  am_team_member: boolean;
  can_submit_action: boolean;
  quest_requirement: QuestRequirement;
}

export interface GamePlayer {
  id: string;
  nickname: string;
  seat_position: number;
  is_leader: boolean;
  is_on_team: boolean;
  has_voted: boolean;
  is_connected: boolean;
}
```

---

## Migration File

See `supabase/migrations/007_quest_system.sql` for the complete migration.


