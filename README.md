# Doctor Tracker – Backend API

## Description

Doctor Tracker API is the secure REST backend for a hospital admin portal that manages doctors and their patients. Built with Express and MongoDB, it provides JWT authentication (httpOnly cookies with refresh-token rotation), role-based authorization, doctor and patient CRUD with indexed server-side search, filtering and pagination, admin profile and password management, and aggregated analytics endpoints that power the dashboard charts. The Next.js client lives in `doctor-tracker-frontend`.

## Setup Guide

**Requirements:** Node.js 18+, MongoDB (local or Atlas).

1. Install dependencies
   ```bash
   cd doctor-tracker-backend
   npm install
   ```
2. Create the environment file from the included `.env.example`
   ```bash
   cp .env.example .env
   ```
   | Variable | Description |
   |---|---|
   | `PORT` | API port (default `5000`) |
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | long random secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `CLIENT_URL` | allowed frontend origin(s), comma separated (CORS) |
   | `COOKIE_SAME_SITE` | `lax` locally; `none` (HTTPS) if frontend and API are on different domains |
   | `SEED_ADMIN_NAME/EMAIL/PASSWORD` | admin created by the seed script (`admin@gmail.com` / `Admin@123456`) |
3. Seed the database (admin user, 14 doctors, 220 patients, indexes)
   ```bash
   npm run seed         
   ```
4. Start the server
   ```bash
   npm run dev          
   ```
5. Check `GET http://localhost:5000/api/health`, then log in with the seeded admin.

## System Architecture

```
Next.js client ──REST/JSON, httpOnly cookies──▶ Express API ──Mongoose──▶ MongoDB

request ─▶ helmet · cors · rate-limit ─▶ protect (JWT) ─▶ restrictTo(role) ─▶ validate (zod) ─▶ controller ─▶ model
                                                                                   └─▶ errorHandler (uniform JSON errors)
```

### API Reference (prefix `/api`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Login, sets cookies, returns `accessToken` | public |
| POST | `/auth/refresh` | Rotate tokens via refresh cookie | public |
| POST | `/auth/logout` | Revoke refresh token, clear cookies | public |
| GET | `/auth/me` | Current user | auth |
| PUT | `/auth/profile` | Update own `name` / `email` | auth |
| PUT | `/auth/password` | Change own password (`currentPassword`, `newPassword`); other sessions revoked | auth |
| POST | `/auth/register` | Create admin/staff user | admin |
| GET | `/doctors` | List: `page, limit, search, specialization, hospital, from, to, sortBy, order` | auth |
| POST | `/doctors` | Create doctor | auth |
| GET | `/doctors/filters` | Distinct specializations and hospitals | auth |
| GET / PUT | `/doctors/:id` | Get (with `patientsCount`) / update | auth |
| DELETE | `/doctors/:id` | Delete doctor and their patients | admin |
| GET / POST | `/doctors/:id/patients` | List / add patient under a doctor | auth |
| DELETE | `/doctors/:id/patients/:patientId` | Remove patient from doctor | auth |
| GET / POST | `/patients` | List (`search, doctor, condition, gender, from, to, …`) / create | auth |
| GET | `/patients/conditions` | Distinct conditions | auth |
| GET / PUT / DELETE | `/patients/:id` | Get / edit / delete | auth |
| GET | `/dashboard/stats?days=30&top=10` | Totals, patients per doctor, daily timelines, distributions, recent patients | auth |

`from` / `to` are ISO dates filtering on `createdAt`. Success: `{ success:true, data, meta? }`.

## Technical Decisions

### 1. JWT Authentication
- JWT authentication using httpOnly cookies.
- Access token expires in 15 minutes; refresh token in 7 days.
- Refresh tokens are stored as SHA-256 hashes and rotated on every refresh.
- Logout and password changes revoke existing sessions.
- Bearer token support for Postman and external API clients.

### 2. Database Optimization
- Compound indexes for faster filtering, sorting and pagination.
- MongoDB `$facet` retrieves paginated data and total count in one query.
- `$lookup` runs after `$limit` to reduce database workload.
- Dashboard analytics run in parallel using `Promise.all` and aggregation pipelines.
- Regex-based partial search with escaped input.

## Visual Evidence

This is an API-only service, so the visual evidence is the client UI it powers. Screenshots (sample data: 14 doctors, 220 patients):

### Desktop

| Dashboard (`/dashboard/stats`) | Doctors (`/doctors`) |
|---|---|
| ![Dashboard](docs/screenshots/desktop-02-dashboard.png) | ![Doctors](docs/screenshots/desktop-03-doctors.png) |

| Doctor's patients (`/doctors/:id/patients`) | Profile and password (`/auth/profile`, `/auth/password`) |
|---|---|
| ![Doctor detail](docs/screenshots/desktop-04-doctor-detail.png) | ![Profile](docs/screenshots/desktop-06-profile.png) |

### Mobile

| Login | Dashboard | Patients | Profile |
|---|---|---|---|
| <img src="docs/screenshots/mobile-01-login.png" width="190"> | <img src="docs/screenshots/mobile-02-dashboard.png" width="190"> | <img src="docs/screenshots/mobile-05-patients.png" width="190"> | <img src="docs/screenshots/mobile-06-profile.png" width="190"> |
