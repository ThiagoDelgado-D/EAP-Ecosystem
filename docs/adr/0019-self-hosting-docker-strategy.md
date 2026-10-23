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

## Revision 2026-10-23 — Google sign-in replaces the password fallback

**Status of this revision:** Accepted

### What prompted this revision

While the references of ADR-0020 were being audited for its 2026-10-23
revision, its decision 4 and this ADR's "Authentication in self-hosted
context" turned out to contradict each other. This ADR offers email and
password sign-in as a fallback for self-hosters without SMTP, and says the
fallback is "documented in the auth ADR". ADR-0020 says the opposite:
password-based authentication is explicitly out of scope, and the SMTP
dependency is the accepted trade-off. No password sign-in was ever built.

Reading the API's configuration for this revision also showed something
this ADR never mentions. Outside development, the API refuses to start
without `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and
`GOOGLE_REDIRECT_URI`, so every self-hosted instance already needs Google
OAuth credentials. SMTP is not checked at startup: an instance without it
starts, and requesting a sign-in code fails when the email can't be sent.

### What the original decision assumed

That Magic Link would be the only way to sign in, so an instance without
SMTP would have no way in unless a second, SMTP-free method was added, and
that the second method would be email and password.

### Why it changed

ADR-0020 rejected passwords for the whole project, and added Google
sign-in as a provider next to Magic Link. Google sign-in doesn't send
email, so it already is the SMTP-free way in that this ADR was looking
for. Keeping the password fallback here would describe a feature the auth
architecture forbids.

### New decision

#### Google sign-in is the alternative to SMTP

A self-hosted instance offers Magic Link when SMTP is configured, and
Google sign-in in every case. An instance without SMTP is usable through
Google sign-in alone. There is no email and password sign-in, in line with
ADR-0020 decision 4.

#### Google OAuth credentials are required to self-host

Outside development, the API doesn't start without the three Google
variables, and this ADR now documents that as a requirement. A self-hoster
creates an OAuth client in Google Cloud and sets:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=secret
GOOGLE_REDIRECT_URI=https://eap.example.com/api/v1/auth/google/callback
```

SMTP stays optional. Without it, Magic Link is unavailable on that
instance.

### Consequences of the revision

#### Positive

- This ADR and ADR-0020 agree: no part of the project offers passwords.
- An instance without SMTP still has a way in, with nothing new to build.
- The self-hosting requirements match what the API enforces today.

#### Negative

- Setting up Google OAuth credentials is friction of its own, and every
  self-hoster has to go through it, with or without SMTP.
- On an instance without SMTP, a learner without a Google account can't
  sign in.
- Without SMTP, the sign-in page still offers Magic Link, and requesting a
  code fails with an error instead of saying the instance doesn't send
  email.

### Alternatives rejected in this revision

- **Keep email and password as the fallback.** It contradicts ADR-0020
  decision 4 and would bring back the password storage, reset flow and
  credential-stuffing exposure that ADR-0020 avoids.
- **Require SMTP and offer no alternative.** Simpler to state, but it
  ignores that Google sign-in already works without SMTP.
- **Print sign-in codes to the server log when SMTP is missing.** Workable
  for a single-user instance whose owner reads the logs, but anyone who
  can read the logs could sign in as anyone, and an instance enabled this
  way by mistake would be open.

## References

- ADR-0014: Real-time Communication (WebSockets run inside the API container
  when introduced — no additional infrastructure needed)
- ADR-0017: Mobile Client Strategy
- ADR-0018: Desktop Client Strategy
- Roadmap: v0.8.0 — full-stack Compose; v1.0.0 — GHCR images

Revision 2026-10-23 — Google sign-in replaces the password fallback:

- ADR-0020: Authentication Architecture — decision 4 rules out passwords,
  and its providers include Google sign-in, the alternative to SMTP here
