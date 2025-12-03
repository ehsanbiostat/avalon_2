# Data Model: Avalon Online – MVP Lobby & Role Distribution

**Branch**: `001-avalon-mvp-lobby`
**Date**: 2025-12-02

This document defines the Supabase Postgres schema for the MVP.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     players     │       │      rooms      │       │  player_roles   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ player_id (UQ)  │◄──┐   │ code (UQ)       │   ┌──▶│ room_id (FK)    │
│ nickname        │   │   │ manager_id (FK) │───┘   │ player_id (FK)  │
│ created_at      │   │   │ expected_players│       │ role            │
│ updated_at      │   │   │ status          │       │ is_confirmed    │
└─────────────────┘   │   │ created_at      │       │ assigned_at     │
                      │   │ last_activity_at│       └─────────────────┘
                      │   └─────────────────┘
                      │            │
                      │            │
                      │   ┌────────┴────────┐
                      │   │  room_players   │
                      │   ├─────────────────┤
                      └───│ player_id (FK)  │
                          │ room_id (FK)    │
                          │ joined_at       │
                          │ is_connected    │
                          │ disconnected_at │
                          └─────────────────┘
```

---

## Tables

### 1. `players`

Stores player identity information. Each browser generates a unique `player_id` stored in localStorage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Internal primary key |
| `player_id` | `varchar(36)` | UNIQUE, NOT NULL | Client-generated UUID (from localStorage) |
| `nickname` | `varchar(20)` | NOT NULL | Display name (3-20 chars) |
| `created_at` | `timestamptz` | DEFAULT now() | First registration |
| `updated_at` | `timestamptz` | DEFAULT now() | Last nickname update |

**Indexes**:
- `players_player_id_idx` on `player_id` (unique lookup)

**Notes**:
- `player_id` is the client-side identifier; `id` is internal
- Nickname can be updated (player might use different names in different rooms)

---

### 2. `rooms`

Stores game room instances.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Internal primary key |
| `code` | `varchar(6)` | UNIQUE, NOT NULL | Public room code (e.g., "ABC123") |
| `manager_id` | `uuid` | FK → players.id, NOT NULL | Room creator/manager |
| `expected_players` | `smallint` | NOT NULL, CHECK (5-10) | Target player count |
| `status` | `varchar(20)` | NOT NULL, DEFAULT 'waiting' | Room state |
| `created_at` | `timestamptz` | DEFAULT now() | Room creation time |
| `last_activity_at` | `timestamptz` | DEFAULT now() | Last activity (for cleanup) |

**Status Values**:
- `waiting` - Room open for joining
- `roles_distributed` - Roles assigned, awaiting confirmations
- `started` - Game in progress (placeholder for MVP)

**Indexes**:
- `rooms_code_idx` on `code` (unique lookup)
- `rooms_status_idx` on `status` (filter active rooms)
- `rooms_last_activity_idx` on `last_activity_at` (cleanup queries)

**Constraints**:
- `CHECK (expected_players >= 5 AND expected_players <= 10)`
- `CHECK (status IN ('waiting', 'roles_distributed', 'started'))`

---

### 3. `room_players`

Junction table tracking which players are in which rooms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Internal primary key |
| `room_id` | `uuid` | FK → rooms.id, NOT NULL | Room reference |
| `player_id` | `uuid` | FK → players.id, NOT NULL | Player reference |
| `joined_at` | `timestamptz` | DEFAULT now() | When player joined |
| `is_connected` | `boolean` | DEFAULT true | Current connection status |
| `disconnected_at` | `timestamptz` | NULL | When player disconnected (for grace period) |

**Indexes**:
- `room_players_room_id_idx` on `room_id` (list players in room)
- `room_players_player_id_idx` on `player_id` (find player's room)
- `room_players_unique_idx` on `(room_id, player_id)` UNIQUE (prevent duplicates)

**Constraints**:
- Player can only be in one room at a time (enforced at application level, checked on join)

---

### 4. `player_roles`

Stores role assignments after distribution.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Internal primary key |
| `room_id` | `uuid` | FK → rooms.id, NOT NULL | Room reference |
| `player_id` | `uuid` | FK → players.id, NOT NULL | Player reference |
| `role` | `varchar(10)` | NOT NULL | Role type ('good' or 'evil') |
| `is_confirmed` | `boolean` | DEFAULT false | Player confirmed seeing role |
| `assigned_at` | `timestamptz` | DEFAULT now() | When role was assigned |

**Indexes**:
- `player_roles_room_id_idx` on `room_id` (get all roles in room)
- `player_roles_unique_idx` on `(room_id, player_id)` UNIQUE (one role per player per room)

**Constraints**:
- `CHECK (role IN ('good', 'evil'))`

---

## Row-Level Security (RLS) Policies

All tables have RLS enabled. Policies use `player_id` from request headers/context.

### `players` Table

```sql
-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Anyone can register (insert) a new player
CREATE POLICY "Anyone can register"
  ON players FOR INSERT
  WITH CHECK (true);

