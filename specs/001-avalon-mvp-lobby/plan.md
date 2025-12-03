# Implementation Plan: Avalon Online – MVP Lobby & Role Distribution

**Branch**: `001-avalon-mvp-lobby` | **Date**: 2025-12-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-avalon-mvp-lobby/spec.md`

## Summary

Build a real-time multiplayer web application for playing the social deduction game "Avalon" online. This MVP covers room creation, lobby management, and role distribution using Next.js (App Router) with TypeScript, Supabase (Postgres + Realtime), and Vercel hosting. Players identify via nickname + localStorage ID, join rooms via shareable codes, and receive privately assigned roles.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Next.js 14+ (App Router), React 18+, Supabase JS Client v2, Tailwind CSS 3.x
**Storage**: Supabase Postgres (primary), Browser localStorage (player ID only)
**Testing**: Vitest for unit tests, Playwright for E2E smoke tests
**Target Platform**: Web (desktop-first, mobile-functional)
**Project Type**: Web application (unified Next.js project)
**Performance Goals**: <2s real-time updates, <5s room creation, <3s join room
**Constraints**: 50 concurrent rooms, 10 players/room max, 5-minute reconnection grace period
**Scale/Scope**: MVP with ~6 pages/views, ~15 components, ~10 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Purpose & Vision | ✅ PASS | MVP scope matches spec; incremental delivery |
| II. Tech Stack | ✅ PASS | Next.js + Supabase + Vercel per constitution |
| III. Data & Security | ✅ PASS | RLS planned; room isolation enforced; server-side sensitive ops |
| IV. Code Quality | ✅ PASS | Strict TS; separated concerns; small components |
| V. Testing | ✅ PASS | Smoke tests for critical flows; unit tests for domain logic |
| VI. UX Principles | ✅ PASS | Minimal UI; clear flows; real-time updates |
| VII. Workflow | ✅ PASS | Spec-driven; feature branch; PR requirements |

**Result**: All gates passed. Proceeding with implementation plan.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           VERCEL                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Next.js App (App Router)                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │   Pages/    │  │  Server     │  │   API Routes        │   │  │
│  │  │   Layouts   │  │  Components │  │   /api/rooms/*      │   │  │
│  │  │             │  │             │  │   /api/players/*    │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │  │
│  │         │                │                     │              │  │
│  │         └────────────────┴─────────────────────┘              │  │
│  │                          │                                     │  │
│  │              ┌───────────┴───────────┐                        │  │
│  │              │   Supabase Client     │                        │  │
│  │              │   (anon key client)   │                        │  │
│  │              │   (service key server)│                        │  │
│  │              └───────────┬───────────┘                        │  │
│  └──────────────────────────┼────────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │    Postgres     │  │    Realtime     │  │   (Auth - future)   │  │
│  │                 │  │                 │  │                     │  │
│  │  - players      │  │  - room changes │  │   MVP: Anonymous    │  │
│  │  - rooms        │  │  - player joins │  │   players with      │  │
│  │  - room_players │  │  - role updates │  │   localStorage ID   │  │
│  │  - player_roles │  │                 │  │                     │  │
│  │                 │  │                 │  │                     │  │
│  │  RLS Policies   │  │  Channels per   │  │                     │  │
│  │  enforced       │  │  room_code      │  │                     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Decisions

1. **Unified Next.js Project**: Single codebase with API routes for server-side logic (not separate backend).

2. **Server-Side Privileged Operations**: Room creation, role distribution, and game state transitions use API routes with Supabase service-role key.

3. **Client-Side Real-Time**: Lobby updates use Supabase Realtime subscriptions via anon key with RLS.

4. **Room Isolation**:
   - All queries scoped by `room_code` or `room_id`
   - RLS policies enforce player membership
   - Room codes are random 6-char alphanumeric (non-guessable)

5. **Identity Model (MVP)**:
   - Player ID generated client-side (UUID), stored in localStorage
   - Player ID sent with all requests to identify returning players
   - Nickname chosen per session, must be unique within room

## Project Structure

### Documentation (this feature)

```text
specs/001-avalon-mvp-lobby/
├── plan.md              # This file
├── research.md          # Technology decisions
├── data-model.md        # Database schema
├── quickstart.md        # Setup instructions
├── contracts/           # API specifications
│   └── api.md           # REST API contracts
└── tasks.md             # Implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page (/)
│   ├── rooms/
│   │   ├── page.tsx              # Active rooms list (/rooms)
│   │   └── [code]/
│   │       └── page.tsx          # Room lobby (/rooms/[code])
│   ├── game/
│   │   └── [code]/
│   │       └── page.tsx          # Game started placeholder (/game/[code])
│   └── api/
│       ├── rooms/
│       │   ├── route.ts          # POST create, GET list
│       │   └── [code]/
│       │       ├── route.ts      # GET room details
│       │       ├── join/
│       │       │   └── route.ts  # POST join room
│       │       ├── leave/
│       │       │   └── route.ts  # POST leave room
│       │       ├── distribute/
│       │       │   └── route.ts  # POST distribute roles (manager only)
│       │       ├── confirm/
│       │       │   └── route.ts  # POST confirm role
│       │       └── start/
│       │           └── route.ts  # POST start game (manager only)
│       └── players/
│           └── route.ts          # POST register/update player
├── components/
│   ├── ui/                       # Generic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   ├── CreateRoomModal.tsx       # Room creation form
│   ├── JoinRoomForm.tsx          # Join by code input
│   ├── RoomList.tsx              # Active rooms list
│   ├── RoomCard.tsx              # Single room in list
│   ├── Lobby.tsx                 # Lobby view container
│   ├── PlayerList.tsx            # Players in lobby
│   ├── PlayerCard.tsx            # Single player display
│   ├── RoleRevealModal.tsx       # Private role display
│   └── GameStartedView.tsx       # Placeholder after start
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client (anon key)
│   │   ├── server.ts             # Server client (service key)
│   │   ├── rooms.ts              # Room queries
│   │   ├── players.ts            # Player queries
│   │   └── roles.ts              # Role queries
│   ├── domain/
│   │   ├── roles.ts              # Role assignment logic (pure)
│   │   ├── room-state.ts         # State transition logic (pure)
│   │   └── validation.ts         # Input validation (pure)
│   └── utils/
│       ├── room-code.ts          # Generate random room codes
│       ├── player-id.ts          # LocalStorage player ID
│       └── constants.ts          # Role ratios, limits, etc.
├── hooks/
│   ├── usePlayer.ts              # Player identity hook
│   ├── useRoom.ts                # Room data + realtime
│   ├── useLobby.ts               # Lobby state + subscriptions
│   └── useRole.ts                # Current player's role
├── types/
│   ├── database.ts               # Supabase generated types
│   ├── room.ts                   # Room-related types
│   ├── player.ts                 # Player-related types
│   └── role.ts                   # Role-related types
└── styles/
    └── globals.css               # Tailwind imports + custom styles

