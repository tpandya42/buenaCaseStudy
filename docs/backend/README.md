# Backend Development Guide

This guide is the source of truth for backend setup, API behavior, extraction logic, and operational conventions.

## Stack and runtime

- Framework: NestJS 11
- ORM: Prisma 7 with PostgreSQL
- Auth: Supabase JWT verification (`JwtService`)
- Extraction: Google Gemini + PDF parsing (`pdf-parse`)
- Default API port: `3000`

## Prerequisites

- Node.js 20+
- PostgreSQL instance (local, Docker, or managed)
- Optional Gemini API key for extraction features

## Local setup

```bash
cd backend
npm install
cp .env.example .env
```

Set at least the required environment variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
GEMINI_API_KEY=your-gemini-api-key   # required for /documents/extract
GEMINI_MODEL=gemini-2.0-flash         # optional
```

Then initialize Prisma artifacts and run the API:

```bash
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

## Important scripts

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

Single-test execution examples:

```bash
npm test -- --runTestsByPath src/properties/properties.prisma.service.spec.ts
npm test -- --runTestsByPath src/documents/documents.service.spec.ts
npm run test:e2e -- --runTestsByPath test/app.e2e-spec.ts
```

## Module map

- `auth/`: global JWT guard + public-route decorator
- `database/`: Prisma service and DB module
- `properties/`: property lifecycle, listing, detail, finalize, bulk creation bridges
- `units/`: unit CRUD, bulk create/update with ownership validation, soft delete
- `documents/`: upload + extract entrypoints and persistence orchestration
- `ai-extraction/`: PDF parsing + Gemini prompt/extraction
- `buildings/`: building update endpoint

## Global framework behavior

Configured in `src/main.ts`:

- CORS enabled
- Global `ValidationPipe` (`whitelist: true`, `transform: true`)
- Global `PrismaExceptionFilter`

Configured in `src/app.module.ts`:

- `SupabaseAuthGuard` is registered as global `APP_GUARD`

Auth model:

- Routes are protected by default.
- Controllers/actions annotated with `@SkipAuth()` bypass JWT checks.
- Most currently exposed domain routes (`properties`, `units`, `documents`, `buildings`) are intentionally public in this case-study project.

## API behavior reference

### Properties (`/properties`)

- `POST /properties`
- `GET /properties`
- `GET /properties/:id`
- `PATCH /properties/:id`
- `POST /properties/:id/finalize`
- `POST /properties/:id/buildings/bulk`
- `POST /properties/:id/units/bulk`

`GET /properties` query options:

- `search` (trimmed, case-insensitive; matches `name` and `propertyNumber`)
- `status` (`DRAFT`, `IN_REVIEW`, `ACTIVE`, `ARCHIVED`)
- `source` (`MANUAL`, `AI_ASSISTED`, `IMPORTED`)
- `onlyWithUnits` (`true` or `false`; strict boolean parsing)
- `sortBy` (`createdAt`, `updatedAt`, `name`)
- `sortOrder` (`asc`, `desc`)

Notes:

- Invalid query enum/boolean values are rejected by DTO validation.
- Unit counts exclude soft-deleted units.

`GET /properties/:id` includes enriched detail payloads:

- ordered buildings and unit counts
- filtered/ordered units (`deletedAt = null`)
- related documents (latest first)
- latest extraction job summary (`aiExtractionJobs`, `take: 1`)

### Units (`/units`)

- `GET /units/property/:propertyId`
- `GET /units/:id`
- `POST /units/property/:propertyId/bulk`
- `PATCH /units/property/:propertyId/bulk`
- `PATCH /units/:id`
- `DELETE /units/:id` (soft delete)

Bulk behavior:

- `bulkCreate` validates all `buildingId`s belong to the target property.
- `bulkUpdate` validates all unit IDs belong to the target property and are not deleted.

### Buildings (`/buildings`)

- `PATCH /buildings/:id`

Purpose: update building fields.

### Documents (`/documents`)

- `POST /documents` (multipart upload)
- `POST /documents/extract` (multipart extraction)

`/documents/extract` request form-data:

- `files`: PDF file list (first file is used)
- `organizationId`: required
- `documentType`: optional (`DECLARATION_OF_DIVISION` or `OTHER`)

## Extraction pipeline details

`DocumentsService.extract()` behavior:

1. Parse and extract structured JSON from PDF via `AiExtractionService`.
2. Reject extraction if there is no meaningful signal in property/buildings/units.
3. Upsert organization.
4. Create property + source document.
5. Normalize/create buildings.
6. Normalize/upsert units.
7. Persist extraction job and warning payloads.
8. Return extraction summary (`propertyId`, `documentId`, created/updated counts, warnings).

### Empty-data guard

If no meaningful deal information is found, the API returns:

- `400 Bad Request`
- Message: `No extractable property deal information found in the submitted PDF`

No property or related records are persisted in this case.

### Duplicate handling

Because `propertyNumber` is unique, duplicate creates/imports can trigger Prisma `P2002`, returned as:

- `409 Conflict`
- Error shape from global filter

## Property lifecycle rules

### Draft creation and update

- WEG properties require a manager (`managerId`) on create/update.

### Finalization (`POST /properties/:id/finalize`)

Only `DRAFT` properties can be finalized.

For `WEG` properties, additional checks apply:

- manager is required
- at least one unit is required
- total unit `coOwnershipShare` must be approximately `1000‰` (tolerance ±50)

## Error handling model

Global Prisma filter mappings:

- `P2002` -> `409 Conflict` (unique constraint)
- `P2025` -> `404 Not Found` (record missing)
- `P2003` -> `400 Bad Request` (foreign key)
- `PrismaClientInitializationError` -> `503 Service Unavailable`
- `PrismaClientValidationError` -> `400 Bad Request`

Validation errors from DTO/pipe are also returned as `400`.

## Data model highlights

Key Prisma models:

- `Property`, `Building`, `Unit`
- `SourceDocument`, `AiExtractionJob`
- `Organization`, `User`, `UserOrganization`

Important schema rules:

- `Property.propertyNumber` is unique.
- Soft-delete fields exist on `Property` and `Unit`.
- `Property.documents` stores related uploaded documents.

## Testing and quality notes

- Unit and integration tests: `src/**/*.spec.ts`
- E2E tests: `test/`
- The default sample e2e test may not match current route wiring (`GET /`), so teams usually adapt/replace it during implementation.

## Troubleshooting

- `DATABASE_URL is required`: Prisma config enforces it for CLI/runtime workflows.
- `AI extraction is unavailable`: ensure `GEMINI_API_KEY` is configured.
- `401 Invalid or expired token`: verify `SUPABASE_JWT_SECRET` and bearer token.
- `409 Unique constraint violation`: duplicate unique values (commonly `propertyNumber`).
