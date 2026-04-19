# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/web/package.json apps/web/

RUN yarn workspace @eap/web install --frozen-lockfile

COPY apps/web/ apps/web/

RUN yarn workspace @eap/web build

# ── Stage 2: production (nginx) ────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
