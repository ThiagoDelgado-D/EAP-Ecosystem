# EAP-Ecosystem

> **E**cosistema de **A**prendizaje **P**ersonal  
> A comprehensive personal learning ecosystem built with modern architectural principles to optimize your learning journey based on energy levels, focus, and content management.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=18-43853D.svg)](https://nodejs.org/)
[![Yarn](https://img.shields.io/badge/Yarn-4.9-2C8EBB.svg)](https://yarnpkg.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18.svg)](https://vitest.dev/)
[![ESM](https://img.shields.io/badge/Modules-ESM-F7DF1E.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-blueviolet.svg)](https://8thlight.com/blog/uncle-bob/2012/08/13/the-clean-architecture.html)
[![Hexagonal Architecture](https://img.shields.io/badge/Architecture-Hexagonal-ff69b4.svg)](https://alistair.cockburn.us/hexagonal-architecture/)
[![DDD](https://img.shields.io/badge/Domain--Driven_Design-DDD-8A2BE2.svg)](https://www.domainlanguage.com/ddd/)

[![Commit Style](https://img.shields.io/badge/Commits-Conventional_Commits-FE5196.svg)](https://www.conventionalcommits.org/)
[![Version](https://img.shields.io/badge/version-0.6.0-blue.svg)](https://github.com/ThiagoDelgado-D/EAP-Ecosystem/releases)

[![Project Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](https://github.com/ThiagoDelgado-D/EAP-Ecosystem)
[![Issues](https://img.shields.io/github/issues/ThiagoDelgado-D/EAP-Ecosystem.svg)](https://github.com/ThiagoDelgado-D/EAP-Ecosystem/issues)
[![Last Commit](https://img.shields.io/github/last-commit/ThiagoDelgado-D/EAP-Ecosystem.svg)](https://github.com/ThiagoDelgado-D/EAP-Ecosystem/commits/main)

---

## What is EAP?

Managing learning resources is harder than it looks. Bookmarks pile up, courses get forgotten, and when you finally have 20 minutes free you don't know what to pick up. EAP solves that by letting you catalog your resources with metadata that matters: difficulty, energy required, estimated duration, and status.

The long-term goal is a recommendation engine that suggests what to study based on how much time and mental energy you actually have at that moment.

**Right now**, EAP is a full-stack application with a REST API and an Angular 21 frontend
that lets you manage your learning resources, filter them by difficulty and energy level,
and add new ones via a guided step-by-step form. Recommendations and advanced features
are coming in upcoming versions.

---

## 🎯 Current Status (v0.6.0)

| Component                       | Status               | Notes                                               |
| ------------------------------- | -------------------- | --------------------------------------------------- |
| **Domain Layer**                | ✅ Stable            | `LearningResource` + `User` domains complete        |
| **Application Layer**           | ✅ Stable            | Use cases + URL preview port                        |
| **API Layer**                   | ✅ Stable            | NestJS REST, PostgreSQL, TypeORM                    |
| **Frontend**                    | ✅ Stable            | Angular 21, dashboard, resource library, URL Import |
| **URL Import**                  | ✅ Complete          | oEmbed + Open Graph + graceful fallback (v0.6.0)    |
| **URL Voice & CSV/JSON import** | 📅 Next (v0.7.0)     | Voice capture with transcription and draft review   |
| **User Module**                 | 🚧 Foundation        | Domain + application only, not wired to API or auth |
| **Authentication**              | 📅 Next (v0.8.0)     | Magic link → OAuth → MFA                            |
| **Session Tracking**            | 📅 Planned (v0.10.0) | Focus Pulse uses hardcoded data until then          |
| **Recommendation Engine**       | 📅 Planned (v0.11.0) | Ideal Match uses filter-based approach until then   |

See the [Roadmap](https://github.com/ThiagoDelgado-D/EAP-Ecosystem/wiki) for the full plan.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn 4.x

### Installation

```bash
git clone https://github.com/ThiagoDelgado-D/EAP-Ecosystem
cd EAP-Ecosystem
yarn install
```

### Run the API

```bash
# Copy and fill environment variables
cp apps/api/.env.example apps/api/.env

# Start PostgreSQL
docker-compose -f .docker/docker-compose.yml --env-file apps/api/.env up -d

# Run migrations
yarn workspace api migration:run

# (Optional) Seed sample data
yarn workspace api seed

# Start in development mode
yarn workspace api start:dev
```

The API will be available at `http://localhost:3000`.

### Run the Frontend

```bash
cd apps/web
npm run start
```

The frontend will be available at `http://localhost:4200`.

### Run tests

```bash
# All workspaces
yarn test

# Specific workspace
yarn workspace @learning-resource/application test
```

### Build

```bash
yarn build
```

---

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

| Method | Endpoint                             | Description                                         |
| ------ | ------------------------------------ | --------------------------------------------------- |
| POST   | `/learning-resources`                | Create a resource                                   |
| GET    | `/learning-resources`                | List all resources                                  |
| GET    | `/learning-resources/filter`         | Filter by difficulty, status, topicIds, energyLevel |
| GET    | `/learning-resources/:id`            | Get by ID                                           |
| PATCH  | `/learning-resources/:id`            | Update resource                                     |
| DELETE | `/learning-resources/:id`            | Delete resource                                     |
| PATCH  | `/learning-resources/:id/difficulty` | Toggle difficulty                                   |
| PATCH  | `/learning-resources/:id/energy`     | Toggle energy level                                 |
| PATCH  | `/learning-resources/:id/status`     | Toggle status                                       |
| GET    | `/health`                            | Health check                                        |
| POST   | `/learning-resources/preview`        | Extract metadata from URL                           |

---

## Tech Stack

| Area          | Technology                |
| ------------- | ------------------------- |
| Runtime       | Node.js 20 + ESM          |
| Language      | TypeScript 5.7            |
| API Framework | NestJS 11                 |
| Frontend      | Angular 21                |
| Styling       | Tailwind CSS v4           |
| Monorepo      | Yarn 4 Workspaces         |
| Testing       | Jest + Supertest + Vitest |
| Storage       | PostgreSQL + TypeORM      |

---

## Project Structure

```
EAP-Ecosystem/
├── apps/
│   └── api/                        # NestJS REST API
│   └── web/                        # Angular 21 frontend
├── learning-resource/
│   ├── domain/                     # Entities, repository interfaces
│   ├── application/                # Use cases, validation, errors
│   └── infrastructure/             # TypeORM entities and repositories
├── shared/
│   ├── domain-lib/                 # Base entities, errors, types, validators
│   └── infrastructure-lib/         # CryptoService, JsonStorage
└── .docs/
    └── adr/                        # Architecture Decision Records
```

---

## Documentation

- [Architecture](ARCHITECTURE.md) — architectural principles, patterns, and decisions
- [Changelog](CHANGELOG.md) — version history
- [ADRs](.docs/adr/) — individual architectural decision records
- [Roadmap & Progress](https://github.com/ThiagoDelgado-D/EAP-Ecosystem/wiki) — versioned roadmap and feature tracking

---

## License

MIT — see [LICENSE](LICENSE) for details.
