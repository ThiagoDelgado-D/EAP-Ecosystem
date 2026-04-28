# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

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

# Copy only the web source — the Angular build is self-contained
COPY apps/web/ apps/web/

RUN yarn workspace web build

# ── Stage 2: production (nginx) ────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
