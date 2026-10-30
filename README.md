# FitFlow Admin

Admin web for [FitFlow](https://github.com/PRM-393-G5/fitflow), built with
React, Vite and TypeScript (antd, React Router, TanStack Query). It talks
to the [FitFlow API](https://github.com/PRM-393-G5/fitflow-api) through its
`/api/admin/*` routes.

## Features

- **Sign-in** with an admin account (email + password).
- **Dashboard**: users (total, new, locked, active), workouts, training
  time, form checks, AI calls and templates for the last 7, 30 or 90
  days, with workouts and new users per day. Days are the admin's
  (browser time zone); every chart has a table view.
- **AI usage**: calls, failures (by cause), signed-in users and average
  duration, calls per day and per feature, the top users and the latest
  calls. Prompts, photos and answers are never stored by the API.
- **Users**: everyone who signed in to the app, searchable by email or
  name and filterable by status (filters live in the URL). A user's page
  shows their synced profile, workout totals, data counts and recent
  sessions, and lets the admin lock/unlock the account (signs it out
  everywhere) or delete it with all its data (type the email to confirm).
- **Workout templates**: the public library every FitFlow user sees. List
  in display order, move templates up or down, create, edit and delete.
  The form follows the app's rules (levels, categories, reps or timed
  exercises) and shows the duration the app will compute; existing
  exercise ids are kept so users' history still matches.

## Requirements

- Node.js 24 and npm
- A running FitFlow API with:
  - `CORS_ORIGINS=http://localhost:5173` in its `.env` (the admin web is a
    browser app on another origin), and
  - an admin account: `npm run admin:create -- you@example.com "Your Name"`
    in the API folder.

## Setup and run

```sh
npm install
cp .env.example .env.local   # adjust VITE_API_BASE_URL if needed
npm run dev                  # http://localhost:5173
```

Sign in with the admin account's email and password. The session lasts
as long as the API's admin token (`ADMIN_TOKEN_TTL_SECONDS`, 8 hours by
default) and is kept in the browser's local storage; the admin is sent
back to the sign-in page when it expires or the API rejects it (e.g. the
admin's password was reset).

| Variable            | Default                     | Purpose                                                                                                                            |
| ------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | FitFlow API base URL, ending in `/api`. Read at build time: set it when building for a deployment, or the bundle calls `localhost` |

## Quality checks and tests

```sh
npm run lint
npm run typecheck
npx prettier --check .
npm test          # Vitest + Testing Library (jsdom)
npm run build     # production build in dist/
```

GitHub Actions (`.github/workflows/ci.yml`) runs all of the above on every
push to `main` and every pull request.
