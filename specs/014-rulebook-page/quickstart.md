# Quickstart: Rulebook Page

**Feature**: 014-rulebook-page
**Date**: 2024-12-24

## Overview

Add a comprehensive rulebook page (`/rules`) and quick-access modal for game rooms.

## Quick Implementation Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/rules/page.tsx` | Dedicated rules page |
| `src/components/rulebook/RulebookContent.tsx` | Shared tabbed content |
| `src/components/rulebook/RulebookModal.tsx` | Modal wrapper |
| `src/components/rulebook/RulebookTabs.tsx` | Tab navigation |
| `src/components/rulebook/RolesTab.tsx` | Roles content |
| `src/components/rulebook/GameModesTab.tsx` | Game modes content |
| `src/components/rulebook/VisualGuideTab.tsx` | Visual guide content |
| `src/components/rulebook/GameFlowTab.tsx` | Game flow content |
| `src/lib/domain/rulebook-content.ts` | Static content definitions |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/page.tsx` | Add "Rules" link to footer area |
| `src/components/game/GameBoard.tsx` | Add "?" button to header |

## Component Hierarchy

```
/rules page                    GameBoard
     │                              │
     └─────────────┬────────────────┘
                   │
           RulebookContent
                   │
         ┌─────────┼─────────┐
         │         │         │
    RulebookTabs   │    Tab Content
         │         │         │
    [Roles|Modes|Visual|Flow]
                   │
    ┌──────┬───────┼───────┬──────┐
    │      │       │       │      │
 Roles  Modes   Visual   Flow  (tabs)
  Tab    Tab     Tab     Tab
```

## Key Patterns

### Tab State Management

```typescript
// RulebookContent.tsx
const [activeTab, setActiveTab] = useState<RulebookTabId>('roles');

return (
  <div>
    <RulebookTabs activeTab={activeTab} onTabChange={setActiveTab} />
    {activeTab === 'roles' && <RolesTab />}
    {activeTab === 'modes' && <GameModesTab />}
    {activeTab === 'visual' && <VisualGuideTab />}
    {activeTab === 'flow' && <GameFlowTab />}
  </div>
);
```

### Reusing SPECIAL_ROLES

```typescript
// RolesTab.tsx
import { SPECIAL_ROLES, GOOD_SPECIAL_ROLES, EVIL_SPECIAL_ROLES } from '@/lib/utils/constants';

// Group and display
const goodRoles = GOOD_SPECIAL_ROLES.map(key => SPECIAL_ROLES[key]);
const evilRoles = EVIL_SPECIAL_ROLES.map(key => SPECIAL_ROLES[key]);
```

### Modal Integration

```typescript
// GameBoard.tsx
const [showRulebook, setShowRulebook] = useState(false);

// In header area
<button onClick={() => setShowRulebook(true)}>?</button>

// At component end
<RulebookModal isOpen={showRulebook} onClose={() => setShowRulebook(false)} />
```

## Styling Guidelines

### Team Colors

```typescript
// Good team
className="bg-good/20 text-good-light border-good/50"

// Evil team  
className="bg-evil/20 text-evil-light border-evil/50"
```

### Tab Styling

```typescript
// Active tab
className="border-b-2 border-avalon-gold text-avalon-gold"

// Inactive tab
className="text-avalon-text-muted hover:text-avalon-text-secondary"
```

### Content Cards

```typescript
// Section card
className="bg-avalon-midnight/50 rounded-lg border border-avalon-silver/20 p-4"
```

## Testing Checklist

### Manual Tests

- [ ] `/rules` page loads and displays 4 tabs
- [ ] Clicking tabs switches content correctly
- [ ] All 8 roles displayed with correct team colors
- [ ] All 3 game modes documented
- [ ] Visual indicators explained with correct symbols
- [ ] Game flow shows all phases
- [ ] Home page has "Rules" link that works
- [ ] Game room has "?" button
- [ ] "?" button opens modal with same content
- [ ] Modal can be closed
- [ ] Responsive: works on mobile (375px width)
- [ ] Tabs scroll horizontally on mobile if needed
- [ ] Keyboard navigation works (Tab, Enter)

### Visual Checks

- [ ] Dark theme consistent with rest of app
- [ ] Team colors match (blue=good, orange=evil)
- [ ] Emojis display correctly
- [ ] Text is readable (contrast)
- [ ] No horizontal overflow on mobile

## Common Issues

### Tab Content Not Updating

Ensure `activeTab` state is in the parent component (`RulebookContent`), not in individual tabs.

### Modal Not Closing

Check that `onClose` prop is passed and `onClick` handler on backdrop calls it.

### Mobile Overflow

Use `overflow-x-auto` on tab container and ensure content has `max-w-full`.

## Quick Links

- [Spec](./spec.md) - Full requirements
- [Plan](./plan.md) - Implementation phases
- [Research](./research.md) - Technical decisions
- [Data Model](./data-model.md) - Type definitions

