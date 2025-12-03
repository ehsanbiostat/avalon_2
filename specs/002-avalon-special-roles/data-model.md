# Data Model: Phase 2 – Special Roles & Configurations

**Feature**: 002-avalon-special-roles
**Date**: 2025-12-03
**Extends**: MVP schema from 001-avalon-mvp-lobby

## Overview

This document describes the database schema changes needed to support configurable special roles and Lady of the Lake setup. All changes are additive and backward compatible.

## Schema Changes

### rooms Table (Extended)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `role_config` | JSONB | `'{"roles":["merlin","assassin"]}'` | Role configuration for the game |
| `lady_of_lake_enabled` | BOOLEAN | `false` | Whether Lady of Lake is active |
| `lady_of_lake_holder_id` | UUID | NULL | Player who starts with Lady of Lake |

### player_roles Table (Extended)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `has_lady_of_lake` | BOOLEAN | `false` | Whether this player holds Lady of Lake |

### special_role Enum (Extended)

New values added to existing enum:

```sql
-- Existing values
'merlin', 'servant', 'assassin', 'minion'

-- New values (Phase 2)
'percival'        -- Good: sees Merlin candidates
'morgana'         -- Evil: appears as Merlin to Percival
'mordred'         -- Evil: hidden from Merlin
'oberon_standard' -- Evil: visible to Merlin, hidden from evil team
'oberon_chaos'    -- Evil: hidden from everyone
```

## Role Configuration Schema

The `role_config` JSONB column stores the game's role setup:

```typescript
interface RoleConfig {
  // Implicit: merlin and assassin are always included
  
  // Optional Good roles (max 1 each)
  percival?: boolean;
  
  // Optional Evil roles (max 1 each)
  morgana?: boolean;
  mordred?: boolean;
  oberon?: 'standard' | 'chaos';
  
  // Game options
  ladyOfLake?: boolean;
}
```

### Example Configurations

**Default (MVP behavior):**
```json
{}
```
Implies: Merlin, Assassin, Loyal Servants, Minions

**5-player with Percival + Morgana:**
```json
{
  "percival": true,
  "morgana": true
}
```
Roles: Merlin, Percival, Servant (Good), Assassin, Morgana (Evil)

**7-player advanced:**
```json
{
  "percival": true,
  "morgana": true,
  "mordred": true,
  "ladyOfLake": true
}
```
Roles: Merlin, Percival, 2× Servant (Good), Assassin, Morgana, Mordred (Evil)

**10-player with Oberon Chaos:**
```json
{
  "percival": true,
  "morgana": true,
  "mordred": true,
  "oberon": "chaos",
  "ladyOfLake": true
}
```
Roles: Merlin, Percival, 4× Servant (Good), Assassin, Morgana, Mordred, Oberon (Evil)

## Migration SQL

```sql
-- Migration: 006_special_roles_config.sql
-- Phase 2: Special Roles & Configurations
-- Date: 2025-12-03

-- ============================================
-- EXTEND SPECIAL_ROLE ENUM
-- ============================================

-- Add new role values (PostgreSQL requires adding one at a time)
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'percival';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'morgana';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'mordred';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'oberon_standard';
ALTER TYPE special_role ADD VALUE IF NOT EXISTS 'oberon_chaos';

-- ============================================
-- EXTEND ROOMS TABLE
-- ============================================

-- Role configuration (JSONB for flexibility)
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

COMMENT ON COLUMN rooms.role_config IS 'JSONB configuration of special roles for this game';
COMMENT ON COLUMN rooms.lady_of_lake_enabled IS 'Whether Lady of the Lake token is used';
COMMENT ON COLUMN rooms.lady_of_lake_holder_id IS 'Player currently holding Lady of Lake (after distribution)';
COMMENT ON COLUMN player_roles.has_lady_of_lake IS 'Whether this player holds the Lady of Lake token';
```

## Role Distribution Logic

### Role Pool Generation

Given `role_config` and `player_count`:

```typescript
function generateRolePool(config: RoleConfig, goodCount: number, evilCount: number): SpecialRole[] {
  const goodRoles: SpecialRole[] = ['merlin'];
  const evilRoles: SpecialRole[] = ['assassin'];
  
  // Add optional Good roles
  if (config.percival) goodRoles.push('percival');
  
  // Add optional Evil roles
  if (config.morgana) evilRoles.push('morgana');
  if (config.mordred) evilRoles.push('mordred');
  if (config.oberon === 'standard') evilRoles.push('oberon_standard');
  if (config.oberon === 'chaos') evilRoles.push('oberon_chaos');
  
  // Fill remaining slots
  while (goodRoles.length < goodCount) {
    goodRoles.push('servant');
  }
  while (evilRoles.length < evilCount) {
    evilRoles.push('minion');
  }
  
  return [...goodRoles, ...evilRoles];
}
```

