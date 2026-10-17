# syntax=docker/dockerfile:1

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

# Ensure root workspace binaries (tsc, etc.) are on PATH for build scripts.
# Yarn 4 with node-modules linker doesn't always inject node_modules/.bin
# into the shell PATH when running workspace scripts from the builder stage.
ENV PATH="/app/node_modules/.bin:$PATH"

ENV YARN_ENABLE_SCRIPTS=false

# Every workspace manifest, matched by glob so a new package can't be missed
COPY .yarnrc.yml package.json yarn.lock ./
COPY --parents */*/package.json ./

RUN yarn install --immutable

COPY . .

# Builds the API and every workspace it depends on, dependencies first
RUN yarn workspaces foreach -Rt --from api run build

RUN yarn workspaces focus api --production

# ── Stage 2: production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --parents /app/./*/*/package.json /app/./*/*/dist ./

# node:20-alpine ships a non-root "node" user for exactly this purpose.
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["node", "apps/api/dist/apps/api/src/main.js"]
