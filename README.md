# Worker Booking App

Fullstack example project where users can book workers for tasks, see availability and ETA, share their location, leave reviews, and where admins can manage workers and users.

## Stack

- **Frontend**: React + Vite (`client`)
- **Backend**: Node.js + Express + MongoDB + Mongoose (`server`)

## Features

- **Users**
  - Create a booking with:
    - Task description
    - Scheduled date and time
    - Location (typed or via browser geolocation)
  - See an **estimated travel time (ETA)** from worker to their location.
  - Later you can extend the UI to add review submission per booking.
- **Workers**
  - Register their profile with skills, hourly rate, and location.
  - Ranked by **average rating** and review count.
- **Admin**
  - View all workers and users.
  - Approve or fire (deactivate) workers.
- **Backend**
  - Stores users, workers, bookings, and reviews in MongoDB.
  - Computes worker availability for a time window.
  - Computes ETA based on distance between worker and job location.

## Getting started

### 1. Prerequisites

- Node.js (LTS recommended)
- MongoDB instance (local or cloud, e.g. MongoDB Atlas)

### 2. Backend setup (`server`)

```bash
cd server
npm install
```

Create a `.env` file in `server`:

```bash
MONGO_URI=mongodb://localhost:27017/worker_booking
PORT=5050
```

Then run the API server:

```bash
npm run dev
```

### 3. Frontend setup (`client`)

```bash
cd ../client
npm install
npm run dev
```

By default Vite runs at `http://localhost:5173` and proxies `/api` calls to the backend at `http://localhost:5050`.

## Notes and next steps

- **Authentication** is simplified: the current demo accepts `userId` as plain text; you can replace this with proper auth (JWT, sessions, etc.).
- The booking page includes:
  - A **“Use my current location”** button using the browser geolocation API.
  - A **map placeholder** where you can embed Google Maps, Mapbox, or Leaflet.
- For production, you should:
  - Add validation and security (rate limiting, auth, input sanitization).
  - Move configuration like API keys to environment variables.
  - Implement full review UI for users to rate workers after completed jobs.

