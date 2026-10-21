FROM node:24-alpine

WORKDIR /app
RUN apk add --no-cache openssl \
  && corepack enable \
  && corepack prepare pnpm@11.25.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
RUN DATABASE_URL=postgresql://generate:generate@localhost:5432/generate \
    pnpm --filter @bike-sharing/api db:generate \
  && pnpm --filter @bike-sharing/api build

ENV NODE_ENV=production
EXPOSE 3001
CMD ["pnpm", "--filter", "@bike-sharing/api", "start:prod"]