tests/
├── unit/
│   ├── domain/
│   │   ├── roles.test.ts         # Role assignment tests
│   │   └── room-state.test.ts    # State transition tests
│   └── utils/
│       └── room-code.test.ts     # Code generation tests
├── integration/
│   └── api/
│       ├── rooms.test.ts         # Room API tests
│       └── roles.test.ts         # Role API tests
└── e2e/
    ├── create-room.spec.ts       # Room creation flow
    ├── join-room.spec.ts         # Join room flow
    └── role-distribution.spec.ts # Role distribution flow
```

**Structure Decision**: Unified Next.js App Router project following constitution's separation of concerns. Domain logic isolated in `lib/domain/`, data access in `lib/supabase/`, UI in `components/`.

## Database Schema

See [data-model.md](./data-model.md) for complete schema details.

### Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `players` | Player identity registry | `id`, `player_id` (localStorage UUID), `nickname`, `created_at` |
| `rooms` | Game room instances | `id`, `code`, `manager_player_id`, `expected_players`, `status`, `last_activity_at` |
| `room_players` | Players in each room | `room_id`, `player_id`, `joined_at`, `is_connected`, `disconnected_at` |
| `player_roles` | Role assignments | `room_id`, `player_id`, `role`, `is_confirmed` |

### Row-Level Security Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `players` | Own record only | Anyone (register) | Own record only | Never |
| `rooms` | Waiting rooms (public list) OR member | Authenticated | Manager only | Never (auto-cleanup) |
| `room_players` | Same room members | Via API (server) | Same room members | Via API (server) |
| `player_roles` | Own role only | Via API (server) | Own confirmation | Never |

## API Contracts

See [contracts/api.md](./contracts/api.md) for complete API specifications.

### Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/players` | Register/update player | Player ID header |
| GET | `/api/rooms` | List active rooms | None |
| POST | `/api/rooms` | Create room | Player ID header |
| GET | `/api/rooms/[code]` | Get room details | Room member |
| POST | `/api/rooms/[code]/join` | Join room | Player ID header |
| POST | `/api/rooms/[code]/leave` | Leave room | Room member |
| POST | `/api/rooms/[code]/distribute` | Distribute roles | Room manager |
| POST | `/api/rooms/[code]/confirm` | Confirm role | Room member |
| POST | `/api/rooms/[code]/start` | Start game | Room manager |

