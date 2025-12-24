# Feature Specification: Rulebook Page

**Feature ID**: 014-rulebook-page
**Created**: 2024-12-24
**Status**: Ready for Planning
**Branch**: `014-rulebook-page`

## Problem Statement

Players need a comprehensive reference for understanding game roles, configurations, UI indicators, and game flow. Currently, this information is only shown contextually during gameplay (e.g., role reveal modal), but there's no central place for players to learn or reference the rules before, during, or after a game.

The rulebook must:
- Be accessible from anywhere (home page, game room)
- Match the website's minimalist dark theme
- Be lightweight and fast
- Provide clear, concise explanations with visual emphasis

## User Stories

### US1: New Player Learning
**As a** new player  
**I want to** read about all roles and game mechanics before joining a game  
**So that** I understand how to play effectively

### US2: In-Game Reference
**As a** player in an active game  
**I want to** quickly reference what a symbol or color means  
**So that** I can understand the game state without asking others

### US3: Role Clarification
**As a** player who just received a role  
**I want to** understand what my role can do and who I can see  
**So that** I can play strategically

## Functional Requirements

### FR-001: Dedicated Rules Page
- Create `/rules` route accessible from home page
- Page uses tabbed navigation with 4 tabs:
  1. **Roles** - All 8 special roles with descriptions
  2. **Game Modes** - Decoy, Split Intel, Lady of the Lake
  3. **Visual Guide** - Colors, tokens, emojis, indicators
  4. **Game Flow** - Phases, voting, quests, win conditions

### FR-002: Quick-Access Button in Game Rooms
- Add a "?" or "📖" button in the game room header/UI
- Button opens a modal overlay with the same tabbed content
- Modal can be closed to return to game without losing state

### FR-003: Content Structure
- Each item has: emoji/icon, name, 1-2 sentence description
- Visual emphasis on team colors (blue=good, orange=evil)
- Consistent with existing design system

### FR-004: Roles Tab Content
Display all 8 roles organized by team:

**Good Team:**
| Role | Emoji | Description |
|------|-------|-------------|
| Merlin | 🧙 | Knows evil players (except Mordred and Oberon Chaos) |
| Percival | 🛡️ | Knows Merlin (but Morgana appears the same) |
| Loyal Servant | ⚔️ | Basic good team member with no special knowledge |

**Evil Team:**
| Role | Emoji | Description |
|------|-------|-------------|
| Assassin | 🗡️ | Can assassinate Merlin at end of game to steal victory |
| Morgana | 🧙‍♀️ | Appears as Merlin to Percival |
| Mordred | 🐍 | Hidden from Merlin's sight |
| Oberon | 👤 | Works alone, visible to Merlin, hidden from evil team |
| Oberon (Chaos) | 👻 | Completely hidden from everyone, even Merlin |

### FR-005: Game Modes Tab Content
| Mode | Emoji | Description |
|------|-------|-------------|
| Lady of the Lake | 🌊 | Investigate player loyalties after Quests 2, 3, 4 |
| Decoy Mode | 🃏 | One random good player appears evil to Merlin |
| Split Intel Mode | 🔀 | Merlin sees two groups: certain evil + mixed (1 evil, 1 good) |

### FR-006: Visual Guide Tab Content
**Avatar Indicators:**
| Indicator | Meaning |
|-----------|---------|
| 👑 Crown | Current team leader |
| 🌊 Wave | Lady of the Lake holder |
| ✓ Badge | Player has voted |
| Amber border | "You" (current player) |
| Blue fill | Selected for team |
| Green fill | On proposed team |
| Red nickname | Disconnected player |

**Team Colors:**
| Color | Meaning |
|-------|---------|
| Sky Blue | Good team |
| Orange | Evil team |
| Gold | Accents, highlights |

**Quest Results:**
| Symbol | Meaning |
|--------|---------|
| ✓ Green | Quest succeeded |
| ✗ Red | Quest failed |
| 2! Badge | Quest requires 2 fails |

### FR-007: Game Flow Tab Content
1. **Team Building** - Leader proposes quest team
2. **Voting** - All players approve/reject proposal
3. **Quest** - Team members secretly succeed/fail
4. **Quest Result** - Reveal success or failure
5. **Lady of the Lake** (if enabled) - Investigation phase
6. **Assassin Phase** - If good wins 3 quests, Assassin guesses Merlin

**Win Conditions:**
- Good wins: 3 successful quests AND Merlin survives assassination
- Evil wins: 3 failed quests OR 5 rejected proposals OR Merlin assassinated

### FR-008: Responsive Design
- Full-width on mobile, max-width container on desktop
- Tabs stack or scroll horizontally on small screens
- Modal sizes appropriately for viewport

### FR-009: Navigation Links
- Add "Rules" link to home page (footer or subtle link area)
- Add "?" button to game room header (near room code)

## Non-Functional Requirements

### NFR-001: Performance
- Page should load in <1 second (static content only)
- No API calls required for rulebook content
- Content hardcoded in components (from constants.ts)

### NFR-002: Accessibility
- Proper heading hierarchy
- Tab navigation keyboard accessible
- Sufficient color contrast (already ensured by theme)

### NFR-003: Consistency
- Use existing Tailwind classes and color variables
- Match Modal, Button, and Card component styles
- Same Inter font family

## Out of Scope

- Search functionality within rulebook
- Localization/translations
- User-editable content
- Analytics on which sections are viewed
- PDF export

## Key Entities

### RulebookTab
- `id`: string ('roles' | 'modes' | 'visual' | 'flow')
- `label`: string
- `icon`: string (emoji)

### RoleInfo (existing in constants.ts)
- Already defined as `SpecialRoleInfo`
- Reuse `SPECIAL_ROLES` constant

## Success Criteria

1. ✅ `/rules` page renders with 4 tabs
2. ✅ All 8 roles displayed with correct team colors
3. ✅ All 3 game modes documented
4. ✅ Visual guide covers all UI indicators
5. ✅ Game flow explains phases and win conditions
6. ✅ "?" button appears in game room
7. ✅ Modal opens with same content as page
8. ✅ Works on mobile (375px) and desktop
9. ✅ Matches existing dark theme aesthetic

## Clarifications

### Session 2024-12-24

- Q: How should users access the rulebook? → A: Both dedicated `/rules` page AND quick-access "?" button in game rooms
- Q: How should content be organized on the page? → A: Tabbed sections (Roles / Game Modes / Visual Guide / Game Flow)
- Q: What should the "?" button show when clicked? → A: Full rulebook modal (same content as `/rules` page)
- Q: How detailed should descriptions be? → A: Concise (1-2 sentences per item, visual emphasis on icons/colors)
- Q: What tabs should the rulebook have? → A: 4 tabs: Roles / Game Modes / Visual Guide / Game Flow

