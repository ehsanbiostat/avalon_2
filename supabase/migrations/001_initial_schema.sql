-- Avalon Online MVP: Initial Schema
-- Migration: 001_initial_schema.sql
-- Date: 2025-12-02

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLAYERS TABLE
-- ============================================
-- Stores player identity information
-- Each browser generates a unique player_id stored in localStorage

CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id varchar(36) UNIQUE NOT NULL,
  nickname varchar(20) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by client-side player_id
CREATE INDEX players_player_id_idx ON players(player_id);

COMMENT ON TABLE players IS 'Player identity registry - maps localStorage UUID to nickname';
COMMENT ON COLUMN players.player_id IS 'Client-generated UUID stored in browser localStorage';
COMMENT ON COLUMN players.nickname IS 'Display name (3-20 characters)';

-- ============================================
-- ROOMS TABLE
-- ============================================
-- Stores game room instances

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(6) UNIQUE NOT NULL,
  manager_id uuid NOT NULL REFERENCES players(id),
  expected_players smallint NOT NULL CHECK (expected_players >= 5 AND expected_players <= 10),
  status varchar(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'roles_distributed', 'started')),
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX rooms_code_idx ON rooms(code);
CREATE INDEX rooms_status_idx ON rooms(status);
CREATE INDEX rooms_last_activity_idx ON rooms(last_activity_at);

COMMENT ON TABLE rooms IS 'Game room instances';
COMMENT ON COLUMN rooms.code IS 'Public 6-character room code (e.g., "ABC123")';
COMMENT ON COLUMN rooms.manager_id IS 'Player who created and manages the room';
COMMENT ON COLUMN rooms.expected_players IS 'Target player count (5-10)';
COMMENT ON COLUMN rooms.status IS 'Room state: waiting, roles_distributed, or started';
COMMENT ON COLUMN rooms.last_activity_at IS 'Timestamp for cleanup job (updated on any action)';

-- ============================================
-- ROOM_PLAYERS TABLE
-- ============================================
-- Junction table tracking which players are in which rooms

CREATE TABLE room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  joined_at timestamptz DEFAULT now(),
  is_connected boolean DEFAULT true,
  disconnected_at timestamptz
);

-- Indexes for common queries
CREATE INDEX room_players_room_id_idx ON room_players(room_id);
CREATE INDEX room_players_player_id_idx ON room_players(player_id);
CREATE UNIQUE INDEX room_players_unique_idx ON room_players(room_id, player_id);

COMMENT ON TABLE room_players IS 'Junction table: players currently in each room';
COMMENT ON COLUMN room_players.is_connected IS 'Current connection status (for disconnect/reconnect handling)';
COMMENT ON COLUMN room_players.disconnected_at IS 'Timestamp when player disconnected (for grace period)';

-- ============================================
-- PLAYER_ROLES TABLE
-- ============================================
-- Stores role assignments after distribution

CREATE TABLE player_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  role varchar(10) NOT NULL CHECK (role IN ('good', 'evil')),
  is_confirmed boolean DEFAULT false,
  assigned_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX player_roles_room_id_idx ON player_roles(room_id);
CREATE UNIQUE INDEX player_roles_unique_idx ON player_roles(room_id, player_id);

COMMENT ON TABLE player_roles IS 'Role assignments for each player in a room';
COMMENT ON COLUMN player_roles.role IS 'Role type: good (Loyal Servant) or evil (Minion)';
COMMENT ON COLUMN player_roles.is_confirmed IS 'Whether player has confirmed seeing their role';

-- ============================================
-- ENABLE REALTIME
-- ============================================
-- Enable Supabase Realtime for relevant tables

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_roles;
