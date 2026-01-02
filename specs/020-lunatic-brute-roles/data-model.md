# Data Model: Lunatic & Brute Evil Characters

**Feature**: 020-lunatic-brute-roles
**Date**: 2026-01-01

## Schema Changes

### 1. SpecialRole Type Extension

**File**: `src/types/database.ts`

```typescript
// Current
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

// Updated (add two new values)
export type SpecialRole =
  | 'merlin'
  | 'percival'
  | 'servant'
  | 'assassin'
  | 'morgana'
  | 'mordred'
  | 'oberon_standard'
  | 'oberon_chaos'
  | 'minion'
  | 'lunatic'      // NEW: Must fail every quest
  | 'brute';       // NEW: Can only fail quests 1-3
```

### 2. RoleConfig Extension

**File**: `src/types/role-config.ts`

```typescript
export interface RoleConfig {
  // Existing fields...
  percival?: boolean;
  morgana?: boolean;
  mordred?: boolean;
  oberon?: OberonMode;
  ladyOfLake?: boolean;
  merlin_decoy_enabled?: boolean;
  merlin_split_intel_enabled?: boolean;
  oberon_split_intel_enabled?: boolean;
  evil_ring_visibility_enabled?: boolean;

  // NEW: Big Box expansion roles
  lunatic?: boolean;   // Enable Lunatic role (7+ players)
  brute?: boolean;     // Enable Brute role (7+ players)
}
```

### 3. Database Migration

**File**: `supabase/migrations/020_lunatic_brute_roles.sql`

```sql
-- Migration: Add Lunatic and Brute special roles
-- Feature: 020-lunatic-brute-roles

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
  'lunatic',    -- NEW
  'brute'       -- NEW
));

-- Add comment for documentation
COMMENT ON CONSTRAINT player_roles_special_role_check ON player_roles IS
  'Valid special roles including Big Box expansion roles (lunatic, brute)';
```

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                           rooms                                      │
│  - role_config: JSONB (includes lunatic?: boolean, brute?: boolean) │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         player_roles                                 │
│  - special_role: SpecialRole (can be 'lunatic' or 'brute')          │
│  - role: 'evil' (for both lunatic and brute)                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ validated by
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      quest_actions                                   │
│  - action: 'success' | 'fail'                                        │
│  - Lunatic: action MUST be 'fail'                                   │
│  - Brute on Quest 4/5: action MUST be 'success'                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Role Metadata

**File**: `src/lib/utils/constants.ts`

```typescript
// Add to SPECIAL_ROLES record
lunatic: {
  name: 'Lunatic',
  team: 'evil',
  description: 'Must play Fail on every quest',
  emoji: '🤪',
  knowsEvil: false,
  knownToMerlin: true,      // Visible to Merlin
  knowsMerlin: false,
  appearsAsMerlin: false,
  knowsTeammates: true,     // Knows evil teammates
  required: false,
  maxPerGame: 1,
},
brute: {
  name: 'Brute',
  team: 'evil',
  description: 'Can only Fail on Quests 1-3',
  emoji: '👊',
  knowsEvil: false,
  knownToMerlin: true,      // Visible to Merlin
  knowsMerlin: false,
  appearsAsMerlin: false,
  knowsTeammates: true,     // Knows evil teammates
  required: false,
  maxPerGame: 1,
},
```

## Validation Rules

### Role Configuration Validation

```typescript
// In lib/domain/role-config.ts

function validateRoleConfig(config: RoleConfig, playerCount: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // NEW: Lunatic/Brute require 7+ players (3+ evil slots)
  if ((config.lunatic || config.brute) && playerCount < 7) {
    errors.push('Lunatic and Brute require 7+ players (need 3+ evil slots)');
  }

  // Count required evil special roles
  let evilSpecialCount = 1; // Assassin always
  if (config.morgana) evilSpecialCount++;
  if (config.mordred) evilSpecialCount++;
  if (config.oberon) evilSpecialCount++;
  if (config.lunatic) evilSpecialCount++;  // NEW
  if (config.brute) evilSpecialCount++;    // NEW

  const evilSlots = ROLE_RATIOS[playerCount]?.evil || 0;
  if (evilSpecialCount > evilSlots) {
    errors.push(`Too many evil special roles (${evilSpecialCount}) for ${playerCount} players (${evilSlots} evil slots)`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### Quest Action Validation

```typescript
// In lib/domain/quest-resolver.ts

interface QuestActionValidation {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

function validateQuestAction(
  playerRole: 'good' | 'evil',
  specialRole: SpecialRole,
  action: 'success' | 'fail',
  questNumber: number
): QuestActionValidation {
  // Good players can only submit success
  if (playerRole === 'good' && action === 'fail') {
    return {
      valid: false,
      error: 'Good players can only submit success',
      errorCode: 'INVALID_ACTION',
    };
  }

  // Lunatic MUST fail
  if (specialRole === 'lunatic' && action === 'success') {
    return {
      valid: false,
      error: 'The Lunatic must play Fail on every quest',
      errorCode: 'LUNATIC_MUST_FAIL',
    };
  }

  // Brute cannot fail on quests 4-5
  if (specialRole === 'brute' && action === 'fail' && questNumber >= 4) {
    return {
      valid: false,
      error: 'The Brute cannot play Fail on Quest 4 or 5',
      errorCode: 'BRUTE_CANNOT_FAIL_LATE_QUEST',
    };
  }

  return { valid: true };
}
```

## State Transitions

No new state transitions. Lunatic and Brute participate in existing game flow:

1. **Role Distribution**: Assigned like other special evil roles
2. **Team Building**: Normal participation
3. **Voting**: Normal vote (Approve/Reject) - no constraints
4. **Quest Execution**: Constrained actions based on role
5. **Assassin Phase**: Can be targeted or (if neither is Assassin) continue normally
6. **Game Over**: Roles revealed with all others

## Constraints Summary

| Role | Quest 1-3 | Quest 4-5 | Team Vote | Assassin Phase |
|------|-----------|-----------|-----------|----------------|
| Lunatic | Fail ONLY | Fail ONLY | Normal | Normal target |
| Brute | Success OR Fail | Success ONLY | Normal | Normal target |