### Lady of Lake Designation

```typescript
function designateLadyOfLakeHolder(
  players: Player[],       // Ordered by join time
  managerId: string
): string {
  const managerIndex = players.findIndex(p => p.id === managerId);
  const holderIndex = (managerIndex + 1) % players.length;
  return players[holderIndex].id;
}
```

## Visibility Rules (Database Level)

The visibility rules are enforced in application logic, but can be queried:

### Get Evil Players Visible to Merlin

```sql
-- Returns evil players that Merlin can see
SELECT p.nickname, pr.special_role
FROM player_roles pr
JOIN players p ON pr.player_id = p.id
WHERE pr.room_id = :room_id
  AND pr.role = 'evil'
  AND pr.special_role NOT IN ('mordred', 'oberon_chaos');
```

### Get Merlin Candidates for Percival

```sql
-- Returns players that appear as "Merlin" to Percival
SELECT p.nickname, pr.special_role
FROM player_roles pr
JOIN players p ON pr.player_id = p.id
WHERE pr.room_id = :room_id
  AND pr.special_role IN ('merlin', 'morgana');
```

### Get Evil Teammates (excluding Oberon)

```sql
-- Returns evil teammates visible to a non-Oberon evil player
SELECT p.nickname, pr.special_role
FROM player_roles pr
JOIN players p ON pr.player_id = p.id
WHERE pr.room_id = :room_id
  AND pr.role = 'evil'
  AND pr.player_id != :my_player_id
  AND pr.special_role NOT IN ('oberon_standard', 'oberon_chaos');
```

## TypeScript Types

```typescript
// src/types/role-config.ts

export type OberonMode = 'standard' | 'chaos';

export interface RoleConfig {
  percival?: boolean;
  morgana?: boolean;
  mordred?: boolean;
  oberon?: OberonMode;
  ladyOfLake?: boolean;
}

export interface RoleConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Extended from MVP
export type SpecialRole = 
  | 'merlin'
  | 'percival'
  | 'servant'
  | 'assassin'
  | 'morgana'
  | 'mordred'
  | 'oberon_standard'
  | 'oberon_chaos'
  | 'minion';

// src/types/database.ts (updates)

export interface Room {
  // ... existing fields ...
  role_config: RoleConfig;
  lady_of_lake_enabled: boolean;
  lady_of_lake_holder_id: string | null;
}

export interface PlayerRole {
  // ... existing fields ...
  has_lady_of_lake: boolean;
}
```

## Backward Compatibility

- Empty `role_config` (`{}`) defaults to MVP behavior (Merlin + Assassin only)
- Existing rooms without `role_config` will use default
- Lady of Lake disabled by default
- No migration of existing data needed (just schema extension)

## RLS Policy Updates

### Verification Required

The new columns inherit from existing RLS policies. **Before migration**, verify these policies exist:

**rooms table** - Existing policy should cover new columns:
```sql
-- Verify this policy exists and covers all columns:
-- "Room members can view their room"
SELECT * FROM pg_policies WHERE tablename = 'rooms';
```

**player_roles table** - Existing policy should cover `has_lady_of_lake`:
```sql
-- Verify this policy exists:
-- "Players can view their own role"
SELECT * FROM pg_policies WHERE tablename = 'player_roles';
```

### Columns Covered by Existing Policies

| Column | Table | Policy | Access |
|--------|-------|--------|--------|
| `role_config` | rooms | "Room members can view their room" | Room members can read |
| `lady_of_lake_enabled` | rooms | "Room members can view their room" | Room members can read |
| `lady_of_lake_holder_id` | rooms | "Room members can view their room" | Room members can read |
| `has_lady_of_lake` | player_roles | "Players can view their own role" | Role owner only |

### If Policies Missing

If verification fails, add these policies before T002:

```sql
-- Ensure room members can read all room columns including new ones
CREATE POLICY IF NOT EXISTS "Room members can view room config"
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
```

**Note**: The existing MVP policies should already cover these columns since RLS applies at the row level, not column level. The verification is to confirm.

