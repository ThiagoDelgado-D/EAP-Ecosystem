# EAP API

NestJS REST API for the EAP-Ecosystem. Exposes the Learning Resource module
via a versioned HTTP interface and persists data in PostgreSQL via TypeORM.

---

## Requirements

- Node.js >= 20
- Yarn 4.9.2
- Docker & Docker Compose

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable      | Description                        |
| ------------- | ---------------------------------- |
| `DB_HOST`     | PostgreSQL host (e.g. `localhost`) |
| `DB_PORT`     | PostgreSQL port (e.g. `5432`)      |
| `DB_USER`     | Database user                      |
| `DB_PASSWORD` | Database password                  |
| `DB_NAME`     | Database name                      |

> All variables are required. The application will fail fast at startup
> if any of them is missing.

---

## Database

### Starting PostgreSQL

PostgreSQL runs in Docker. The compose file is located at the repo root:

```bash
docker-compose -f .docker/docker-compose.yml --env-file apps/api/.env up -d
```

### Migrations

The project uses TypeORM CLI for schema management. All migration commands
operate against `src/database/data-source.ts`.

```bash
# Apply all pending migrations
yarn workspace api migration:run

# Revert the last applied migration
yarn workspace api migration:revert

# Generate a new migration based on entity changes
yarn workspace api migration:generate
```

> Migrations must be run before starting the API for the first time
> and after every pull that includes new migration files.

### Seed

Populate the database with development data:

```bash
yarn workspace api seed
```

---

## Running the API

```bash
# Development (watch mode)
yarn workspace api start:dev

# Production
yarn workspace api start:prod
```

The API is available at `http://localhost:3000/api/v1`.

---

## Testing

```bash
# Unit and integration tests
yarn workspace api test

# Watch mode
yarn workspace api test:watch

# Coverage report
yarn workspace api test:cov
```

---

## Available Endpoints

### Learning Resources

| Method   | Path                                        | Description         |
| -------- | ------------------------------------------- | ------------------- |
| `POST`   | `/api/v1/learning-resources`                | Create a resource   |
| `GET`    | `/api/v1/learning-resources`                | List all resources  |
| `GET`    | `/api/v1/learning-resources/filter`         | Filter resources    |
| `GET`    | `/api/v1/learning-resources/:id`            | Get resource by ID  |
| `PATCH`  | `/api/v1/learning-resources/:id`            | Update a resource   |
| `DELETE` | `/api/v1/learning-resources/:id`            | Delete a resource   |
| `PATCH`  | `/api/v1/learning-resources/:id/difficulty` | Toggle difficulty   |
| `PATCH`  | `/api/v1/learning-resources/:id/energy`     | Toggle energy level |
| `PATCH`  | `/api/v1/learning-resources/:id/status`     | Toggle status       |

---

## Project Structure

```
apps/api/src/
├── database/
│   ├── data-source.ts        # TypeORM DataSource for CLI migrations
│   ├── database.module.ts    # NestJS global database module
│   └── migrations/           # Migration files
├── filters/
│   └── http-exception-filter.ts
├── learning-resource/
│   └── learning-resource.module.ts
├── middleware/
│   └── logger-middleware.ts
├── scripts/
│   └── seed.ts
└── main.ts
```

---

## Architecture Notes

- **`data-source.ts`** and **`DatabaseModule`** are intentionally separate.
  The former is used exclusively by the TypeORM CLI; the latter by NestJS at
  runtime via `ConfigService`.
- TypeORM entities live in `learning-resource/infrastructure`, keeping the
  domain layer fully agnostic of the ORM.
- `DatabaseModule` is registered as a global module, so repositories are
  available for injection across the entire application without re-importing.