-- Players can only read their own record
CREATE POLICY "Players read own record"
  ON players FOR SELECT
  USING (player_id = current_setting('app.player_id', true));

-- Players can update their own nickname
CREATE POLICY "Players update own record"
  ON players FOR UPDATE
  USING (player_id = current_setting('app.player_id', true));
```

### `rooms` Table

```sql
-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can see waiting rooms (for active rooms list)
CREATE POLICY "Anyone can see waiting rooms"
  ON rooms FOR SELECT
  USING (status = 'waiting');

-- Room members can see their room regardless of status
CREATE POLICY "Members can see their room"
  ON rooms FOR SELECT
  USING (
    id IN (
      SELECT room_id FROM room_players
      WHERE player_id = (
        SELECT id FROM players
        WHERE player_id = current_setting('app.player_id', true)
      )
    )
  );

-- Room creation via API (service role bypasses RLS)
-- No direct INSERT policy for anon users

-- Only manager can update room
CREATE POLICY "Manager can update room"
  ON rooms FOR UPDATE
  USING (
    manager_id = (
      SELECT id FROM players
      WHERE player_id = current_setting('app.player_id', true)
    )
  );
```

### `room_players` Table

```sql
-- Enable RLS
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- Room members can see other players in their room
CREATE POLICY "Members see room players"
  ON room_players FOR SELECT
  USING (
    room_id IN (
      SELECT room_id FROM room_players rp
      INNER JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );

-- Insert/Update/Delete via API routes (service role)
-- No direct modification policies for anon users
```

### `player_roles` Table

```sql
-- Enable RLS
ALTER TABLE player_roles ENABLE ROW LEVEL SECURITY;

-- Players can only see their own role
CREATE POLICY "Players see own role"
  ON player_roles FOR SELECT
  USING (
    player_id = (
      SELECT id FROM players
      WHERE player_id = current_setting('app.player_id', true)
    )
  );

-- Players can update their own confirmation status
CREATE POLICY "Players confirm own role"
  ON player_roles FOR UPDATE
  USING (
    player_id = (
      SELECT id FROM players
      WHERE player_id = current_setting('app.player_id', true)
    )
  )
  WITH CHECK (
    -- Can only update is_confirmed, not role
    role = (SELECT role FROM player_roles WHERE id = player_roles.id)
  );

-- Insert via API routes (service role)
```

---

## Database Functions

### `get_evil_teammates(room_uuid, player_uuid)`

Returns list of Evil player nicknames for a given Evil player.

```sql
CREATE OR REPLACE FUNCTION get_evil_teammates(
  p_room_id uuid,
  p_player_id uuid
)
RETURNS TABLE (nickname varchar) AS $$
BEGIN
  -- Verify the requesting player is Evil
  IF NOT EXISTS (
    SELECT 1 FROM player_roles
    WHERE room_id = p_room_id
      AND player_id = p_player_id
      AND role = 'evil'
  ) THEN
    RETURN; -- Empty result for non-Evil players
  END IF;

  -- Return other Evil players' nicknames
  RETURN QUERY
  SELECT p.nickname
  FROM player_roles pr
  INNER JOIN players p ON pr.player_id = p.id
  WHERE pr.room_id = p_room_id
    AND pr.role = 'evil'
    AND pr.player_id != p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `cleanup_stale_rooms()`

Deletes rooms past their inactivity threshold. Called by scheduled job.

```sql
CREATE OR REPLACE FUNCTION cleanup_stale_rooms()
RETURNS void AS $$
BEGIN
  -- Delete waiting rooms inactive for 24 hours
  DELETE FROM rooms
  WHERE status = 'waiting'
    AND last_activity_at < NOW() - INTERVAL '24 hours';

  -- Delete started rooms inactive for 48 hours
  DELETE FROM rooms
  WHERE status IN ('roles_distributed', 'started')
    AND last_activity_at < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql;
```

---

## Migration SQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create players table
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id varchar(36) UNIQUE NOT NULL,
  nickname varchar(20) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX players_player_id_idx ON players(player_id);

-- Create rooms table
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(6) UNIQUE NOT NULL,
  manager_id uuid NOT NULL REFERENCES players(id),
  expected_players smallint NOT NULL CHECK (expected_players >= 5 AND expected_players <= 10),
  status varchar(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'roles_distributed', 'started')),
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now()
);

