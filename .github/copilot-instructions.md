# Copilot Instructions

These instructions capture repository-specific behavior so AI-assisted edits stay accurate, safe, and consistent.

## Build, test, and lint commands

### Frontend (`frontend/`)

- Install dependencies: `cd frontend && npm install`
- Start dev server (port `3001`): `cd frontend && npm run dev`
- Build production app: `cd frontend && npm run build`
- Lint: `cd frontend && npm run lint`
- Start production build: `cd frontend && npm run start`
- Tests: no frontend test script is currently defined

### Backend (`backend/`)

- Install dependencies: `cd backend && npm install`
- Start dev server (watch mode): `cd backend && npm run start:dev`
- Build: `cd backend && npm run build`
- Lint: `cd backend && npm run lint`
- Unit/integration tests: `cd backend && npm test`
- E2E tests: `cd backend && npm run test:e2e`
- Run a single backend test file:
  - `cd backend && npm test -- --runTestsByPath src/properties/properties.prisma.service.spec.ts`
  - `cd backend && npm test -- --runTestsByPath src/documents/documents.service.spec.ts`

### Full stack (`docker-compose.yml` at repo root)

- Build and start all services: `docker compose up --build`
- Stop services: `docker compose down`
- Stop and wipe DB volume: `docker compose down -v`

## Architecture summary

- Monorepo with Next.js frontend + NestJS backend + PostgreSQL.
- Frontend routing model:
  - `next.config.ts` rewrites `/api/:path*` to `API_BASE_URL`.
  - Axios client (`src/lib/api.ts`) uses `NEXT_PUBLIC_API_BASE_URL` fallback to `/api`.
- Backend global behavior:
  - Global `ValidationPipe` (`whitelist: true`, `transform: true`)
  - Global `PrismaExceptionFilter`
  - Global auth guard (`SupabaseAuthGuard`) with `@SkipAuth()` for public routes
- Prisma schema is the enum/model source of truth (`backend/prisma/schema.prisma`).

## Repository conventions

### API and DTO patterns

- Bulk endpoints expect `{ items: [...] }` payloads.
- Query DTOs are strict. For `/properties`:
  - `onlyWithUnits` only accepts boolean values (`true`/`false`)
  - invalid enums/booleans should surface as validation errors
- Keep frontend query types in sync with backend DTO enums (`source`, `sortBy`, `sortOrder`, etc.).

### Properties and units behavior

- Soft deletion is used (`deletedAt`), especially for `Unit` and `Property`.
- Property list/count flows should exclude soft-deleted units where relevant.
- Extracted deals are represented by `Property.source = AI_ASSISTED`.

### Extraction behavior

- `POST /documents/extract` must reject non-meaningful PDFs instead of creating empty fallback properties.
- Meaningful extraction requires signal in at least one of: property, buildings, or units.
- Duplicate unique values (commonly `propertyNumber`) map to `409 Conflict` via Prisma `P2002`.
- Extraction warnings are persisted in job/property metadata and surfaced in frontend deal detail views.

### Frontend data layer

- Use TanStack Query hooks in `frontend/src/hooks/` for fetching/mutations.
- Invalidate query keys after mutations rather than mutating cached lists ad hoc.
- `/properties` is the extracted-deals-first visualization surface (sortable table + expandable details).

## Implementation guidance for AI edits

- Prefer surgical, behavior-safe changes over broad refactors.
- Reuse existing DTOs, service patterns, and enum types before introducing new abstractions.
- When changing extraction or property list behavior, update both backend contracts and frontend consumers.
- Preserve explicit error semantics (`400` for invalid extraction input, `409` for uniqueness conflicts).
