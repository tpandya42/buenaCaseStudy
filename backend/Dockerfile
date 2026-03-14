# syntax=docker/dockerfile:1
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev
RUN npm install prisma@7.3.0 --no-save

FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY package.json ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
