# FitFlow Admin

Admin web for [FitFlow](https://github.com/PRM-393-G5/fitflow), built with
React, Vite and TypeScript (antd, React Router, TanStack Query). It talks
to the [FitFlow API](https://github.com/PRM-393-G5/fitflow-api) through its
`/api/admin/*` routes.

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

| Variable            | Default                     | Purpose                                |
| ------------------- | --------------------------- | -------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | FitFlow API base URL, ending in `/api` |

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
