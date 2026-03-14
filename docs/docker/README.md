# Docker Guide

This guide runs the full stack (frontend + backend + Postgres) with Docker Compose.

## Prerequisites
- Docker Desktop installed and running

## Setup
Create a `.env` file in the repo root:

```
SUPABASE_JWT_SECRET=change-me
GEMINI_API_KEY=
DATABASE_URL=
```

If `DATABASE_URL` is empty, Compose uses the built-in Postgres container.
If you already have `backend/.env`, copy the values into the root `.env`.

## Start the stack
```
docker compose up --build
```

Open:
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

## Common commands
Start in background:
```
docker compose up -d
```

Stop services:
```
docker compose down
```

Stop and wipe the database volume:
```
docker compose down -v
```

Rebuild after code changes:
```
docker compose build backend
docker compose build frontend
```

Tail logs:
```
docker compose logs -f backend
docker compose logs -f frontend
```

## Database access
Connect to Postgres:
```
docker compose exec db psql -U postgres
```

Data is stored in the `db-data` volume and survives restarts unless you run `docker compose down -v`.

## Migrations
The backend container runs `prisma migrate deploy` on startup.

To create new migrations locally:
```
cd backend
npx prisma migrate dev --name <name>
docker compose build backend
```

## Custom backend URL for frontend
The frontend build uses `API_BASE_URL` (build arg) to route `/api/*` to the backend.
In `docker-compose.yml` this is set to `http://backend:3000`.

If you see proxy errors, the client can call the backend directly by setting
`NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` during the frontend build.
