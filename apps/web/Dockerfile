# syntax=docker/dockerfile:1

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

ENV YARN_ENABLE_SCRIPTS=false

# Every workspace manifest, matched by glob so a new package can't be missed
COPY .yarnrc.yml package.json yarn.lock ./
COPY --parents */*/package.json ./

RUN yarn install --immutable

# The web imports domain types straight from the packages' sources
COPY . .

RUN yarn workspace web build

# ── Stage 2: production (nginx) ────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# nginx:alpine's master process needs root to bind port 80; its worker
# processes already drop to the unprivileged "nginx" user on their own.
# Not switched to a non-root user here for that reason.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
