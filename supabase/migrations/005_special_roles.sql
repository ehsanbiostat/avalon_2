-- Avalon Online MVP: Add Special Roles Support
-- Migration: 005_special_roles.sql
-- Date: 2025-12-03
-- Adds special character roles (Merlin, Assassin, etc.)

-- ============================================
-- ADD SPECIAL_ROLE COLUMN
-- ============================================

-- Create enum for special roles
CREATE TYPE special_role AS ENUM (
  'merlin',     -- Good - knows evil (except Mordred)
  'percival',   -- Good - knows Merlin (but Morgana looks the same)
  'servant',    -- Good - basic loyal servant
  'assassin',   -- Evil - can assassinate Merlin at end
  'morgana',    -- Evil - appears as Merlin to Percival
  'mordred',    -- Evil - hidden from Merlin
  'oberon',     -- Evil - doesn't know other evil
  'minion'      -- Evil - basic minion
);

-- Add special_role column to player_roles table
ALTER TABLE player_roles 
ADD COLUMN special_role special_role DEFAULT 'servant';

-- Update existing 'good' roles to 'servant'
UPDATE player_roles 
SET special_role = 'servant' 
WHERE role = 'good' AND special_role IS NULL;

-- Update existing 'evil' roles to 'minion'
UPDATE player_roles 
SET special_role = 'minion' 
WHERE role = 'evil' AND special_role IS NULL;

-- Make special_role NOT NULL after updating existing data
ALTER TABLE player_roles 
ALTER COLUMN special_role SET NOT NULL;

-- ============================================
-- INDEX FOR SPECIAL ROLE QUERIES
-- ============================================

CREATE INDEX idx_player_roles_special_role ON player_roles(special_role);

-- ============================================
-- COMMENT
-- ============================================

COMMENT ON COLUMN player_roles.special_role IS 'Specific character role (Merlin, Assassin, etc.)';

