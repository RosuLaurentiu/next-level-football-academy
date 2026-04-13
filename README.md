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

## Demo Login

- Username: `sam10`
- Password: `academy`

## Current Architecture

This version is frontend-only and stores app state in browser local storage.
