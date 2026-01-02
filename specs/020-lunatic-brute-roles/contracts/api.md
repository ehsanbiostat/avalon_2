# API Contracts: Lunatic & Brute Evil Characters

**Feature**: 020-lunatic-brute-roles
**Date**: 2026-01-01

## Overview

This feature does not introduce new API endpoints. It modifies existing endpoints to support Lunatic and Brute role constraints.

## Modified Endpoints

### 1. POST /api/games/{gameId}/quest/action

Submit a quest action (success or fail) for a team member.

**Changes**:
- Validates Lunatic must submit 'fail'
- Validates Brute cannot submit 'fail' on Quest 4 or 5

#### Request

```http
POST /api/games/{gameId}/quest/action
Content-Type: application/json
X-Player-ID: {playerId}

{
  "action": "success" | "fail"
}
```

#### Response: Success (200)

```json
{
  "data": {
    "recorded": true,
    "actions_submitted": 3,
    "total_team_members": 4
  }
}
```

#### Response: Lunatic Constraint Violation (400)

```json
{
  "error": {
    "code": "LUNATIC_MUST_FAIL",
    "message": "The Lunatic must play Fail on every quest"
  }
}
```

#### Response: Brute Constraint Violation (400)

```json
{
  "error": {
    "code": "BRUTE_CANNOT_FAIL_LATE_QUEST",
    "message": "The Brute cannot play Fail on Quest 4 or 5"
  }
}
```

### 2. POST /api/rooms/{roomId}/roles/config

Update the role configuration for a room.

**Changes**:
- Accepts `lunatic?: boolean` and `brute?: boolean` in config
- Validates 7+ players requirement

#### Request

```http
POST /api/rooms/{roomId}/roles/config
Content-Type: application/json
X-Player-ID: {playerId}

{
  "config": {
    "percival": true,
    "morgana": true,
    "lunatic": true,    // NEW
    "brute": true       // NEW
  }
}
```

#### Response: Success (200)

```json
{
  "data": {
    "config": {
      "percival": true,
      "morgana": true,
      "lunatic": true,
      "brute": true
    },
    "rolesInPlay": ["Merlin", "Percival", "Servant", "Assassin", "Morgana", "Lunatic", "Brute"],
    "ladyOfLakeEnabled": false,
    "ladyOfLakeHolderId": null,
    "ladyOfLakeHolderName": null
  }
}
```

#### Response: Player Count Error (400)

```json
{
  "error": {
    "code": "INVALID_ROLE_CONFIG",
    "message": "Lunatic and Brute require 7+ players (need 3+ evil slots)"
  }
}
```

#### Response: Too Many Evil Roles (400)

```json
{
  "error": {
    "code": "INVALID_ROLE_CONFIG",
    "message": "Too many evil special roles (5) for 7 players (3 evil slots)"
  }
}
```

### 3. GET /api/games/{gameId}

Get game state including player roles.

**Changes**:
- Returns `specialRole: 'lunatic' | 'brute'` for players with these roles
- Role info includes quest constraints in description

#### Response: Player Role Info (for Lunatic)

```json
{
  "role_info": {
    "role": "evil",
    "special_role": "lunatic",
    "role_name": "Lunatic",
    "role_description": "You are the Lunatic, a servant of Mordred driven by madness. You MUST play Fail on every quest you join—you have no choice.",
    "is_confirmed": true,
    "evil_teammates": ["Alice", "Bob"],
    "ability_note": "You must play Fail on every quest"
  }
}
```

#### Response: Player Role Info (for Brute)

```json
{
  "role_info": {
    "role": "evil",
    "special_role": "brute",
    "role_name": "Brute",
    "role_description": "You are the Brute, a servant of Mordred who has some tricks, but not many. You can only play Fail on Quests 1, 2, and 3. On Quests 4 and 5, you MUST play Success. Use your early sabotage wisely!",
    "is_confirmed": true,
    "evil_teammates": ["Alice", "Bob"],
    "ability_note": "Can only Fail on Quests 1-3"
  }
}
```

## New Error Codes

Add to `src/lib/utils/constants.ts`:

```typescript
export const ERROR_CODES = {
  // ... existing codes ...

  // Lunatic/Brute quest action errors
  LUNATIC_MUST_FAIL: 'LUNATIC_MUST_FAIL',
  BRUTE_CANNOT_FAIL_LATE_QUEST: 'BRUTE_CANNOT_FAIL_LATE_QUEST',
} as const;
```

## Client API Changes

### Quest Action Constraints

The client needs to know which actions are available for the current player.

**New Response Field in Game State**:

```typescript
interface QuestActionConstraints {
  canSuccess: boolean;
  canFail: boolean;
  constraintReason?: string;
}
```

**Example for Lunatic on any quest**:
```json
{
  "questActionConstraints": {
    "canSuccess": false,
    "canFail": true,
    "constraintReason": "As the Lunatic, you must play Fail"
  }
}
```

**Example for Brute on Quest 4**:
```json
{
  "questActionConstraints": {
    "canSuccess": true,
    "canFail": false,
    "constraintReason": "As the Brute, you cannot Fail on Quest 4 or 5"
  }
}
```

**Example for Brute on Quest 2**:
```json
{
  "questActionConstraints": {
    "canSuccess": true,
    "canFail": true,
    "constraintReason": null
  }
}
```

## Validation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Quest Action Request                          │
│                  action: "success" | "fail"                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   1. Get Player Role                             │
│              (role: 'good' | 'evil')                            │
│              (specialRole: SpecialRole)                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              2. Validate Good Player Constraint                  │
│         If role === 'good' && action === 'fail'                 │
│                    → INVALID_ACTION                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              3. Validate Lunatic Constraint                      │
│       If specialRole === 'lunatic' && action === 'success'      │
│                   → LUNATIC_MUST_FAIL                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│               4. Validate Brute Constraint                       │
│    If specialRole === 'brute' && action === 'fail'              │
│              && questNumber >= 4                                 │
│              → BRUTE_CANNOT_FAIL_LATE_QUEST                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    5. Submit Action                              │
│                      → SUCCESS                                   │
└──────────────────────────────────────────────────────────────────┘
```
