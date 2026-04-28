# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

# Ensure root workspace binaries (tsc, etc.) are on PATH for build scripts.
# Yarn 4 with node-modules linker doesn't always inject node_modules/.bin
# into the shell PATH when running workspace scripts from the builder stage.
ENV PATH="/app/node_modules/.bin:$PATH"

# Copy Yarn config and root manifests first for better layer caching
COPY .yarnrc.yml package.json yarn.lock ./

# Copy all workspace package.json files so Yarn can resolve the full graph
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY shared/domain-lib/package.json shared/domain-lib/
COPY shared/infrastructure-lib/package.json shared/infrastructure-lib/
COPY learning-resource/domain/package.json learning-resource/domain/
COPY learning-resource/application/package.json learning-resource/application/
COPY learning-resource/infrastructure/package.json learning-resource/infrastructure/
COPY user/domain/package.json user/domain/
COPY user/application/package.json user/application/
COPY user/infrastructure/package.json user/infrastructure/

RUN yarn install --immutable

# Copy full source — the API imports from shared and domain packages
COPY . .

# Build workspace packages in dependency order so their dist/ is available
# before the API build resolves imports through node_modules
RUN yarn workspace domain-lib build && \
    yarn workspace infrastructure-lib build && \
    yarn workspace @learning-resource/domain build && \
    yarn workspace @learning-resource/application build && \
    yarn workspace @learning-resource/infrastructure build  && \
    yarn workspace @user/domain build && \
    yarn workspace @user/application build && \
    yarn workspace @user/infrastructure build

RUN yarn workspace api build

# ── Stage 2: production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable

WORKDIR /app

ENV NODE_ENV=production

COPY .yarnrc.yml package.json yarn.lock ./

COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY shared/domain-lib/package.json shared/domain-lib/
COPY shared/infrastructure-lib/package.json shared/infrastructure-lib/
COPY learning-resource/domain/package.json learning-resource/domain/
COPY learning-resource/application/package.json learning-resource/application/
COPY learning-resource/infrastructure/package.json learning-resource/infrastructure/
COPY user/domain/package.json user/domain/
COPY user/application/package.json user/application/
COPY user/infrastructure/package.json user/infrastructure/

RUN yarn install --immutable

# Copy compiled API and all workspace package dists (node_modules symlinks point here)
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/shared/domain-lib/dist ./shared/domain-lib/dist
COPY --from=builder /app/shared/infrastructure-lib/dist ./shared/infrastructure-lib/dist
COPY --from=builder /app/learning-resource/domain/dist ./learning-resource/domain/dist
COPY --from=builder /app/learning-resource/application/dist ./learning-resource/application/dist
COPY --from=builder /app/learning-resource/infrastructure/dist ./learning-resource/infrastructure/dist
COPY --from=builder /app/user/domain/dist ./user/domain/dist
COPY --from=builder /app/user/application/dist ./user/application/dist
COPY --from=builder /app/user/infrastructure/dist ./user/infrastructure/dist

EXPOSE 3000

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
