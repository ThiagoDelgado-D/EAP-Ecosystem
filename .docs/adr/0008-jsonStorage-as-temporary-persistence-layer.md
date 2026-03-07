# ADR-0008: JsonStorage as Temporary Persistence Layer

## Status

Accepted

## Context

EAP-Ecosystem requires a persistence mechanism for learning resources, topics, and resource types. At this stage of the project, the priority is validating the domain model, use cases, and API layer rather than investing in database infrastructure setup.

A persistence solution was needed that would:

- Allow the full application stack to run end-to-end without external infrastructure dependencies
- Be simple enough to set up and tear down during development
- Make stored data human-readable and easy to inspect during development and debugging
- Be replaceable in the future without modifying the domain or application layers

## Decision

A generic `JsonStorage<T>` class was implemented in `shared/infrastructure-lib` as the temporary persistence mechanism. It stores data as JSON files on the local filesystem, one file per aggregate type.

```typescript
export class JsonStorage<T extends Identifiable> implements StorageAdapter<T> {
  constructor(private readonly filePath: string) {}

  async readAll(): Promise<T[]> { ... }
  async writeAll(data: T[]): Promise<void> { ... }
  async findById(id: UUID): Promise<T | undefined> { ... }
  async save(item: T): Promise<T> { ... }
  async delete(id: UUID): Promise<void> { ... }
}
```

Concrete storage instances live in `learning-resource/infrastructure` and are initialized with absolute paths derived from `import.meta.url` to ensure consistent file location regardless of the process working directory:

```typescript
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../../../../apps/api/data");

export const learningResourceStorage = new JsonStorage<LearningResource>(
  resolve(dataDir, "learning-resources.json"),
);
```

The `StorageAdapter<T>` interface defined in `infrastructure-lib` ensures that `JsonStorage<T>` can be replaced by any other implementation (e.g. a database-backed repository) without modifying the application or domain layers.

Data files are stored in `apps/api/data/` and are excluded from version control via `.gitignore`. A seed script (`apps/api/src/scripts/seed.ts`) is provided to populate the storage with realistic development data using `@faker-js/faker`.

## Considered Options

- **PostgreSQL or another relational database** — discarded at this stage due to the infrastructure setup overhead (Docker, migrations, connection management) that would slow down early development and domain validation
- **SQLite** — discarded for similar reasons; adds a native dependency and query layer not justified at this stage
- **In-memory storage** — discarded because data would not persist across process restarts, making it impractical for manual API testing and development workflows
- **JsonStorage with filesystem persistence** — chosen for its zero infrastructure dependencies, human-readable output, and full replaceability via the `StorageAdapter<T>` interface

## Consequences

### Positive

- No external infrastructure required — the full stack runs with `yarn start` and `yarn seed`
- Stored data is human-readable JSON, making it easy to inspect, edit, and debug during development
- The `StorageAdapter<T>` interface decouples the application layer from the storage implementation, making a future migration to a real database transparent to the domain and use cases
- Trivial to reset by deleting the data files and re-running the seed script

### Negative

- Not suitable for production — lacks transactions, indexing, and query capabilities
- The read-modify-write pattern in `save()` and `delete()` is not safe for concurrent access; overlapping calls can cause lost updates (tracked as a pending task: `Add file locking mechanism for concurrent access`)
- Performance degrades as file size grows since the entire file is read and written on every operation
- Data files must be seeded manually after cloning the repository
