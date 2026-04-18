# ADR-0019: Self-Hosting and Docker Strategy

## Status

Accepted

## Context

EAP-Ecosystem already uses Docker Compose to run PostgreSQL for local
development. The question is whether to extend Docker to cover the full
application stack and, if so, for what purpose and at what point in the
roadmap.

Two distinct use cases drive this decision:

**Use case 1 — Developer convenience**: Running `docker-compose up` to start
the full stack (database + API + frontend) without manually launching three
separate processes. Relevant from the next version onward.

**Use case 2 — Self-hosting**: Privacy-conscious or infrastructure-owning
users running EAP on their own server or VPS. Data stays on their
infrastructure; no dependency on a cloud-hosted instance.

EAP's target audience — developers and knowledge workers who actively manage
their own learning — overlaps significantly with the population that uses
Docker without friction and values data ownership. Self-hosting is therefore
not a niche edge case but a natural distribution channel for this product.

## Decision

### Phase 1 — Full-stack development Compose (v0.8.0)

Extend the existing `docker-compose.yml` to include all three services:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file: apps/api/.env
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    env_file: apps/api/.env
    depends_on:
      - postgres
    ports:
      - "3000:3000"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "4200:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

`apps/api/Dockerfile`: multi-stage build — `node:20-alpine` builder compiles
TypeScript, production stage copies `dist/` only.

`apps/web/Dockerfile`: `node:20-alpine` builder runs `npm run build`,
production stage is `nginx:alpine` serving the `dist/` folder with an
`nginx.conf` that handles Angular's HTML5 routing (all 404s → `index.html`).

This setup is the primary target for **personal daily use** — one command
brings up the entire ecosystem locally, including after machine restarts or
team onboarding.

### Phase 2 — Self-hosting production image (v1.0.0)

Publish versioned images to **GitHub Container Registry** (`ghcr.io`):

```
ghcr.io/thiagodelgado-d/eap-api:1.0.0
ghcr.io/thiagodelgado-d/eap-web:1.0.0
```

A `docker-compose.self-hosted.yml` is provided that references these
pre-built images instead of building from source. Self-hosters run:

```bash
curl -O https://raw.githubusercontent.com/.../docker-compose.self-hosted.yml
cp .env.example .env  # fill in credentials
docker-compose -f docker-compose.self-hosted.yml up -d
```

Images are published automatically via GitHub Actions on every release tag.

### Authentication in self-hosted context

Magic Link authentication (v0.8.0) requires an SMTP server to deliver
one-time codes. In a self-hosted context, the user must provide SMTP
credentials via environment variables:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=secret
SMTP_FROM=noreply@example.com
```

`.env.example` documents all required variables with inline comments.
To reduce the SMTP barrier for self-hosters, **email/password authentication**
is offered as an alternative fallback — documented in the auth ADR. This
avoids the situation where a self-hosted instance is unusable because SMTP
is not configured.

### What Docker does NOT cover

Desktop (Tauri) and mobile (Capacitor) distributions produce native
binaries — Docker is irrelevant for those clients. Docker covers the
**server-side** of EAP (API + web frontend) only.

## Consequences

**Positive**

- Local development reduced to `docker-compose up`; no manual process
  management across three terminal tabs
- Self-hosting is viable from v1.0.0 with minimal operational knowledge
  required from the user
- Data sovereignty: self-hosters own their PostgreSQL data entirely
- Aligns with the audience's existing Docker familiarity
- CI/CD can build and push images as part of the release workflow
  (GitHub Actions, already planned for v1.0.0)

**Negative**

- Self-hosters are responsible for their own backups, upgrades, and SMTP
  configuration — documentation must be thorough
- Image versioning adds a release step: tagging and pushing to GHCR must
  be part of the release checklist from v1.0.0 onward
- SMTP requirement for Magic Link adds friction for self-hosted setup;
  mitigated by the email/password fallback

## Rejected Alternatives

- **Docker for desktop client**: Tauri produces native binaries. Packaging
  a desktop app as a Docker container is both technically awkward and
  contrary to user expectations for desktop software.
- **Single monolithic container (API + web in one image)**: Violates
  separation of concerns, makes independent scaling impossible, and
  complicates CI caching. Two images with a Compose file is the standard
  pattern.
- **Kubernetes / Helm**: Significant operational overhead for a single-user
  or small-team tool. Docker Compose is the right complexity level for the
  self-hosting audience.

## References

- ADR-0014: Real-time Communication (WebSockets run inside the API container
  when introduced — no additional infrastructure needed)
- ADR-0017: Mobile Client Strategy
- ADR-0018: Desktop Client Strategy
- Roadmap: v0.8.0 — full-stack Compose; v1.0.0 — GHCR images
