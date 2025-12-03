-- Migration: 006_special_roles_config.sql
-- Phase 2: Special Roles & Configurations
-- Date: 2025-12-03
-- Description: Add role configuration and Lady of the Lake support

-- ============================================
-- EXTEND SPECIAL_ROLE ENUM
-- ============================================

-- Add new role values (PostgreSQL requires adding one at a time)
-- Note: 'percival' may already exist from MVP, using IF NOT EXISTS
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'percival';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'morgana';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'mordred';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'oberon_standard';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'oberon_chaos';

-- ============================================
-- EXTEND ROOMS TABLE
-- ============================================

-- Role configuration (JSONB for flexibility)
-- Default '{}' means Merlin + Assassin are implicit (always present)
-- Empty config = MVP behavior; additional roles are explicitly added
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS role_config JSONB DEFAULT '{}';

-- Lady of the Lake support
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS lady_of_lake_enabled BOOLEAN DEFAULT false;

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS lady_of_lake_holder_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- ============================================
-- EXTEND PLAYER_ROLES TABLE
-- ============================================

ALTER TABLE player_roles 
ADD COLUMN IF NOT EXISTS has_lady_of_lake BOOLEAN DEFAULT false;

-- ============================================
-- INDEXES
-- ============================================

-- Index for Lady of Lake holder lookup
CREATE INDEX IF NOT EXISTS idx_rooms_lady_holder 
ON rooms(lady_of_lake_holder_id) 
WHERE lady_of_lake_enabled = true;

-- Index for Lady of Lake in player_roles
CREATE INDEX IF NOT EXISTS idx_player_roles_lady 
ON player_roles(room_id) 
WHERE has_lady_of_lake = true;

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Ensure Lady holder is in the room (via trigger or check)
-- Note: Enforced via application logic since cross-table FK is complex

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN rooms.role_config IS 'JSONB configuration of special roles for this game. Empty {} = MVP default (Merlin + Assassin). Options: percival, morgana, mordred, oberon (standard/chaos), ladyOfLake.';
COMMENT ON COLUMN rooms.lady_of_lake_enabled IS 'Whether Lady of the Lake token is used in this game';
COMMENT ON COLUMN rooms.lady_of_lake_holder_id IS 'Player currently holding Lady of Lake (set after role distribution)';
COMMENT ON COLUMN player_roles.has_lady_of_lake IS 'Whether this player holds the Lady of Lake token';

