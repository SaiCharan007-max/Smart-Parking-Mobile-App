# ParkX Web Deployment

This project can be deployed with:

- Backend on Render
- Database on Neon
- Frontend on Vercel

## Architecture

- `client/smart-parking`: Expo Router web build, exported as static files
- `server/parkx-backend`: Express API
- Neon: hosted PostgreSQL via `DATABASE_URL`

## Backend on Render

Create a new Render Web Service from this repository.

Recommended settings:

- Root Directory: `server/parkx-backend`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables:

- `DATABASE_URL` = your Neon connection string
- `JWT_SECRET` = strong random secret
- `DEFAULT_RATE_PER_HOUR` = `45`
- `NODE_ENV` = `production`

Notes:

- The backend already reads `PORT` from the environment, which matches Render's hosting model.
- CORS is currently open, so Vercel can call the API without additional server changes.

## Frontend on Vercel

Create a Vercel project using `client/smart-parking` as the project root.

Recommended settings:

- Framework Preset: `Other`
- Root Directory: `client/smart-parking`
- Build Command: `npx expo export --platform web`
- Output Directory: `dist`

Environment variables:

- `EXPO_PUBLIC_API_URL` = your Render backend URL, for example `https://parkx-backend.onrender.com/api`
- `EXPO_PUBLIC_API_PORT` = `5000`

Notes:

- In production web builds, the app now prefers `EXPO_PUBLIC_API_URL`.
- In local web development, the app still falls back to the local browser host.

## Phone-style browser layout

The web app now renders inside a centered phone-width shell on desktop browsers.

- Max width is constrained to a mobile device style layout
- The app keeps the native full-screen layout on Android/iOS

## Important limitation

This frontend uses Expo Router with `web.output: "static"`.

That works well on Vercel for normal pages, but dynamic routes such as:

- `/receipt/[bookingId]`

can be fragile on static hosting if a user refreshes a deep linked URL directly.

Inside the app, client-side navigation still works. If you want fully reliable direct browser access for receipt pages, the safest next step is to move that screen to a static route such as:

- `/receipt?bookingId=123`

or migrate to a server-rendered web setup later.
