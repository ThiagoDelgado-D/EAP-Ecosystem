# ADR-0009: File Locking for Concurrent Storage Access

## Status

Proposed

## Context

The current `JsonStorage<T>` implementation uses a read-modify-write pattern for `save()` and `delete()` operations. Both methods call `readAll()` before persisting, meaning two overlapping calls can read the same snapshot and the later `writeAll()` silently overwrites the earlier one, causing lost updates.

While this is acceptable during the early development phase where `JsonStorage` is used as a temporary persistence layer with a single process and no concurrent requests, it becomes a real risk as soon as:

- The API handles concurrent HTTP requests that modify the same resource
- The seed script runs while the API is serving requests
- Multiple Node.js worker threads or processes share the same data files

A mechanism is needed to serialize write operations on the filesystem level to prevent data corruption without requiring a migration to a full database.

## Decision

The implementation will introduce a file locking mechanism that ensures only one writer accesses a given JSON file at a time.
Candidates under consideration:

**Option A — `proper-lockfile` (advisory locking):**
Uses a lock file alongside each data file (e.g. `learning-resources.json.lock`) to signal that a write is in progress. Other processes poll or wait until the lock is released.

```typescript
import lockfile from "proper-lockfile";

async save(item: T): Promise<T> {
  const release = await lockfile.lock(this.filePath);
  try {
    const all = await this.readAll();
    // ...modify and write
    return item;
  } finally {
    await release();
  }
}
```

**Option B — In-process async queue:**
Serialize all read-modify-write operations through a per-file async queue (e.g. using `p-queue` with concurrency 1). This solves the single-process case without filesystem-level locking overhead.

```typescript
private queue = new PQueue({ concurrency: 1 });

async save(item: T): Promise<T> {
  return this.queue.add(async () => {
    const all = await this.readAll();
    // ...modify and write
    return item;
  });
}
```

## Considered Options

- **`proper-lockfile`** — handles both single and multi-process concurrency at the cost of an external dependency and lock file management
- **In-process async queue (`p-queue`)** — simpler, zero filesystem overhead, but only protects against concurrent calls within the same Node.js process
- **No locking** — current state, acceptable only while `JsonStorage` is used in a single-process development environment with low concurrency

## Consequences

### Positive

- Eliminates lost updates caused by overlapping read-modify-write cycles
- Makes `JsonStorage` safe for use under concurrent HTTP request load during development
- Chosen approach can be encapsulated entirely within `JsonStorage<T>` with no changes required in the application or domain layers

### Negative

- Introduces additional complexity and potentially an external dependency into `shared/infrastructure-lib`
- Lock file management (`proper-lockfile`) requires handling stale locks on process crashes
- An in-process queue does not protect against multi-process scenarios (e.g. running the seed script while the API is live)
- Any locking mechanism adds latency to write operations
