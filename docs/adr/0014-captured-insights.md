# ADR-0014: Captured Insights – Structured Notes for Learning Resources

## Status

**Draft** – Actively evaluating alternatives before implementation.

## Context

The current `notes` field on `LearningResource` is a single Markdown string. While flexible, it does not support incremental note‑taking (adding one insight at a time) or the ability to list, edit, or delete individual notes. The design mockup shows a dedicated “Captured Insights” section with an input to add new insights and a list of previously captured ones.

This ADR documents the architectural alternatives we are actively evaluating. The final decision will be made after the resource detail view is stable (v0.7.1) and authentication is in place (v0.8.0).

---

## Alternatives Being Actively Evaluated

### Alternative A – Embedded JSON array (`insights` column)

**Description:**  
Add a `jsonb` column `insights` directly to the `learning_resources` table. Each insight is an object: `{ id: UUID, content: string, createdAt: Date, updatedAt: Date }`.

**Pros:**

- **Simple to implement** – no new tables, no extra joins.
- **Fast for read/write** – single row update, partial updates with `jsonb_set`.
- **Easy migration** – one `ALTER TABLE` with a default `[]`.
- **Flexible** – can later add fields like `tags` or `userId` without schema changes.

**Cons:**

- **Query limitations** – filtering insights (e.g., by date) requires JSON operators, less efficient than indexed columns.
- **Row size growth** – many insights per resource could bloat the row, impacting overall performance.
- **No referential integrity** – cannot enforce foreign key to `users` if `userId` is added later.

---

### Alternative B – Separate `insights` table (one‑to‑many)

**Description:**  
Create a new table `insights` with columns: `id`, `learning_resource_id`, `content`, `created_at`, `updated_at`, `user_id`. Each insight belongs to exactly one resource.

**Pros:**

- **Normalized** – clean, indexed queries, easy to filter/sort by any field.
- **Scalable** – no row bloat, each insight is a separate row.
- **Referential integrity** – can enforce foreign keys to `learning_resources` and `users`.
- **Advanced queries** – global search across all insights, analytics, etc.

**Cons:**

- **More complex** – new entity, repository, use cases, API endpoints, and migration.
- **Multiple queries** – fetching a resource + its insights requires two queries (or a join).
- **Heavier migration** – creating a table and migrating existing `notes` content would be non‑trivial.

---

### Alternative C – Keep single `notes` field (no change)

**Description:**  
Do not implement structured insights. Users continue to use the Markdown `notes` field for everything.

**Pros:**

- **Zero development effort** – no code, no migration, no new UI.
- **Simplicity** – one field for all textual content.

**Cons:**

- **Poor UX** – cannot capture incremental insights, no list or edit/delete per insight.
- **Does not match design** – the “Captured Insights” section cannot be implemented.
- **Difficult to edit** – user must rewrite the whole note to change a single sentence.

---

## Decision (Pending)

We have not yet made a final decision. We are currently leaning toward **Alternative A (embedded JSON)** because it offers the best balance between simplicity and functionality for an MVP. However, we are still evaluating the potential impact of row bloat and query complexity.

**The decision will be made once the following conditions are met:**

- Resource detail view is merged and stable (v0.7.1).
- Authentication is operational (v0.8.0) – to know if `userId` is needed.
- We have a realistic estimate of the average number of insights per resource.

## Consequences (Regardless of Decision)

- **If A is chosen:** Faster delivery, but may require a future refactor to a separate table if insights grow too large.
- **If B is chosen:** More upfront work, but better long‑term scalability and query capabilities.
- **If C is chosen:** We abandon the feature, which contradicts the design vision.

## References

- UI Mockup: “Captured Insights” section in resource detail view.
- Roadmap: Post‑v0.7.x – Incremental note‑taking.
- Depends on: `feature/resource-detail-view` (PR) and user authentication (v0.8.0).
