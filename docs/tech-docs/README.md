# Technical Architecture Guide

This document explains how the Buena Case Study system is structured across frontend, backend, database, and extraction pipeline boundaries.

Use it as the high-level map before diving into module-level implementation docs.

## System overview

The project is a two-service web platform with a PostgreSQL database:

- `frontend/`: Next.js application on port `3001`
- `backend/`: NestJS API on port `3000`
- `db`: PostgreSQL 16 (via Docker Compose)

```text
Browser UI
   |
   v
Next.js frontend (3001)
   |  /api/* (rewrite/proxy)
   v
NestJS backend (3000)
   |
   v
PostgreSQL (Prisma)
```

## Runtime architecture

### Frontend (Next.js)

- Uses TanStack Query hooks for data fetching and mutation orchestration.
- Uses Axios (`src/lib/api.ts`) with:
  - `NEXT_PUBLIC_API_BASE_URL` when explicitly set
  - fallback to `/api`, which is rewritten by Next.js to backend.
- Property UX includes:
  - `/extract` for AI-assisted ingestion
  - `/properties` extracted-deals table with server-side sorting and expandable deep details
  - `/properties/[id]` detail tabs for overview/buildings/units

### Backend (NestJS)

- Modules are composed in `src/app.module.ts`.
- `SupabaseAuthGuard` is registered globally via `APP_GUARD`.
- Public routes are explicitly marked with `@SkipAuth()`.
- `ValidationPipe` is global with `whitelist: true` and `transform: true`.
- `PrismaExceptionFilter` is global for database error normalization.

### Data layer (Prisma)

Primary entities:

- `Organization`
- `Property`
- `Building`
- `Unit`
- `SourceDocument`
- `AiExtractionJob`

Important characteristics:

- `Property.propertyNumber` is unique.
- `Unit` and `Property` support soft deletion (`deletedAt`).
- AI extraction metadata is persisted on both `AiExtractionJob` and `Property.aiMeta`.

## Core functional flows

### 1) Manual property creation flow

1. Frontend submits `POST /properties`.
2. Backend validates payload with DTO + global pipe.
3. Property is created with `status=DRAFT`, `source=MANUAL` (default), and generated `propertyNumber` when absent.

### 2) AI extraction flow (`/documents/extract`)

1. Frontend uploads a PDF with multipart `files` + `organizationId`.
2. Backend parses PDF text and prompts Gemini for strict JSON output.
3. Backend validates extracted signal quality before persistence.
4. If meaningful data exists, backend persists in one transaction:
   - `Property` (`source=AI_ASSISTED`)
   - `SourceDocument`
   - normalized `Building` records
   - normalized/upserted `Unit` records
   - `AiExtractionJob`
5. Warnings are stored and surfaced in the frontend detail views.

Guardrail behavior:

- If extraction contains no meaningful property/building/unit signal, the request fails with `400 Bad Request` and no DB write occurs.

### 3) Extracted deals review flow (`/properties`)

1. Frontend requests `/properties` with `source=AI_ASSISTED` and sorting params.
2. Backend applies filtering/sorting and returns counts.
3. Expanding a row triggers `/properties/:id` for deep detail payload:
   - ordered buildings and units
   - related documents
   - latest extraction job summary
4. Frontend merges warning sources (`property.aiMeta` + extraction validation issues) and renders extraction diagnostics.

## API surface summary (high level)

- Properties: create, list, detail, update, finalize, bulk buildings, bulk units
- Units: property-scoped list/bulk create/bulk update, single update/delete
- Documents: upload and extract
- Buildings: update

Detailed endpoint contracts and behaviors are documented in `docs/backend/README.md`.

## Configuration model

### Backend environment

- `DATABASE_URL` (required for runtime and Prisma CLI)
- `SUPABASE_JWT_SECRET` (required when using protected routes)
- `GEMINI_API_KEY` (required for extraction)
- `GEMINI_MODEL` (optional, default `gemini-2.0-flash`)
- `PORT` (optional, defaults to `3000`)

### Frontend environment

- `API_BASE_URL` (required in production for Next.js rewrite; non-production falls back to `http://localhost:3000`)
- `NEXT_PUBLIC_API_BASE_URL` (direct browser API base override)

## Error model and consistency rules

- Prisma errors are translated globally:
  - `P2002` -> `409 Conflict`
  - `P2025` -> `404 Not Found`
  - `P2003` -> `400 Bad Request`
- Request DTOs are strict; invalid enum/boolean query values return `400`.
- Bulk endpoints consistently expect `{ items: [...] }` payload shapes.

## Documentation index

- Root guide: `README.md`
- Backend implementation details: `docs/backend/README.md`
- Docker operations: `docs/docker/README.md`
- Deployment runbook (Fly.io + Vercel): `docs/deployment/README.md`
- Backend folder quick guide: `backend/README.md`
