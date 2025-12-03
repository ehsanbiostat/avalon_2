-- Avalon Online MVP: Realtime-Friendly RLS Policies
-- Migration: 004_realtime_policies.sql
-- Date: 2025-12-03
--
-- ISSUE: The original RLS policies require app.player_id to be set,
-- but browser clients connecting via Supabase Realtime don't have this.
-- This causes realtime events to be blocked.
--
-- SOLUTION: Add more permissive SELECT policies that allow realtime
-- updates for active game rooms. This is acceptable for MVP since:
-- 1. Room list is already public (anyone can see waiting rooms)
-- 2. Player names/connection status in a room is not sensitive
-- 3. Only roles remain private (which uses a separate policy)

-- ============================================
-- ROOM_PLAYERS TABLE - Realtime SELECT Policy
-- ============================================
-- Allow reading room_players for any active room (waiting or roles_distributed)
-- This enables realtime updates for the lobby player list

DROP POLICY IF EXISTS "Realtime room players read" ON room_players;

CREATE POLICY "Realtime room players read"
  ON room_players FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM rooms 
      WHERE status IN ('waiting', 'roles_distributed')
    )
  );

-- ============================================
-- ROOMS TABLE - Realtime SELECT Policy  
-- ============================================
-- Allow reading any active room
-- This enables realtime updates for room status changes

DROP POLICY IF EXISTS "Realtime rooms read" ON rooms;

CREATE POLICY "Realtime rooms read"
  ON rooms FOR SELECT
  USING (
    status IN ('waiting', 'roles_distributed', 'started')
  );

-- ============================================
-- PLAYER_ROLES TABLE - Keep Restrictive
-- ============================================
-- We do NOT add a permissive policy for player_roles
-- because roles must remain private to each player.
-- The existing policy only allows players to see their own role.
-- Realtime for role confirmations will work via the rooms table status.

-- ============================================
-- PLAYERS TABLE - Read by ID for Nicknames
-- ============================================
-- Allow reading any player's nickname (for display in lobby)
-- This is needed because room_players references players.id

DROP POLICY IF EXISTS "Anyone can read player nicknames" ON players;

CREATE POLICY "Anyone can read player nicknames"
  ON players FOR SELECT
  USING (true);

-- Note: The INSERT and UPDATE policies for players remain unchanged
-- (players can only modify their own records)

