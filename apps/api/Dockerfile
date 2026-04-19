# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/
COPY shared/domain-lib/package.json shared/domain-lib/
COPY shared/infrastructure-lib/package.json shared/infrastructure-lib/
COPY learning-resource/domain/package.json learning-resource/domain/
COPY learning-resource/application/package.json learning-resource/application/
COPY learning-resource/infrastructure/package.json learning-resource/infrastructure/
COPY user/domain/package.json user/domain/
COPY user/application/package.json user/application/

RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn workspace @eap/api build

# ── Stage 2: production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/
COPY shared/domain-lib/package.json shared/domain-lib/
COPY shared/infrastructure-lib/package.json shared/infrastructure-lib/
COPY learning-resource/domain/package.json learning-resource/domain/
COPY learning-resource/application/package.json learning-resource/application/
COPY learning-resource/infrastructure/package.json learning-resource/infrastructure/
COPY user/domain/package.json user/domain/
COPY user/application/package.json user/application/

RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/apps/api/src/main.js"]
