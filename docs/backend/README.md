# Backend Development Guide

This document is a hands-on guide for developers onboarding to the NestJS backend. It covers setup, architecture, key modules, database workflow, and common tasks.

## Overview
The backend is a NestJS API backed by PostgreSQL (via Prisma) with optional AI-powered PDF extraction using Google Gemini. Authentication is handled by validating Supabase JWTs.

## Tech stack
- **Runtime:** Node.js (Docker uses `node:20-slim`)
- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma with `@prisma/adapter-pg` + `pg` pool
- **Auth:** Supabase JWT validation
- **AI:** Google Generative AI (Gemini)

## Prerequisites
- Node.js 20+ (LTS recommended)
- PostgreSQL (local or Supabase)
- API keys for:
  - Supabase JWT secret
  - Gemini API (optional)

## Quick start (local development)
1. **Install dependencies**
```
cd backend
npm install
```

2. **Create `.env`**
```
cp .env.example .env
```

3. **Fill in required env vars**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
GEMINI_API_KEY=your-gemini-api-key   # optional
GEMINI_MODEL=gemini-2.0-flash        # optional
```

4. **Generate Prisma client**
```
npx prisma generate
```

5. **Run migrations**
```
npx prisma migrate deploy
```

6. **Start the API**
```
npm run start:dev
```

API runs at `http://localhost:3000` by default.

## Running with Docker
Use the Docker guide: `../docker/README.md`.

## Project structure
```
backend/
├── src/
│   ├── main.ts                 # Nest bootstrap
│   ├── app.module.ts           # Root module
│   ├── auth/                   # JWT guard + auth helpers
│   ├── database/               # Prisma service (global)
│   ├── properties/             # Core property domain
│   ├── units/                  # Units CRUD + validation
│   ├── documents/              # File upload + extraction
│   ├── ai-extraction/          # Gemini integration
│   ├── buildings/              # Stub module
│   ├── users/                  # Stub module
│   └── common/filters/          # Prisma exception filter
├── prisma/
│   ├── schema.prisma            # Data models
│   └── migrations/              # DB migrations
├── test/                        # E2E tests
└── prisma.config.ts             # Prisma config (DATABASE_URL required)
```

## Application bootstrap & global behavior
**Entry:** `src/main.ts`
- CORS enabled
- Global `ValidationPipe` with `whitelist: true` and `transform: true`
- Global `PrismaExceptionFilter` for database errors
- Port from `PORT` env var (default `3000`)

**Root module:** `src/app.module.ts`
- Registers modules: `Database`, `Properties`, `Documents`, `AiExtraction`, `Users`, `Buildings`, `Units`, `Auth`
- Applies `SupabaseAuthGuard` globally via `APP_GUARD`

## Authentication
**Guard:** `src/auth/supabase-auth.guard.ts`
- Expects `Authorization: Bearer <token>`
- Verifies JWT using `SUPABASE_JWT_SECRET`
- Attaches decoded payload to `request['user']`

**Skip auth:** `src/auth/skip-auth.decorator.ts`
- Use `@SkipAuth()` on controller methods to bypass JWT validation

## Database & Prisma
**Config:** `prisma.config.ts`
- Requires `DATABASE_URL` at runtime for Prisma commands
- Prisma schema lives in `prisma/schema.prisma`

**Runtime DB access:** `src/database/prisma.service.ts`
- Uses `@prisma/adapter-pg` with a `pg` pool
- Logs successful DB connection at startup

### Prisma commands
```
npx prisma generate
npx prisma migrate deploy
npx prisma migrate dev --name <name>
```

## Key data models (Prisma)
Important models in `prisma/schema.prisma`:
- `Organization`, `User`, `UserOrganization`
- `Property`, `Building`, `Unit`
- `SourceDocument`, `AiExtractionJob`, `PropertyEvent`

Enums include `UserRole`, `PropertyStatus`, `UnitType`, `DocumentType`, `AiJobStatus`, and `ManagementType`.

## API surface (controllers)
### Properties (`/properties`)
- `POST /properties` create draft
- `GET /properties` list (supports `search`, `status`)
- `GET /properties/:id` fetch by id
- `PATCH /properties/:id` update
- `POST /properties/:id/finalize` finalize draft
- `POST /properties/:id/buildings/bulk` bulk create buildings
- `POST /properties/:id/units/bulk` bulk create units

