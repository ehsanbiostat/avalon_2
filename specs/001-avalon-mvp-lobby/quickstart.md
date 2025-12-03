# Quickstart: Avalon Online – MVP Lobby & Role Distribution

**Branch**: `001-avalon-mvp-lobby`
**Date**: 2025-12-02

This guide walks through setting up the development environment for the Avalon Online MVP.

---

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later (or pnpm/yarn)
- **Git**
- **Supabase account** (free tier works)
- **Vercel account** (for deployment, optional for local dev)

---

## 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd avalon-online

# Checkout the feature branch
git checkout 001-avalon-mvp-lobby

# Install dependencies
npm install
```

---

## 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `avalon-online-dev` (or your preference)
   - **Database Password**: Generate and save securely
   - **Region**: Choose closest to you
4. Wait for project to be created (~2 minutes)

---

## 3. Configure Database

### Run Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the migration SQL from `specs/001-avalon-mvp-lobby/data-model.md`
4. Click **Run**

### Enable Realtime

1. Go to **Database** → **Replication**
2. Under "Supabase Realtime", click **0 tables**
3. Enable realtime for:
   - `rooms`
   - `room_players`
   - `player_roles`

### Apply RLS Policies

1. Go to **SQL Editor**
2. Run the RLS policy SQL from `specs/001-avalon-mvp-lobby/data-model.md` (RLS section)

---

## 4. Environment Variables

### Get Supabase Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Find **Project API keys** section
3. Copy these values:

| Dashboard Field | Environment Variable |
|-----------------|---------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` key | `SUPABASE_SERVICE_ROLE_KEY` |

### Create `.env.local`

```bash
# Create environment file in project root
touch .env.local
```

Add your credentials to `.env.local`:

```env
# Supabase Configuration (from Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-only (NEVER expose to client or commit to git)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Security Notes**:
- Never commit `.env.local` to version control
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- The service_role key bypasses Row Level Security - use only in API routes

---

## 5. Run Development Server

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Verify Setup

### Test Database Connection

1. Open the app at `http://localhost:3000`
2. Enter a nickname
3. Click "Create Room"
4. If room is created, database connection works!

### Test Realtime

1. Open the app in two browser windows (or incognito)
2. In Window 1: Create a room
3. In Window 2: Join the room using the code
4. Window 1 should show the new player appear in real-time

---

## 7. Project Structure

```
avalon-online/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/
│   │   ├── supabase/        # Database clients and queries
│   │   ├── domain/          # Game logic (pure functions)
│   │   └── utils/           # Utilities
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript types
├── tests/
│   ├── unit/                # Unit tests (Vitest)
│   ├── integration/         # Integration tests
│   └── e2e/                 # E2E tests (Playwright)
├── specs/                   # Spec Kit specifications
│   └── 001-avalon-mvp-lobby/
├── .env.local               # Environment variables (not committed)
├── .env.example             # Template for env vars
└── package.json
```

---

## 8. Common Commands

```bash
# Development
npm run dev           # Start dev server (port 3000)
npm run build         # Production build
npm run start         # Start production server

# Testing
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:e2e      # Run E2E tests

# Code Quality
npm run lint          # Run ESLint
npm run typecheck     # Run TypeScript check
npm run format        # Format with Prettier

# Database
npm run db:generate   # Generate Supabase types
npm run db:migrate    # (future) Run migrations
```

---

## 9. Development Workflow

### Making Changes

1. Ensure you're on the feature branch: `git checkout 001-avalon-mvp-lobby`
2. Make changes
3. Run tests: `npm run test`
4. Run lint: `npm run lint`
5. Commit with descriptive message

### Testing Real-Time Features

For testing multiplayer features:

1. Use multiple browser windows (regular + incognito)
2. Or use different browsers (Chrome + Firefox)
3. Each window acts as a different player

### Debugging Database

1. Supabase dashboard has built-in table editor
2. Go to **Table Editor** to view/edit data
3. Go to **Logs** to see database queries

---

## 10. Deployment (Vercel)

### First-Time Setup

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import project
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

### Subsequent Deployments

- Push to `main` branch → automatic production deployment
- Push to feature branch → preview deployment

---

## Troubleshooting

### "Failed to connect to Supabase"

- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Ensure Supabase project is running (not paused)

### "Real-time updates not working"

- Check Realtime is enabled for tables (see step 3)
- Check browser console for WebSocket errors
- Verify RLS policies allow SELECT for the user

### "RLS policy error"

- Check the player has registered (POST `/api/players` first)
- Verify `X-Player-ID` header is being sent
- Test policies in Supabase SQL editor

### "Type errors after schema change"

```bash
# Regenerate TypeScript types
npm run db:generate
```

---

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## Support

If you encounter issues:

1. Check this quickstart guide
2. Review error messages in browser console
3. Check Supabase logs for database errors
4. Ask in project discussions/issues