CREATE INDEX rooms_code_idx ON rooms(code);
CREATE INDEX rooms_status_idx ON rooms(status);
CREATE INDEX rooms_last_activity_idx ON rooms(last_activity_at);

-- Create room_players table
CREATE TABLE room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  joined_at timestamptz DEFAULT now(),
  is_connected boolean DEFAULT true,
  disconnected_at timestamptz
);

CREATE INDEX room_players_room_id_idx ON room_players(room_id);
CREATE INDEX room_players_player_id_idx ON room_players(player_id);
CREATE UNIQUE INDEX room_players_unique_idx ON room_players(room_id, player_id);

-- Create player_roles table
CREATE TABLE player_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  role varchar(10) NOT NULL CHECK (role IN ('good', 'evil')),
  is_confirmed boolean DEFAULT false,
  assigned_at timestamptz DEFAULT now()
);

CREATE INDEX player_roles_room_id_idx ON player_roles(room_id);
CREATE UNIQUE INDEX player_roles_unique_idx ON player_roles(room_id, player_id);

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_roles;
```

---

## TypeScript Types

Generated types for use in the application:

```typescript
// types/database.ts

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          player_id: string;
          nickname: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          nickname: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          nickname?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          manager_id: string;
          expected_players: number;
          status: 'waiting' | 'roles_distributed' | 'started';
          created_at: string;
          last_activity_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          manager_id: string;
          expected_players: number;
          status?: 'waiting' | 'roles_distributed' | 'started';
          created_at?: string;
          last_activity_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          manager_id?: string;
          expected_players?: number;
          status?: 'waiting' | 'roles_distributed' | 'started';
          created_at?: string;
          last_activity_at?: string;
        };
      };
      room_players: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          joined_at: string;
          is_connected: boolean;
          disconnected_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          joined_at?: string;
          is_connected?: boolean;
          disconnected_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          joined_at?: string;
          is_connected?: boolean;
          disconnected_at?: string | null;
        };
      };
      player_roles: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          role: 'good' | 'evil';
          is_confirmed: boolean;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          role: 'good' | 'evil';
          is_confirmed?: boolean;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          role?: 'good' | 'evil';
          is_confirmed?: boolean;
          assigned_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type Player = Database['public']['Tables']['players']['Row'];
export type Room = Database['public']['Tables']['rooms']['Row'];
export type RoomPlayer = Database['public']['Tables']['room_players']['Row'];
export type PlayerRole = Database['public']['Tables']['player_roles']['Row'];
export type RoomStatus = Room['status'];
export type Role = PlayerRole['role'];
```
