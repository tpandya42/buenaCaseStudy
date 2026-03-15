# Docker Operations Guide

This guide covers how to run and operate the full stack locally using Docker Compose.

## Services and ports

`docker-compose.yml` starts three services:

- `db` (PostgreSQL 16): `localhost:5432`
- `backend` (NestJS API): `localhost:3000`
- `frontend` (Next.js app): `localhost:3001`

## Prerequisites

- Docker Desktop installed and running
- Compose v2 (`docker compose ...`)

## Environment setup

Create a root `.env` file:

```bash
SUPABASE_JWT_SECRET=change-me
GEMINI_API_KEY=
DATABASE_URL=
```

Behavior notes:

- If `DATABASE_URL` is empty, backend defaults to `postgresql://postgres:postgres@db:5432/postgres`.
- Set `GEMINI_API_KEY` to enable extraction.

## Start the stack

Foreground mode:

```bash
docker compose up --build
```

Detached mode:

```bash
docker compose up -d --build
```

## Stop and cleanup

Stop services (retain DB volume):

```bash
docker compose down
```

Stop services and wipe database data:

```bash
docker compose down -v
```

## Day-to-day operations

Tail all logs:

```bash
docker compose logs -f
```

Tail a single service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

Check status:

```bash
docker compose ps
```

Restart one service:

```bash
docker compose restart backend
```

Rebuild a single service image:

```bash
docker compose build backend
docker compose build frontend
```

## Database access

Open a psql shell:

```bash
docker compose exec db psql -U postgres -d postgres
```

The `db-data` volume persists data across restarts unless removed with `down -v`.

## Migration behavior

On container startup, backend runs:

```bash
prisma migrate deploy
```

This is executed by `backend/docker-entrypoint.sh` before starting the Node process.

### Creating new migrations during development

Create migrations from the local backend workspace (recommended):

```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

After creating a migration, rebuild/restart backend container so the new migration file is included in the image.

## Frontend-to-backend API routing in Docker

Frontend is built with:

- `API_BASE_URL=http://backend:3000`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`

Meaning:

- Server-side and rewritten `/api/*` calls resolve via Docker network host `backend`.
- Browser-side direct calls use `localhost:3000`.

## Troubleshooting

- Backend exits with `DATABASE_URL is required`: confirm env value is present or left empty to use default fallback.
- Frontend cannot reach API: verify backend is healthy and check `docker compose logs -f backend`.
- Extraction fails immediately: ensure `GEMINI_API_KEY` is configured.
- Port conflicts: stop local processes occupying `3000`, `3001`, or `5432`.
