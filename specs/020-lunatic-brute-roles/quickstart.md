# Quickstart: Lunatic & Brute Evil Characters

**Feature**: 020-lunatic-brute-roles
**Date**: 2026-01-01

## Quick Summary

Add two new Evil roles from Avalon Big Box:
- **Lunatic** 🤪 - Must Fail every quest
- **Brute** 👊 - Can only Fail quests 1-3

## Implementation Checklist

### Phase 1: Type System (30 min)

- [ ] Add `'lunatic' | 'brute'` to `SpecialRole` in `src/types/database.ts`
- [ ] Add `lunatic?: boolean` and `brute?: boolean` to `RoleConfig` in `src/types/role-config.ts`
- [ ] Create migration `supabase/migrations/020_lunatic_brute_roles.sql`

### Phase 2: Role Metadata (30 min)

- [ ] Add Lunatic entry to `SPECIAL_ROLES` in `src/lib/utils/constants.ts`
- [ ] Add Brute entry to `SPECIAL_ROLES` in `src/lib/utils/constants.ts`
- [ ] Add to `EVIL_SPECIAL_ROLES` and `OPTIONAL_EVIL_ROLES` arrays

### Phase 3: Domain Logic (1 hour)

- [ ] Extend `validateQuestAction` in `src/lib/domain/quest-resolver.ts`
- [ ] Add Lunatic/Brute to role distribution in `src/lib/domain/roles.ts`
- [ ] Update role config validation in `src/lib/domain/role-config.ts`
- [ ] Update visibility logic in `src/lib/domain/visibility.ts`

### Phase 4: API Updates (45 min)

- [ ] Update quest action route to validate constraints
- [ ] Add new error codes to `src/lib/utils/constants.ts`
- [ ] Include constraint info in game state response

### Phase 5: UI Updates (1 hour)

- [ ] Add role toggles to `RoleConfigPanel.tsx` (7+ players only)
- [ ] Add role descriptions to `RoleRevealModal.tsx`
- [ ] Update `QuestExecution.tsx` with constrained button states
- [ ] Add constraint messaging in quest action UI

### Phase 6: Testing (1 hour)

- [ ] Unit tests for quest action validation
- [ ] Unit tests for role config validation
- [ ] E2E test for Lunatic quest flow
- [ ] E2E test for Brute quest flow

## Key Code Snippets

### 1. Type Extension

```typescript
// src/types/database.ts
export type SpecialRole =
  // ... existing ...
  | 'lunatic'      // NEW
  | 'brute';       // NEW
```

### 2. Validation Function

```typescript
// src/lib/domain/quest-resolver.ts
export function validateQuestAction(
  playerRole: 'good' | 'evil',
  specialRole: SpecialRole,
  action: QuestActionType,
  questNumber: number
): string | null {
  if (playerRole === 'good' && action === 'fail') {
    return 'Good players can only submit success';
  }
  if (specialRole === 'lunatic' && action === 'success') {
    return 'LUNATIC_MUST_FAIL';
  }
  if (specialRole === 'brute' && action === 'fail' && questNumber >= 4) {
    return 'BRUTE_CANNOT_FAIL_LATE_QUEST';
  }
  return null;
}
```

### 3. UI Constraint Logic

```typescript
// src/components/game/QuestExecution.tsx
const getActionConstraints = (specialRole: SpecialRole, questNumber: number) => {
  if (specialRole === 'lunatic') {
    return { canSuccess: false, canFail: true };
  }
  if (specialRole === 'brute' && questNumber >= 4) {
    return { canSuccess: true, canFail: false };
  }
  return { canSuccess: true, canFail: true };
};
```

### 4. Role Config Toggle

```tsx
// src/components/RoleConfigPanel.tsx
{expectedPlayers >= 7 && (
  <>
    <RoleToggle
      role="lunatic"
      enabled={config.lunatic || false}
      onChange={(v) => handleToggle('lunatic', v)}
      label="Lunatic"
      description="Must play Fail on every quest"
      emoji="🤪"
    />
    <RoleToggle
      role="brute"
      enabled={config.brute || false}
      onChange={(v) => handleToggle('brute', v)}
      label="Brute"
      description="Can only Fail on Quests 1-3"
      emoji="👊"
    />
  </>
)}
```

## Testing Commands

```bash
# Run unit tests
npm run test -- --grep "lunatic|brute"

# Run E2E tests
npm run test:e2e -- --grep "lunatic|brute"

# Type check
npm run type-check
```

## Migration

```sql
-- supabase/migrations/020_lunatic_brute_roles.sql
ALTER TABLE player_roles
DROP CONSTRAINT IF EXISTS player_roles_special_role_check;

ALTER TABLE player_roles
ADD CONSTRAINT player_roles_special_role_check
CHECK (special_role IN (
  'merlin', 'percival', 'servant', 'assassin', 'morgana',
  'mordred', 'oberon_standard', 'oberon_chaos', 'minion',
  'lunatic', 'brute'
));
```

## Estimated Time

| Phase | Duration |
|-------|----------|
| Type System | 30 min |
| Role Metadata | 30 min |
| Domain Logic | 1 hour |
| API Updates | 45 min |
| UI Updates | 1 hour |
| Testing | 1 hour |
| **Total** | **~5 hours** |
