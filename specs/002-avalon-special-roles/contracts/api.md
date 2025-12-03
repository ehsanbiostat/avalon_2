# API Contracts: Phase 2 – Special Roles & Configurations

**Feature**: 002-avalon-special-roles
**Date**: 2025-12-03
**Extends**: MVP API contracts from 001-avalon-mvp-lobby

## Overview

This document describes API changes for Phase 2. All endpoints maintain backward compatibility with MVP clients.

---

## Modified Endpoints

### 1. POST `/api/rooms` (Extended)

Create a new room with optional role configuration.

**Authorization**: Requires `X-Player-ID` header

**Request Body** (extended):
```typescript
{
  expected_players: number;  // 5-10 (required)
  role_config?: {            // Optional, defaults to MVP config
    percival?: boolean;      // Include Percival (Good)
    morgana?: boolean;       // Include Morgana (Evil)
    mordred?: boolean;       // Include Mordred (Evil)
    oberon?: 'standard' | 'chaos';  // Include Oberon with mode
    ladyOfLake?: boolean;    // Enable Lady of the Lake
  }
}
```

**Success Response** (201):
```typescript
{
  data: {
    id: string;
    code: string;
    manager_id: string;
    expected_players: number;
    status: "waiting";
    role_config: RoleConfig;       // NEW: Confirmed config
    lady_of_lake_enabled: boolean; // NEW
    roles_in_play: string[];       // NEW: Computed role list
    created_at: string;
  }
}
```

**Error Responses** (new codes):

| Code | Status | When |
|------|--------|------|
| `INVALID_ROLE_CONFIG` | 400 | Role config violates constraints |
| `TOO_MANY_GOOD_ROLES` | 400 | More Good roles than Good slots |
| `TOO_MANY_EVIL_ROLES` | 400 | More Evil roles than Evil slots |

**Validation Rules**:
- Percival requires at least 2 Good slots
- Morgana requires at least 2 Evil slots
- Mordred requires at least 2 Evil slots (or 3 with Morgana)
- Oberon requires at least 2 Evil slots (or 3/4 with others)
- Total special roles per team ≤ team size

---

### 2. GET `/api/rooms/[code]` (Extended)

Get room details with role configuration.

**Authorization**: Requires `X-Player-ID` header (room member)

**Success Response** (200):
```typescript
{
  data: {
    room: {
      id: string;
      code: string;
      manager_id: string;
      expected_players: number;
      status: RoomStatus;
      role_config: RoleConfig;         // NEW
      lady_of_lake_enabled: boolean;   // NEW
      lady_of_lake_holder_id: string | null;  // NEW (after distribution)
      roles_in_play: string[];         // NEW: ["Merlin", "Percival", "Assassin", "Morgana"]
      created_at: string;
      last_activity_at: string;
    };
    players: Array<{
      id: string;
      nickname: string;
      is_manager: boolean;
      is_connected: boolean;
      has_lady_of_lake?: boolean;      // NEW (after distribution)
    }>;
    confirmations: {
      total: number;
      confirmed: number;
    };
  }
}
```

---

### 3. POST `/api/rooms/[code]/distribute` (Extended)

Distribute roles using room's configuration.

**Authorization**: Requires `X-Player-ID` header (room manager only)