### Units (`/units`)
- `GET /units/property/:propertyId` list by property
- `GET /units/:id` fetch by id
- `POST /units/property/:propertyId/bulk` bulk create units
- `PATCH /units/property/:propertyId/bulk` bulk update units
- `PATCH /units/:id` update unit
- `DELETE /units/:id` soft delete unit

### Documents (`/documents`)
- `POST /documents` upload files (multipart `files`)
- `POST /documents/extract` extract from first file (multipart `files`)

### AI Extraction (`/ai-extraction`)
- Controller exists but has no routes. Used via `DocumentsService`.

### Buildings / Users
- `PATCH /buildings/:id` update building fields
- Users controller currently has no routes.

## Services & business rules
**Properties**
- Drafts created with status `DRAFT` and auto-generated `propertyNumber` if missing.
- `finalize()` enforces:
  - Only `DRAFT` properties can be finalized.
  - For `WEG`, a manager is required and units must exist.
  - Total `coOwnershipShare` must be ~1000‰ (±50 tolerance).

**Units**
- Validates building ownership during bulk operations.
- Soft deletes by setting `deletedAt`.

**Documents**
- Uploads are currently mock storage paths.
- Extraction delegates to AI service.

**AI Extraction**
- If `GEMINI_API_KEY` is missing, extraction fails with a clear error.
- PDF text is truncated to ~32k chars and filtered for relevant paragraphs.

## DTOs & validation
DTOs use `class-validator` and `class-transformer`.
Examples:
- `CreatePropertyDto` enforces types and optional fields.
- `ListPropertiesDto` transforms `onlyWithUnits` to boolean.
- `UpdateUnitDto` extends `PartialType(CreateUnitDto)`.

Validation is enforced by the global `ValidationPipe`.

## Error handling
Prisma errors are converted to HTTP responses by `PrismaExceptionFilter`:
- `P2002` → 409 (unique constraint)
- `P2025` → 404 (record not found)
- `P2003` → 400 (foreign key)
- Initialization errors → 503
- Validation errors → 400

The filter is registered globally in `main.ts`.

## File uploads
The documents API uses `FilesInterceptor('files')` from `@nestjs/platform-express`.
Send multipart form-data with a `files` field:
```
curl -F "files=@/path/to/file.pdf" http://localhost:3000/documents
```

### AI extraction + persistence
`POST /documents/extract` creates a new property from the PDF and persists results.
Send `organizationId` (required) and an optional `documentType`. If the organization
does not exist yet, it is created automatically with the same ID and slug.

Example:
```
curl -F "files=@/path/to/file.pdf" \
  -F "organizationId=org_default" \
  -F "documentType=DECLARATION_OF_DIVISION" \
  http://localhost:3000/documents/extract
```

## Testing
Unit tests live under `src/**/*.spec.ts` and run with:
```
npm test
```

E2E tests are in `test/` and run with:
```
npm run test:e2e
```

Note: the sample e2e test expects `GET /` to return `Hello World!`, but there is no `AppController` in this codebase. Update or replace the sample test as needed.

## Linting & formatting
- `npm run lint` runs ESLint.
- `eslint.config.mjs` is mostly commented out; enable or extend it if you want strict lint rules.
- Prettier config lives in `.prettierrc` (single quotes, trailing commas).

## Adding a new endpoint (workflow)
1. **Define DTOs** using `class-validator` in the module’s `dto/` folder.
2. **Add service logic** in the module service.
3. **Add controller route** and wire to the service.
4. **Add Prisma query** in a `*.prisma.service.ts` or direct in the service.
5. **Add tests** (unit or e2e) for behavior.

## Troubleshooting
- **`DATABASE_URL` missing:** Prisma commands fail because `prisma.config.ts` throws if it’s undefined.
- **DB connection errors:** `PrismaService` logs connection failures on startup.
- **401 Unauthorized:** ensure `SUPABASE_JWT_SECRET` matches your Supabase project.
- **AI extraction fails:** set `GEMINI_API_KEY` to enable Gemini.
