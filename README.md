# Buena Case Study

Buena Case Study is a full-stack property operations application designed for structured real-estate data management.

It combines manual workflows with AI-assisted extraction so teams can upload German property PDFs, create structured records, and inspect extracted deals in depth.

## What you can do

- Create and manage properties, buildings, and units.
- Upload and extract structured deal data from PDF documents.
- Review AI-assisted properties in a sortable, expandable `/properties` deal view.
- Inspect extraction warnings and co-ownership consistency signals directly in the UI.

## Tech stack

- Frontend: Next.js 16, React 19, TanStack Query, Tailwind CSS
- Backend: NestJS 11, Prisma 7, PostgreSQL
- AI extraction: Google Gemini (`@google/generative-ai`)
- Runtime: Node.js 20+
- Local orchestration: Docker Compose

## Repository structure

```text
.
├── frontend/                # Next.js app (port 3001)
├── backend/                 # NestJS API + Prisma (port 3000)
├── docs/
│   ├── tech-docs/           # Architecture and cross-cutting design
│   ├── backend/             # Backend implementation and API behavior
│   └── docker/              # Docker workflows and local ops runbook
└── docker-compose.yml       # Full-stack local orchestration
```

## Quick start (Docker)

### 1) Create a root `.env`

```bash
SUPABASE_JWT_SECRET=change-me
GEMINI_API_KEY=
DATABASE_URL=
```

Notes:

- If `DATABASE_URL` is empty, Docker Compose defaults to the bundled Postgres service.
- Set `GEMINI_API_KEY` to enable `/documents/extract`.

### 2) Build and run

```bash
docker compose up --build
```

### 3) Open the apps

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000`

## Local development (without Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default, the frontend proxies `/api/*` requests to `http://localhost:3000` in development.

## Developer command reference

### Backend

```bash
cd backend
npm run build
npm run lint
npm test
npm run test:e2e
```

### Frontend

```bash
cd frontend
npm run build
npm run lint
```

## Product behavior highlights

### Extracted-deal visualization

The `/properties` page is optimized for extracted deals:

- Default filter: `source=AI_ASSISTED`
- Server-backed sorting via `sortBy` (`createdAt`, `updatedAt`, `name`) and `sortOrder` (`asc`, `desc`)
- Expandable rows with deep details (buildings, units, warnings, co-ownership diagnostics)

### Extraction quality guard

`POST /documents/extract` now rejects non-meaningful PDFs.

If no meaningful property, building, or unit signal is detected, the backend returns:

- `400 Bad Request`
- Message: `No extractable property deal information found in the submitted PDF`

This prevents creating empty fallback properties.

### Duplicate imports

`propertyNumber` is unique. If an extraction or create flow attempts to create a duplicate, Prisma maps this to:

- `409 Conflict`

## Documentation map

- Architecture guide: [`docs/tech-docs/README.md`](docs/tech-docs/README.md)
- Backend guide: [`docs/backend/README.md`](docs/backend/README.md)
- Docker runbook: [`docs/docker/README.md`](docs/docker/README.md)
- Backend folder quick guide: [`backend/README.md`](backend/README.md)
