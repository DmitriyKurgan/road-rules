# --- Base ---
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm run build

# --- Production ---
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/.pnpm/prisma*/node_modules/prisma ./node_modules/prisma

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/src/main.js"]
