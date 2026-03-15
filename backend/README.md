# Backend Workspace Guide

This folder contains the NestJS API, Prisma schema, and backend tests.

## Quick start

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

## Common commands

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Documentation map

- Full backend guide: [`../docs/backend/README.md`](../docs/backend/README.md)
- Docker operations: [`../docs/docker/README.md`](../docs/docker/README.md)
- Architecture overview: [`../docs/tech-docs/README.md`](../docs/tech-docs/README.md)
- Repository entrypoint: [`../README.md`](../README.md)
