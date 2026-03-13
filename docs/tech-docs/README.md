# Technical Documentation

## Architecture
- Frontend: Next.js app on port `3001`
- Backend: NestJS API on port `3000`
- Database: Postgres (via Prisma)
- Auth: Supabase JWT validation
- AI: Gemini API for PDF extraction

## Repository layout
- `frontend/` Next.js app
- `backend/` NestJS API + Prisma schema
- `docker-compose.yml` local orchestration

## Environment variables
Backend expects:
- `DATABASE_URL` Postgres connection string
- `SUPABASE_JWT_SECRET` JWT verification secret
- `GEMINI_API_KEY` optional; enables AI extraction
- `PORT` optional; defaults to `3000`

Frontend:
- `API_BASE_URL` build arg used to route `/api/*`

## Local development (without Docker)
Backend:
```
cd backend
npm install
npm run start:dev
```

Frontend:
```
cd frontend
npm install
npm run dev
```

The frontend proxies `/api/*` to `http://localhost:3000` during development.

## Useful scripts
Backend:
- `npm run build` build API
- `npm run test` run tests
- `npm run lint` lint code

Frontend:
- `npm run build` build app
- `npm run lint` lint code
