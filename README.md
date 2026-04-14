# Next Level Football Academy

A mobile-first football training app for children aged 8 to 13.

## What It Includes

- Login and account creation
- Home dashboard with daily motivation and progress
- Daily training drills with completion flow
- Football challenge system with badges and XP
- Weekly and monthly leaderboard
- Player profile with streaks and rewards
- Coach panel for adding quotes and extra challenges

## Local Development

```bash
npm install
npm run dev
```

If no Supabase environment variables are set, the app runs in local demo mode and stores data in browser local storage.

## Production Build

```bash
npm run build
npm run preview
```

## GitHub Pages

This project is configured for GitHub Pages deployment.

- Client-side routing uses `HashRouter` so page refreshes do not break on Pages
- The GitHub Pages base path is enabled automatically in the deploy workflow
- A workflow file publishes the app from the `main` branch

After pushing to GitHub:

1. Open the repository settings
2. Go to `Pages`
3. Set the source to `GitHub Actions`
4. Push to `main` to deploy

If your repository stays private, GitHub Pages availability depends on your GitHub plan.

To enable the real Supabase backend on GitHub Pages, add these repository variables or secrets before deploying:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Pages workflow reads those values during the build. If they are missing, the deployed site will fall back to local mode.

## Supabase Setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run the SQL in `supabase/migrations/20260413223500_initial_schema.sql` in the Supabase SQL editor, or push it later with the Supabase CLI.
4. In Supabase Auth, enable Email provider for email/password sign-in.
5. If you want sign-up to log children in immediately, disable email confirmation. If you keep confirmation enabled, the app will ask the user to confirm their email after sign-up.
6. If you deploy to GitHub Pages, add your Pages URL as the Supabase Site URL and Redirect URL.

When Supabase is configured, the app switches automatically to:

- Email/password auth
- Server-backed XP, streaks, badges, and challenge completion
- Live leaderboard data from Supabase
- Shared coach quotes and coach challenges

## Backend Notes

- Progress only counts through the Supabase RPC functions in the migration, not by random UI clicks.
- The current leaderboard scaffold reads profile and completion tables directly from the client after login. That is fine for small early-stage usage, but for larger scale you should replace it with dedicated leaderboard RPCs or views.

## Demo Login

- Username: `sam10`
- Password: `academy`

## Current Architecture

This project now supports two modes:

- Local fallback mode with browser local storage when Supabase env vars are missing
- Supabase-backed mode with Auth, Postgres persistence, and server-side reward rules when env vars are present
