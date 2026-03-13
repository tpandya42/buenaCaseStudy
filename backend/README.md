# Backend

## Docker guide (full stack)
This guide runs the full web app with Docker Compose (frontend + backend + Postgres).

### Prerequisites
Install Docker Desktop and make sure the Docker daemon is running.

### Quick start
Step 1: From the repo root, create a `.env` file:

```
SUPABASE_JWT_SECRET=change-me
GEMINI_API_KEY=
DATABASE_URL=
```

If `DATABASE_URL` is empty, Compose will use the built-in Postgres container.

Step 2: Build and start everything:

```
docker compose up --build
```

Step 3: Open the app:

Frontend: `http://localhost:3001`  
Backend: `http://localhost:3000`

### Common commands
Start in the background:

```
docker compose up -d
```

Stop all services:

```
docker compose down
```

Stop and wipe the database volume:

```
docker compose down -v
```

Follow backend logs:

```
docker compose logs -f backend
```

Follow frontend logs:

```
docker compose logs -f frontend
```

Rebuild after code changes:

```
docker compose build backend
docker compose build frontend
```

### Database access
Connect to Postgres:

```
docker compose exec db psql -U postgres
```

Data is stored in the `db-data` volume and survives restarts unless you run `docker compose down -v`.

### Migrations
The backend container runs `prisma migrate deploy` on startup.  
To create new migrations, do it locally and rebuild:

```
cd backend
npx prisma migrate dev --name <name>
docker compose build backend
```

### Backend-only image
Build and run the API without Compose:

```
docker build -t buena-backend .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres \
  -e SUPABASE_JWT_SECRET=change-me \
  -e GEMINI_API_KEY= \
  buena-backend
```
