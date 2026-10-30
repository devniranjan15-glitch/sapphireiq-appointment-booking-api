# SapphireIQ Appointment Booking API

A student backend project built with **Node.js, Express, MongoDB/Mongoose and JWT**. Providers publish appointment slots; users book and cancel them. The API includes role-based access, validation, conflict prevention, centralized errors and automated tests.

## Features

- User/provider registration and login using hashed passwords and JWT
- Provider-only slot creation
- Public listing of future available slots
- User booking and cancellation
- Atomic slot claiming and a database unique partial index to guard active bookings
- Zod request validation, Helmet security headers, CORS and rate limiting
- Jest + Supertest integration tests using an in-memory MongoDB instance

> Demo note: public registration accepts `role: "provider"` to make the student project easy to test. For a production system, provider accounts should be approved by an administrator. Configure `CLIENT_ORIGIN` to your actual frontend domain before production deployment.

## Requirements

- Node.js 20 or newer
- MongoDB local installation or a MongoDB Atlas database
- VS Code
- Postman (recommended)

## Run locally (Windows PowerShell)

1. Extract the project ZIP and open the extracted folder in VS Code.
2. In VS Code Terminal, install packages:

   ```powershell
   npm install
   ```

3. Create your local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Open `.env` and set:
   - `MONGODB_URI` to your local MongoDB URI or Atlas connection string
   - `JWT_SECRET` to a random secret at least 32 characters long
   - `CLIENT_ORIGIN=*` for local API-only testing, or your frontend origin

   Never upload `.env` to GitHub.

5. Start the server:

   ```powershell
   npm run dev
   ```

6. Test in a browser:
   - `http://localhost:5000/`
   - `http://localhost:5000/health`

## API endpoints

All JSON request bodies should use `Content-Type: application/json`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | API information |
| GET | `/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register user/provider |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | JWT | Current account |
| GET | `/api/slots` | Public | List future available slots |
| POST | `/api/slots` | Provider | Create slot |
| GET | `/api/slots/mine` | Provider | List own slots |
| POST | `/api/bookings` | User | Book a slot (`slotId`) |
| GET | `/api/bookings/mine` | JWT | List own bookings (provider sees bookings for their slots) |
| PATCH | `/api/bookings/:id/cancel` | Booking owner or provider | Cancel booking |

## Postman examples

### 1. Register a provider

`POST http://localhost:5000/api/auth/register`

```json
{
  "name": "Dr. Sharma",
  "email": "provider@example.com",
  "password": "Password123!",
  "role": "provider"
}
```

Copy the returned `token`.

### 2. Create a slot

`POST http://localhost:5000/api/slots`

Authorization tab: **Bearer Token** → paste provider token.

```json
{
  "startAt": "2027-01-15T10:00:00.000Z",
  "endAt": "2027-01-15T10:30:00.000Z"
}
```

Use a future ISO-8601 time. Replace the sample date if it is no longer in the future.

### 3. Register a user

`POST http://localhost:5000/api/auth/register`

```json
{
  "name": "Aman Kumar",
  "email": "user@example.com",
  "password": "Password123!",
  "role": "user"
}
```

### 4. List slots

`GET http://localhost:5000/api/slots`

### 5. Book a slot

`POST http://localhost:5000/api/bookings`

Authorization: Bearer user token.

```json
{
  "slotId": "PASTE_SLOT_ID_HERE"
}
```

A successful request returns `201`; an already claimed slot returns `409 Conflict`.

### 6. View bookings and cancel

- `GET /api/bookings/mine` with a bearer token
- `PATCH /api/bookings/PASTE_BOOKING_ID_HERE/cancel` with a bearer token

After cancellation, the slot becomes available again.

## Automated tests

```powershell
npm test
```

The test suite starts an in-memory MongoDB server, so tests do not use your normal development database. The first test run may download the MongoDB test binary and require internet access.

## Deployment (Render + MongoDB Atlas)

1. Push this project to a GitHub repository.
2. Create a MongoDB Atlas database and configure its database user and network access. Prefer the hosting provider's documented outbound IP guidance; do not leave broad network access enabled unnecessarily.
3. In Render, create a **Web Service** and connect the repository.
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables in Render:
   - `MONGODB_URI` = Atlas connection string
   - `JWT_SECRET` = a new random secret (32+ characters)
   - `JWT_EXPIRES_IN` = `1d`
   - `CLIENT_ORIGIN` = your frontend origin, or `*` for temporary API-only testing
   - `NODE_ENV` = `production`
6. Deploy and test `https://YOUR-SERVICE.onrender.com/health`.

Never commit `.env`, database passwords, JWT secrets, or access tokens. Do not use production customer data for coursework tests.

## Suggested Git commands

```powershell
git init
git add .
git status
git commit -m "Build SapphireIQ appointment booking API"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sapphireiq-appointment-booking-api.git
git push -u origin main
```

If `origin` already exists, use `git remote -v` and `git remote set-url origin YOUR_REPOSITORY_URL` instead of adding it again.

## Learning modules

1. Setup & Data Modeling — Express server, database, User/Slot/Booking schemas.
2. Authentication & Roles — bcrypt password hashing, JWT and provider/user permissions.
3. Slots & Booking — create/list slots, book and cancel appointments.
4. Conflict Prevention & Validation — atomic slot claim, unique indexes and Zod validation.
5. Error Handling & Testing — central errors, Jest/Supertest and API documentation.

## Limitations and production hardening

This is an educational backend, not a fully audited medical or commercial booking platform. Production use should add provider approval, email verification, password reset, audit logging, stronger operational monitoring, explicit appointment overlap rules, and a transaction/outbox strategy appropriate to the chosen database deployment.
