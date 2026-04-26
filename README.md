# ParkX

Smart parking application with an Expo (React Native) client and an Express + PostgreSQL backend. It lets drivers register/login, save their vehicles, browse live slot availability by area, create bookings, view active/previous sessions, generate receipts, and close/pay for parking. The backend enforces JWT auth, keeps slot occupancy consistent, and calculates duration-based fees; the mobile client handles session storage, guarded routes, and friendly loading/error states.

## Project Structure

- client/smart-parking – Expo app with Expo Router, hooks, and API services.
- server/parkx-backend – Express API with PostgreSQL, JWT auth, and parking domain controllers.
- server/parkx-backend/sql – Schema and data helpers for local databases.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with a reachable instance
- Expo tooling (`npm i -g expo-cli` recommended) and a device/emulator (Android/iOS) on the same LAN as the backend

## Backend Setup (Express + PostgreSQL)

1) Install dependencies

```bash
cd server/parkx-backend
npm install
```

2) Configure environment (create .env)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parkx
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=change_me
PARKING_RATE_PER_HOUR=20
PORT=5000
```

3) Create schema

- Run server/parkx-backend/sql/complete_schema.sql against your database.
- Optional: apply server/parkx-backend/sql/002_booking_billing_and_payment.sql if you need the incremental script.

4) Start the API

```bash
npm run dev   # nodemon
# or
npm start     # node app.js
```

The server seeds slots on startup (areas a/b/c) and adds a deleted_at column to vehicles if missing. Health check: GET /api/health.

## Frontend Setup (Expo)

1) Install dependencies

```bash
cd client/smart-parking
npm install
```

2) Start Expo

```bash
npx expo start --lan
```

- Ensure the backend is reachable from your device/emulator on the same LAN.
- The client auto-detects the Expo host for API calls; backend must be served with the /api prefix.

## Key API Routes

- Auth: POST /api/auth/register, POST /api/auth/login (returns { token, userId, user })
- Vehicles (auth): POST /api/vehicles, GET /api/vehicles, DELETE /api/vehicles/:id
- Slots: GET /api/slots/areas, GET /api/slots/area/:areaId
- Bookings (auth):
  - POST /api/bookings (body: vehicle_id, slot_id)
  - POST /api/bookings/exit (body: booking_id optional; defaults to user’s active booking)
  - GET /api/bookings/active, GET /api/bookings/active/all, GET /api/bookings/history, GET /api/bookings/:id

All auth-protected routes expect Authorization: Bearer <token>.

## App Behavior Highlights

- Auth/session stored in AsyncStorage (`token`, `userId`).
- Unauthenticated users are redirected to /login; headers hidden on /login and /register.
- Dashboard shows active booking, availability, and shortcuts to history/vehicles.
- Receipt page shows booking details and payment status; payment completion handled server-side when exiting.

## Useful Scripts

- Frontend: npm run reset-project (creates a fresh app/ directory from starter)
- Backend: npm run dev (watch mode), npm start (prod)

## Troubleshooting

- If the backend port is in use, set PORT to another value and restart.
- For Expo Go/device testing, use --lan and ensure the phone can reach your computer’s IP on the backend port.
- Check /api/health to confirm database connectivity.