## Room State Lifecycle

```
┌─────────────┐     Manager clicks      ┌──────────────────┐
│   waiting   │ ───"Distribute Roles"──▶│ roles_distributed │
│             │      (room full)        │                  │
└─────────────┘                         └────────┬─────────┘
                                                 │
                                    All players confirm +
                                    Manager clicks "Start"
                                                 │
                                                 ▼
                                        ┌─────────────┐
                                        │   started   │
                                        │             │
                                        └─────────────┘
```

### State Transitions

| From | To | Trigger | Validation |
|------|----|---------|------------|
| (none) | `waiting` | Room created | Creator becomes manager |
| `waiting` | `roles_distributed` | Manager distributes | Room must be full |
| `roles_distributed` | `started` | Manager starts | All players confirmed |

### Player Connection States

| State | Display | Behavior |
|-------|---------|----------|
| `connected` | Normal | Player active in lobby |
| `disconnected` | "Disconnected" badge | Grace period active (5 min) |
| (removed) | Gone from list | Grace period expired |

## Real-Time Subscriptions

### Supabase Realtime Channels

```typescript
// Room-specific channel for lobby updates
const channel = supabase
  .channel(`room:${roomCode}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'room_players',
    filter: `room_id=eq.${roomId}`
  }, handlePlayerChange)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rooms',
    filter: `id=eq.${roomId}`
  }, handleRoomChange)
  .subscribe();
```

### What Triggers Real-Time Updates

| Event | Tables Affected | UI Update |
|-------|-----------------|-----------|
| Player joins | `room_players` | Add to player list |
| Player leaves | `room_players` | Remove from list |
| Player disconnects | `room_players` | Show "Disconnected" |
| Roles distributed | `rooms`, `player_roles` | Show role modal |
| Role confirmed | `player_roles` | Update confirmation count |
| Game started | `rooms` | Redirect to game view |

## Environment Configuration

### Required Environment Variables

```env
# .env.local (development)
# .env.production (Vercel)

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  # Public, safe for client

