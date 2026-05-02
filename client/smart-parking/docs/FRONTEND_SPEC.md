# ParkX Frontend Spec (For AI/Developers)

## Routing structure (Expo Router)
- `app/(auth)/login.js`: login page.
- `app/(auth)/register.js`: register page.
- `app/(app)/index.js`: dashboard/home.
- `app/(app)/areas.js`: parking area availability list.
- `app/(app)/vehicles.js`: vehicle management.
- `app/(app)/history.js`: booking history.
- `app/(app)/profile.js`: basic profile/logout.
- `app/(app)/receipt/[bookingId].js`: receipt and payment status.

## Auth/session rules
- Store session in `AsyncStorage` keys:
  - `token`
  - `userId`
- Protected screens must redirect to `/login` when token is missing.
- API client must always send `Authorization: Bearer <token>` when token exists.

## API base URL rule
- Base URL should include `/api`.
- Current client uses Expo host auto-detection in `services/api.js`.
- For Expo Go, backend must run on same LAN and be reachable from phone.

## Endpoint contract
- `POST /api/auth/register`
  - body: `{ username, email, password }`
- `POST /api/auth/login`
  - body: `{ email, password }`
  - response supported by client:
    - `{ token, userId }`
    - `{ data: { token, userId } }`

- `GET /api/slots/areas`
- `GET /api/slots/:areaId`

- `POST /api/vehicles`
  - body: `{ vehicle_number, vehicle_type }`
- `GET /api/vehicles/user/:id`
- `DELETE /api/vehicles/:id`

- `POST /api/booking/book`
  - body: `{ vehicle_id, slot_id }`
- `GET /api/booking/active`
- `POST /api/booking/exit`
  - body: `{ booking_id }`
- `GET /api/booking/history/:userId`
- `GET /api/booking/receipt/:bookingId`
- `POST /api/booking/pay`
  - body: `{ booking_id }`

## UI behavior expectations
- App starts on dashboard route, but redirects to `/login` if not authenticated.
- Header should be hidden on `/login` and `/register`.
- Dashboard shows:
  - active booking summary (if exists)
  - parking area availability
  - shortcuts to History and Vehicles
- Receipt page shows:
  - booking, vehicle, slot, duration, amount, payment status
  - `Mark Payment Complete` button only when completed and unpaid.

## Error handling expectations
- Show backend `message` field whenever available.
- For unknown failures, use fallback messages (e.g. `Login failed`).
- Never crash on null/empty API responses; show loading/empty states.
