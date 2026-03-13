# Buena Case Study

A lightweight property-management case study app with a Next.js frontend and a NestJS API backed by Postgres.

## Quick start (Docker)
1. Create a repo-root `.env` with:
```
SUPABASE_JWT_SECRET=change-me
GEMINI_API_KEY=
DATABASE_URL=
```

2. Build and start:
```
docker compose up --build
```

Frontend: `http://localhost:3001`  
Backend: `http://localhost:3000`

## Documentation
- Docker: `docs/docker/README.md`
- Tech docs: `docs/tech-docs/README.md`
