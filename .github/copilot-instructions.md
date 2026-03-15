# Copilot Instructions

## Build, test, and lint commands

### Frontend (`frontend/`)
- Install deps: `cd frontend && npm install`
- Dev server (port `3001`): `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Lint: `cd frontend && npm run lint`
- Production start: `cd frontend && npm run start`
- Frontend tests: no test script is currently defined in `frontend/package.json`

### Backend (`backend/`)
- Install deps: `cd backend && npm install`
- Dev server (watch mode, port `3000` by default): `cd backend && npm run start:dev`
- Build: `cd backend && npm run build`
- Lint: `cd backend && npm run lint`
- Unit/integration tests (all): `cd backend && npm test`
- Run a single unit test file: `cd backend && npm test -- --runTestsByPath src/auth/supabase-auth.guard.spec.ts`
- E2E tests (all): `cd backend && npm run test:e2e`
- Run a single E2E file: `cd backend && npm run test:e2e -- --runTestsByPath test/app.e2e-spec.ts`

### Full stack (Docker, repo root)
- Start all services: `docker compose up --build`
- Stop services: `docker compose down`
- Stop + wipe DB volume: `docker compose down -v`

## High-level architecture

- This is a two-app monorepo: Next.js frontend (`frontend/`) + NestJS backend (`backend/`) with PostgreSQL via Prisma.
- `docker-compose.yml` orchestrates `frontend` (3001), `backend` (3000), and `db` (Postgres 16).
- Frontend API routing is dual-mode:
  - `next.config.ts` rewrites `/api/:path*` to `API_BASE_URL` (defaults to `http://localhost:3000`)
  - Axios client in `src/lib/api.ts` uses `NEXT_PUBLIC_API_BASE_URL` and falls back to `/api`
- Backend bootstrap (`src/main.ts`) applies global `ValidationPipe` (`whitelist: true`, `transform: true`) and global `PrismaExceptionFilter`.
- Backend module composition (`src/app.module.ts`) centralizes domain modules (`properties`, `units`, `documents`, `ai-extraction`, etc.) and registers auth guard globally.
- Data access is Prisma-backed (`prisma/schema.prisma`), with `PrismaService` using `@prisma/adapter-pg` + `pg` pool and exposed globally via `DatabaseModule`.
- AI extraction flow:
  - `POST /documents/extract` receives multipart `files`
  - `AiExtractionService` parses PDF text and calls Gemini
  - `DocumentsService` persists extracted property/buildings/units/document/job records in a single transaction

## Key conventions in this repository

- Auth is global by default (`APP_GUARD` with `SupabaseAuthGuard`). Public routes must be explicitly marked with `@SkipAuth()`.
- DTO validation is strict and global. Unknown request keys are stripped by `ValidationPipe`, so payload shape must match DTO fields exactly.
- Bulk endpoints use `items` arrays in DTOs (for example `BulkCreateBuildingsDto`, `BulkCreateUnitsDto`, `BulkUpdateUnitsDto`).
- Domain enums are mirrored across layers:
  - Backend source of truth: `backend/prisma/schema.prisma`
  - Frontend mirrors: `frontend/src/lib/types.ts` and form schemas in `frontend/src/lib/validators.ts`
- Frontend data fetching/mutations are centralized in hook files under `frontend/src/hooks/` using TanStack Query; mutations invalidate query keys instead of manually mutating UI state.
- Soft deletion is used for key records (`deletedAt` on `Unit` and `Property`), and read paths typically filter to `deletedAt: null`.
- Default organization bootstrap convention: frontend create/extract flows use `org_default`; backend extraction upserts the organization if it does not exist.
- Prisma CLI requires `DATABASE_URL` at runtime (`backend/prisma.config.ts` throws when missing).
