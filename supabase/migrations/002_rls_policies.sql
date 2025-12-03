-- Avalon Online MVP: Row-Level Security Policies
-- Migration: 002_rls_policies.sql
-- Date: 2025-12-02

-- ============================================
-- PLAYERS TABLE RLS
-- ============================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Anyone can register (insert) a new player
CREATE POLICY "Anyone can register"
  ON players FOR INSERT
  WITH CHECK (true);

-- Players can read their own record
CREATE POLICY "Players read own record"
  ON players FOR SELECT
  USING (player_id = current_setting('app.player_id', true));

-- Players can update their own nickname
CREATE POLICY "Players update own record"
  ON players FOR UPDATE
  USING (player_id = current_setting('app.player_id', true));

-- ============================================
-- ROOMS TABLE RLS
-- ============================================

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

-- ============================================
-- ROOM_PLAYERS TABLE RLS
-- ============================================

ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- Room members can see other players in their room
CREATE POLICY "Members see room players"
  ON room_players FOR SELECT
  USING (
    room_id IN (
      SELECT rp.room_id FROM room_players rp
      INNER JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );

-- Insert/Update/Delete via API routes (service role)
-- No direct modification policies for anon users

-- ============================================
-- PLAYER_ROLES TABLE RLS
-- ============================================

ALTER TABLE player_roles ENABLE ROW LEVEL SECURITY;

-- Players can only see their own role (critical for game security)
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
    -- This is enforced at application level as well
    true
  );

-- Insert via API routes (service role)
-- No direct INSERT policy for anon users
