-- Migration: Add Lunatic and Brute special roles (Big Box expansion)
-- Feature: 020-lunatic-brute-roles
-- Date: 2026-01-02

-- Update the CHECK constraint on player_roles.special_role to include new values
ALTER TABLE player_roles
DROP CONSTRAINT IF EXISTS player_roles_special_role_check;

ALTER TABLE player_roles
ADD CONSTRAINT player_roles_special_role_check
CHECK (special_role IN (
  'merlin',
  'percival',
  'servant',
  'assassin',
  'morgana',
  'mordred',
  'oberon_standard',
  'oberon_chaos',
  'minion',
  'lunatic',    -- NEW: Big Box - Must fail every quest
  'brute'       -- NEW: Big Box - Can only fail quests 1-3
));

-- Add comment for documentation
COMMENT ON CONSTRAINT player_roles_special_role_check ON player_roles IS
  'Valid special roles including Big Box expansion roles (lunatic, brute)';
