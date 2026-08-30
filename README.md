# Challenge 360° — Team Habit Scorecard

A multi-team, multi-user habit scorecard for a 360° wellness challenge
(Body · Mind · Heart · Soul). React + Vite + Tailwind frontend, Supabase
(Postgres + Auth) backend, Google sign-in, and per-user Google Drive uploads
for wearable health-report screenshots — no paid services required.

## Quick start

**→ See [`INSTALLATION_GUIDE.md`](./INSTALLATION_GUIDE.md) for the full
step-by-step setup** (Supabase project, Google Cloud OAuth, environment
variables, Vercel deploy). Start there.

Short version, once Supabase + Google Cloud are set up:

```bash
npm install
cp .env.example .env.local   # fill in your Supabase + Google keys
npm run dev
```

## Features

- **Dark, mobile-first UI** — bottom tab navigation (Logger / Ranks / Feed / More)
- **Teams** — admins create teams; participants join one at signup
- **Self-signup** with email verification, plus "Continue with Google"
- **Community Feed** — auto-posted daily activity with emoji reactions, so everyone can see who's showing up
- **Leaderboard** — Overall, plus pillar-specific categories (Body Masters, Mind Sages, Heart Healers, Soul Seekers) and a Team tab, with personal goal progress
- **Weekly strength qualifier enforcement** — a week's points (and its +50 workout bonus) are automatically excluded from the leaderboard if fewer than 2 strength/cardio sessions were logged that week
- **Admin panel** — create/manage participants, teams, roles, passwords, goals
- **Health report uploads** — screenshots go straight to the participant's own Google Drive, never our servers
- Scoring engine matching the exact Challenge 360° point system

## What's inside

- `src/` — the React app (scorecard, leaderboard, analytics, calendar, admin)
- `api/admin/` — Vercel serverless functions for admin-only user management
  (uses the Supabase service role key, server-side only)
- `supabase/schema.sql` — full database schema + row-level security +
  leaderboard-safe aggregation functions
- `src/constants/rules.ts` — the exact point system
- `src/lib/googleDrive.ts` — client-side Google Drive upload helper

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — TypeScript type-check