# Server-only (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...      # Only in API routes
```

### Vercel Configuration

1. Add environment variables in Vercel dashboard
2. `SUPABASE_SERVICE_ROLE_KEY` must NOT have `NEXT_PUBLIC_` prefix
3. Enable Supabase integration if available

### Supabase Project Setup

1. Create new Supabase project
2. Run migration SQL (see data-model.md)
3. Enable Realtime for `rooms`, `room_players`, `player_roles` tables
4. Configure RLS policies
5. Copy project URL and keys to environment variables

## Implementation Phases

### Phase 1: Foundation (Setup)

**Goal**: Project scaffolding and infrastructure ready

1. Initialize Next.js project with App Router and TypeScript
2. Configure Tailwind CSS
3. Set up Supabase client (browser + server)
4. Configure environment variables
5. Create base layout and styling

**Checkpoint**: App runs locally, connects to Supabase

### Phase 2: Database & Security

**Goal**: Schema deployed, RLS enforced

1. Create database migration with all tables
2. Implement RLS policies
3. Generate TypeScript types from schema
4. Test RLS policies manually

**Checkpoint**: Database ready, queries work with correct permissions

### Phase 3: Player Identity

**Goal**: Players can identify themselves

1. Implement localStorage player ID generation
2. Create `usePlayer` hook
3. Implement `/api/players` endpoint
4. Build nickname input component

**Checkpoint**: Player can set nickname, ID persists across refreshes

### Phase 4: Room Creation

**Goal**: Players can create rooms

1. Implement room code generation (6-char alphanumeric)
2. Create `/api/rooms` POST endpoint
3. Build CreateRoomModal component
4. Implement room creation flow on landing page
5. **Add unit tests for room code generation**

**Checkpoint**: Player can create room, gets code, lands in lobby

### Phase 5: Active Rooms List

**Goal**: Players can browse and discover rooms

1. Implement `/api/rooms` GET endpoint
2. Build RoomList and RoomCard components
3. Create `/rooms` page
4. Add real-time subscription for room list updates

**Checkpoint**: Room list shows all waiting rooms, updates in real-time

### Phase 6: Join Room

**Goal**: Players can join rooms

1. Implement `/api/rooms/[code]/join` endpoint
2. Build JoinRoomForm component
3. Add join from room list (click Join button)
4. Add join by code (landing page input)
5. Handle edge cases (full room, invalid code)
6. **Add smoke test for join flow**

**Checkpoint**: Multiple players can join same room

### Phase 7: Room Lobby

**Goal**: Real-time lobby experience

1. Create `/rooms/[code]` page
2. Build Lobby, PlayerList, PlayerCard components
3. Implement Supabase Realtime subscriptions
4. Display room info, player list, manager badge
5. Implement "Copy Room Code" functionality
6. Handle player disconnect/reconnect states
7. Implement leave room functionality

**Checkpoint**: Lobby updates in real-time (<2s), shows all players

### Phase 8: Role Distribution

**Goal**: Manager can distribute roles

1. Implement role assignment logic in `lib/domain/roles.ts`
2. Create `/api/rooms/[code]/distribute` endpoint
3. Show "Distribute Roles" button to manager when room full
4. Build RoleRevealModal component
5. Implement role reveal with Evil team visibility
6. **Add unit tests for role distribution logic**

**Checkpoint**: Roles assigned correctly per Avalon ratios, each player sees only their role

### Phase 9: Role Confirmation & Game Start

**Goal**: Complete pre-game flow

1. Implement `/api/rooms/[code]/confirm` endpoint
2. Add confirmation UI in RoleRevealModal
3. Display confirmation progress in lobby
4. Implement `/api/rooms/[code]/start` endpoint
5. Show "Start Game" button when all confirmed
6. Create `/game/[code]` placeholder page
7. **Add E2E test for full flow**

**Checkpoint**: Full flow works: create → join → distribute → confirm → start

### Phase 10: Polish & Cleanup

**Goal**: Production-ready MVP

1. Error handling for all API routes
2. User-friendly error messages
3. Loading states for all async operations
4. Room cleanup job (24h/48h inactivity)
5. Mobile responsiveness pass
6. Final smoke test suite

**Checkpoint**: MVP ready for deployment

## Complexity Tracking

No constitution violations requiring justification. All design choices align with established principles.

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase Realtime latency | Fallback to polling if >2s; monitor in production |
| localStorage loss (incognito) | Show warning; allow nickname re-entry with same name |
| Concurrent join race condition | Database constraint on room capacity; return clear error |
| Manager abandonment | Auto-transfer after grace period to longest-present player |
