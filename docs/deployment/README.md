# Deployment Runbook (Fly.io Backend + Fly Postgres + Vercel Frontend)

This runbook documents the production deployment flow for this repository's target architecture:

- Backend API on **Fly.io**
- PostgreSQL on **Fly Postgres**
- Frontend on **Vercel**

Use this as the operational checklist for first-time setup and repeat deployments.

## 1) Prerequisites

### Accounts and access

- Fly.io account with permission to create apps and Postgres clusters
- Vercel account with access to the target project/team
- Runtime secrets:
  - `SUPABASE_JWT_SECRET`
  - `GEMINI_API_KEY`
  - Optional: `GEMINI_MODEL` (defaults to `gemini-2.0-flash`)

### Local tooling

```bash
brew install flyctl
npm install -g vercel
fly auth login
vercel login
```

## 2) Deploy backend on Fly.io

From the repository root:

```bash
export FLY_BACKEND_APP="buena-backend-prod"
export FLY_REGION="iad"
cd backend
```

Initialize the Fly app (one-time):

```bash
fly launch --name "$FLY_BACKEND_APP" --region "$FLY_REGION" --no-deploy
```

Then confirm `backend/fly.toml` has the correct app name and health check path (`/healthz`):

```bash
grep -E '^(app|primary_region)' fly.toml
grep -n 'healthz' fly.toml
```

> Reference: [`backend/fly.toml`](../../backend/fly.toml)

## 3) Provision Fly Postgres and wire `DATABASE_URL`

Create a managed Fly Postgres cluster (one-time):

```bash
export FLY_POSTGRES_APP="buena-postgres-prod"
fly postgres create --name "$FLY_POSTGRES_APP" --region "$FLY_REGION" --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10
```

Attach Postgres to backend app (recommended). This sets `DATABASE_URL` on the backend app:

```bash
fly postgres attach --app "$FLY_BACKEND_APP" "$FLY_POSTGRES_APP"
```

Verify secrets are present:

```bash
fly secrets list -a "$FLY_BACKEND_APP"
```

If attach is not available in your org/workflow, set `DATABASE_URL` manually:

```bash
fly secrets set -a "$FLY_BACKEND_APP" DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require"
```

## 4) Set required backend secrets/env and deploy

Required backend runtime variables:

- `DATABASE_URL` (required; set by `fly postgres attach` or manually)
- `SUPABASE_JWT_SECRET` (required for JWT validation)
- `GEMINI_API_KEY` (required for `/documents/extract`)
- `GEMINI_MODEL` (optional; default is `gemini-2.0-flash`)

Set secrets on Fly:

```bash
fly secrets set -a "$FLY_BACKEND_APP" \
  SUPABASE_JWT_SECRET="<your-supabase-jwt-secret>" \
  GEMINI_API_KEY="<your-gemini-api-key>" \
  GEMINI_MODEL="gemini-2.0-flash"
```

Deploy backend:

```bash
fly deploy -a "$FLY_BACKEND_APP"
fly status -a "$FLY_BACKEND_APP"
```

Notes:

- Container startup runs `prisma migrate deploy` automatically via [`backend/docker-entrypoint.sh`](../../backend/docker-entrypoint.sh).
- Backend health endpoint is `/healthz`.

## 5) Deploy frontend on Vercel (from `frontend/`)

Set backend URL for environment values:

```bash
export BACKEND_URL="https://${FLY_BACKEND_APP}.fly.dev"
cd ../frontend
```

Link the local folder to a Vercel project (one-time):

```bash
vercel link
```

Add required Vercel environment variables:

```bash
vercel env add API_BASE_URL production
vercel env add API_BASE_URL preview
```

When prompted, use this value:

```text
https://<your-fly-backend-app>.fly.dev
```

Optional direct browser API override:

```bash
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel env add NEXT_PUBLIC_API_BASE_URL preview
```

Then deploy:

```bash
vercel --prod
```

Important:

- `API_BASE_URL` is required for production build (`frontend/next.config.ts` throws if missing).
- `NEXT_PUBLIC_API_BASE_URL` is optional; if omitted, browser requests use `/api` and Next.js rewrites.

## 6) Post-deploy smoke checks

```bash
export BACKEND_URL="https://${FLY_BACKEND_APP}.fly.dev"
export FRONTEND_URL="https://<your-vercel-domain>"
```

### Backend checks

```bash
curl -fsS "$BACKEND_URL/healthz"
curl -fsS "$BACKEND_URL/properties?source=AI_ASSISTED&sortBy=updatedAt&sortOrder=desc"
```

### Frontend checks

```bash
curl -I "$FRONTEND_URL/"
curl -I "$FRONTEND_URL/properties"
curl -I "$FRONTEND_URL/extract"
curl -fsS "$FRONTEND_URL/api/healthz"
```

Expected signals:

- `/healthz` returns JSON with `status: "ok"`.
- Frontend routes return HTTP `200`.
- `$FRONTEND_URL/api/healthz` successfully proxies to backend health endpoint.

## 7) Rollback and troubleshooting

### Backend rollback (Fly.io)

```bash
fly releases list -a "$FLY_BACKEND_APP"
fly releases rollback <release-version> -a "$FLY_BACKEND_APP"
```

Re-check health after rollback:

```bash
curl -fsS "$BACKEND_URL/healthz"
```

### Frontend rollback (Vercel)

```bash
vercel ls
vercel rollback <deployment-url-or-id> --yes
```

### Common failures

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Missing API_BASE_URL for production build...` during `vercel --prod` | `API_BASE_URL` not set in Vercel production env | Set `API_BASE_URL` to `https://<fly-app>.fly.dev` and redeploy |
| Fly machine crash loops with `DATABASE_URL is required.` | Postgres not attached or `DATABASE_URL` secret missing | Run `fly postgres attach --app "$FLY_BACKEND_APP" "$FLY_POSTGRES_APP"` or set `DATABASE_URL` manually |
| Fly deploy passes but health checks fail on `/healthz` | App boot failed (often migration/DB/secrets issue) | Inspect `fly logs -a "$FLY_BACKEND_APP"` and correct secrets/DB connectivity |
| `/documents/extract` returns AI extraction unavailable | `GEMINI_API_KEY` missing/invalid | Update `GEMINI_API_KEY` via `fly secrets set` and redeploy |
| Authenticated endpoints return `401 Invalid or expired token` | `SUPABASE_JWT_SECRET` mismatch | Set correct `SUPABASE_JWT_SECRET` in Fly secrets |
| Frontend `/api/*` requests fail while backend is healthy | Incorrect `API_BASE_URL` or missing redeploy after env change | Fix env var in Vercel and redeploy frontend |