**Request Body**: None (uses room's stored `role_config`)

**Success Response** (200):
```typescript
{
  data: {
    status: "roles_distributed";
    roles_distributed: number;
    lady_of_lake_holder_id: string | null;  // NEW
  }
}
```

**Behavior Changes**:
- Uses `role_config` to determine role pool
- Designates Lady of Lake holder if enabled
- Sets `has_lady_of_lake` on designated player's role

---

### 4. GET `/api/rooms/[code]/role` (Extended)

Get current player's role with visibility information.

**Authorization**: Requires `X-Player-ID` header (room member)

**Success Response** (200):
```typescript
{
  data: {
    role: 'good' | 'evil';
    special_role: SpecialRole;
    role_name: string;
    role_description: string;
    is_confirmed: boolean;
    has_lady_of_lake: boolean;              // NEW
    
    // Visibility information (character-specific)
    known_players?: Array<{                 // NEW: Extended format
      id: string;
      nickname: string;
    }>;
    known_players_label?: string;           // NEW: Display label
    hidden_evil_count?: number;             // NEW: For Merlin warning
    ability_note?: string;                  // NEW: Context-specific note
  }
}
```

**Character-Specific Responses**:

**Merlin**:
```typescript
{
  role: "good",
  special_role: "merlin",
  role_name: "Merlin",
  role_description: "...",
  known_players: [{ id: "...", nickname: "Alice" }, ...],
  known_players_label: "Evil Players Known to You",
  hidden_evil_count: 2,  // If Mordred + Oberon(Chaos) present
  ability_note: "Two evil players are hidden from you!"
}
```

**Percival**:
```typescript
{
  role: "good",
  special_role: "percival",
  role_name: "Percival",
  role_description: "...",
  known_players: [{ id: "...", nickname: "Alice" }, { id: "...", nickname: "Bob" }],
  known_players_label: "One of these is Merlin",
  ability_note: "Protect Merlin, but Morgana appears the same!"
}
```

**Morgana**:
```typescript
{
  role: "evil",
  special_role: "morgana",
  role_name: "Morgana",
  role_description: "...",
  known_players: [{ id: "...", nickname: "Eve" }],  // Evil teammates
  known_players_label: "Your Evil Teammates",
  ability_note: "You appear as Merlin to Percival"
}
```

**Mordred**:
```typescript
{
  role: "evil",
  special_role: "mordred",
  role_name: "Mordred",
  role_description: "...",
  known_players: [...],
  known_players_label: "Your Evil Teammates",
  ability_note: "Merlin cannot see you"
}
```

**Oberon (Standard)**:
```typescript
{
  role: "evil",
  special_role: "oberon_standard",
  role_name: "Oberon",
  role_description: "...",
  known_players: [],  // Sees no one
  known_players_label: undefined,
  ability_note: "You work alone. Your teammates don't know you. Merlin can see you."
}
```

**Oberon (Chaos)**:
```typescript
{
  role: "evil",
  special_role: "oberon_chaos",
  role_name: "Oberon (Chaos)",
  role_description: "...",
  known_players: [],
  known_players_label: undefined,
  ability_note: "Complete isolation! No one knows you are evil - not even Merlin!"
}
```

---

## New Endpoint

### 5. POST `/api/rooms/validate-config`

Validate a role configuration without creating a room.

**Authorization**: None required

**Request Body**:
```typescript
{
  expected_players: number;
  role_config: RoleConfig;
}
```

**Success Response** (200):
```typescript
{
  data: {
    valid: boolean;
    errors: string[];     // Blocking issues
    warnings: string[];   // Suggestions (non-blocking)
    roles_in_play: string[];  // What would be distributed
    good_count: number;
    evil_count: number;
  }
}
```

**Example Validation**:

Request:
```json
{
  "expected_players": 5,
  "role_config": {
    "percival": true,
    "morgana": true,
    "mordred": true
  }
}
```

Response:
```json
{
  "data": {
    "valid": false,
    "errors": ["Too many Evil roles (3) for 5-player game (max 2 Evil)"],
    "warnings": [],
    "roles_in_play": [],
    "good_count": 3,
    "evil_count": 2
  }
}
```

---

## Types Reference

```typescript
type RoomStatus = 'waiting' | 'roles_distributed' | 'started';

type SpecialRole = 
  | 'merlin'
  | 'percival'
  | 'servant'
  | 'assassin'
  | 'morgana'
  | 'mordred'
  | 'oberon_standard'
  | 'oberon_chaos'
  | 'minion';

interface RoleConfig {
  percival?: boolean;
  morgana?: boolean;
  mordred?: boolean;
  oberon?: 'standard' | 'chaos';
  ladyOfLake?: boolean;
}
```

---

## Error Codes (New)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_ROLE_CONFIG` | 400 | Role configuration violates game rules |
| `TOO_MANY_GOOD_ROLES` | 400 | More Good special roles than Good player slots |
| `TOO_MANY_EVIL_ROLES` | 400 | More Evil special roles than Evil player slots |
| `CONFLICTING_ROLES` | 400 | Mutually exclusive roles selected |

---

## Backward Compatibility

- All new request fields are optional with sensible defaults
- Empty `role_config` produces MVP behavior (Merlin + Assassin)
- Existing MVP clients will receive extended responses (extra fields ignored)
- `lady_of_lake_enabled` defaults to `false`

