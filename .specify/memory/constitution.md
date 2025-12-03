<!--
Sync Impact Report
==================
- Version change: 0.0.0 → 1.0.0 (MAJOR - initial constitution ratification)
- Added sections:
  - I. Purpose & Vision
  - II. Tech Stack & Infrastructure
  - III. Data & Security
  - IV. Code Quality & Architecture
  - V. Testing & Reliability
  - VI. UX & Product Principles
  - VII. Workflow & Collaboration
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (no changes required - compatible)
  - .specify/templates/spec-template.md ✅ (no changes required - compatible)
  - .specify/templates/tasks-template.md ✅ (no changes required - compatible)
- Follow-up TODOs: None
-->

# Avalon Online Constitution

This constitution governs all specifications, plans, tasks, and implementations for the Avalon Online project. AI agents and human contributors MUST adhere to these principles.

## Core Principles

### I. Purpose & Vision

**Mission**: Build a small, focused web application enabling groups to play the social deduction game "Avalon" together online.

**Guiding Values**:
- **Clarity**: Code, UI, and documentation must be immediately understandable.
- **Maintainability**: Favor simplicity over cleverness; future developers (human or AI) must be able to extend features confidently.
- **Incremental Delivery**: The MVP focuses on room creation, lobby, and role distribution. Full game logic will come in future phases.
- **Spec-Driven Development**: Every feature follows the flow: specification → plan → tasks → implementation. No ad-hoc features.

### II. Tech Stack & Infrastructure

**Frontend**:
- React with Next.js (App Router) and TypeScript.
- All components MUST be typed; use strict TypeScript configuration.

**Backend**:
- Next.js API routes and Server Components for server-side logic.
- Supabase as the primary backend: Postgres database, Auth, and Realtime subscriptions.

**Hosting**:
- Vercel for the Next.js application.
- Supabase project for database, authentication, and real-time features.

**Data Persistence**:
- ALL persistent state (users, rooms, players, roles, game state) MUST reside in Supabase Postgres.
- No local storage or client-side persistence for game-critical data.

**Environment & Keys**:
- Supabase service-role key MUST ONLY be used server-side (API routes, Server Components).
- Client-side code MUST use the anon/public key with Row-Level Security enforced.
- NEVER expose `SUPABASE_SERVICE_ROLE_KEY`, JWT secrets, or any sensitive credentials to the browser.

### III. Data & Security

**Row-Level Security (RLS)**:
- Every table holding per-user or per-room data MUST have RLS enabled.
- Policies MUST be explicit and documented in migration files or a dedicated `rls-policies.md`.

**Room Isolation**:
- Each room MUST be completely isolated; players from one room MUST NOT access another room's state.
- Room IDs MUST be non-sequential, randomly generated short codes (e.g., 6-character alphanumeric).

**Authorization**:
- Only authenticated players who are members of a room can view its state.
- Room manager actions (start game, distribute roles, kick player) MUST be enforced server-side.
- Client-side checks are for UX only; never trust them for security.

**Sensitive Operations**:
- Role assignment, game state transitions, and any operation affecting game integrity MUST use server-side Supabase calls with the service-role key.

### IV. Code Quality & Architecture

**TypeScript Standards**:
- `strict: true` in `tsconfig.json` — no exceptions.
- Avoid `any` type. If unavoidable, add a `// TODO: remove any` comment with justification.
- Prefer explicit return types on exported functions.

**Component & Function Design**:
- Favor small, pure functions and simple React components.
- No "god components" — if a component exceeds ~150 lines, consider splitting.
- No monolithic API handlers — each route should do one thing well.

**Separation of Concerns**:

```
src/
├── components/       # React UI components (presentational)
├── app/              # Next.js App Router pages and layouts
├── lib/
│   ├── supabase/     # Supabase client setup and typed queries
│   ├── domain/       # Avalon game logic (room state, role assignment, validation)
│   └── utils/        # Generic utilities (formatting, random codes, etc.)
├── types/            # Shared TypeScript types and interfaces
└── hooks/            # Custom React hooks
```

**Domain Logic Isolation**:
- Game rules (role distribution, state transitions, win conditions) MUST live in `lib/domain/`.
- Domain modules MUST be pure functions where possible — no direct DB calls within them.
- Data access functions in `lib/supabase/` call domain logic, not the other way around.

### V. Testing & Reliability

**Smoke Tests (Required)**:
- Room creation flow
- Joining a room with a valid code
- Role distribution to players

**Unit Tests (Recommended)**:
- Domain logic in `lib/domain/` SHOULD have unit tests.
- Tests MUST NOT require database connections — mock data layer if needed.

**Error Handling**:
- ALL network and database operations MUST have error handling.
- User-facing errors MUST be clear and non-technical (e.g., "Unable to join room. Please check the code and try again.").
- Technical errors MUST be logged server-side with context.

**Logging & Observability**:
- Log important events: room created, player joined, roles distributed, game started.
- Use structured logging (JSON format) or a dedicated `game_events` table in Supabase.
- Logs MUST include: timestamp, event type, room ID, user ID (where applicable).

### VI. UX & Product Principles

**Design Philosophy**:
- Minimal, clean UI — prioritize function over visual complexity.
- Clarity over flair: every screen should have an obvious primary action.

**Core User Flows**:
1. **Landing** → Create game OR Join game
2. **Create game** → Lobby (as room manager)
3. **Join game** → Enter room code → Lobby
4. **Lobby** → See players, wait for start
5. **Role Reveal** → Private role displayed to each player

**Real-Time Updates**:
- Player joins, lobby changes, and game state transitions MUST reflect in UI within 2 seconds.
- Use Supabase Realtime subscriptions for all multiplayer state.

**Responsive Design**:
- Design for desktop web first.
- Mobile web MUST be functional (no blocking bugs), but can have degraded UX.

### VII. Workflow & Collaboration

**Repository & Deployment**:
- Hosted on GitHub; deployed via Vercel.
- `main` branch is protected; all changes via pull request.

**Branch Naming**:
- Format: `###-feature-name` (e.g., `001-avalon-mvp-lobby`)
- Branch number corresponds to Spec Kit feature number.

**Pull Request Requirements**:
- MUST reference the corresponding spec and tasks from `.specify/specs/`.
- MUST pass all CI checks (lint, type check, tests).
- SHOULD include a brief description of changes and any deviations from the spec.

**Spec-Driven Development**:
- Use Spec Kit commands in order:
  1. `/speckit.specify` — Define what to build
  2. `/speckit.plan` — Determine how to build it
  3. `/speckit.tasks` — Break into actionable tasks
  4. `/speckit.implement` — Execute tasks
- No feature work without a spec. Emergency hotfixes MUST be documented retroactively.

## Governance

**Constitution Authority**:
- This constitution supersedes all ad-hoc decisions.
- When in doubt, refer to this document.

**Amendment Process**:
1. Propose change via pull request to `.specify/memory/constitution.md`.
2. Document rationale and impact in PR description.
3. Increment version according to semantic versioning:
   - MAJOR: Principle removal or incompatible redefinition
   - MINOR: New principle or significant expansion
   - PATCH: Clarification, typo fix, wording improvement
4. Update `LAST_AMENDED_DATE` upon merge.

**Compliance**:
- All PRs and code reviews MUST verify alignment with this constitution.
- AI agents MUST check constitution before generating specs, plans, or code.
- Violations MUST be flagged and resolved before merge.

**Version**: 1.0.0 | **Ratified**: 2025-12-02 | **Last Amended**: 2025-12-02
