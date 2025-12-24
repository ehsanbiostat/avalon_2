# Research: Rulebook Page

**Feature**: 014-rulebook-page
**Date**: 2024-12-24

## Research Tasks

### 1. Tab Component Pattern

**Question**: How should tabs be implemented for consistency with existing patterns?

**Decision**: Use client-side state with `useState` for tab selection

**Rationale**:
- Existing Modal and other components use React state for UI interactions
- No URL state needed (not deep-linkable requirement)
- Simple, fast, no route changes

**Alternatives Considered**:
- URL-based tabs (`/rules?tab=roles`): Rejected - adds complexity, not required
- Headless UI tabs: Rejected - would add new dependency

### 2. Content Organization

**Question**: Where should static rulebook content be defined?

**Decision**: Create `lib/domain/rulebook-content.ts` with typed arrays

**Rationale**:
- Follows existing pattern (`lib/domain/` for game logic)
- Keeps components clean and focused on rendering
- Allows reuse of `SPECIAL_ROLES` from `constants.ts`
- TypeScript types ensure content consistency

**Alternatives Considered**:
- Inline in components: Rejected - harder to maintain, clutters JSX
- Markdown files: Rejected - adds build complexity, overkill for static content
- JSON files: Rejected - loses TypeScript benefits

### 3. Modal vs Drawer Pattern

**Question**: Should the in-game rulebook be a modal or slide-in drawer?

**Decision**: Modal overlay (same as existing `Modal` component)

**Rationale**:
- User explicitly chose "full rulebook modal" in clarification
- Consistent with existing modal patterns (RoleRevealModal, CreateRoomModal)
- Centered focus, familiar dismissal patterns

**Alternatives Considered**:
- Drawer: Rejected - user preference for modal
- Bottom sheet: Rejected - less familiar on desktop

### 4. Responsive Tab Layout

**Question**: How should tabs behave on mobile?

**Decision**: Horizontal scroll with visible overflow indicators

**Rationale**:
- 4 tabs is manageable on most mobile screens
- Horizontal scroll is standard mobile pattern
- Avoids vertical stacking which would push content down

**Implementation**:
```css
/* Scrollable tabs container */
.tabs-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Hide scrollbar */
}
```

### 5. Reusing Existing Components

**Question**: Which existing components can be reused?

**Decision**: Reuse Modal, Button, and card styling patterns

**Components to Reuse**:
| Component | Usage |
|-----------|-------|
| `Modal` | RulebookModal wrapper |
| `Button` | Close button, navigation |
| Card patterns | Tab content containers |
| Color variables | `good`, `evil`, `avalon-*` |

**New Components Needed**:
| Component | Purpose |
|-----------|---------|
| `RulebookContent` | Shared tabbed container |
| `RulebookTabs` | Tab navigation UI |
| `RolesTab` | Roles content |
| `GameModesTab` | Modes content |
| `VisualGuideTab` | Visual guide content |
| `GameFlowTab` | Game flow content |

### 6. Accessibility Requirements

**Question**: What accessibility features are needed for tabs?

**Decision**: Implement WAI-ARIA tab pattern

**Implementation**:
- `role="tablist"` on tab container
- `role="tab"` on each tab button
- `role="tabpanel"` on content panels
- `aria-selected` on active tab
- `aria-controls` linking tab to panel
- Keyboard navigation: Arrow keys to switch tabs

### 7. Content Structure

**Question**: How should role information be structured?

**Decision**: Reuse existing `SPECIAL_ROLES` from `constants.ts`

**Existing Data Available**:
```typescript
// From constants.ts
SPECIAL_ROLES: Record<SpecialRole, SpecialRoleInfo>
// Contains: name, team, description, emoji, visibility flags
```

**Additional Content Needed**:
- Game modes descriptions (new)
- Visual indicator explanations (new)
- Game flow descriptions (new)

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Tab state management | React `useState` |
| Content location | `lib/domain/rulebook-content.ts` |
| In-game access | Modal overlay |
| Mobile tabs | Horizontal scroll |
| Component reuse | Modal, Button, colors |
| Accessibility | WAI-ARIA tab pattern |
| Role data | Reuse `SPECIAL_ROLES` |

