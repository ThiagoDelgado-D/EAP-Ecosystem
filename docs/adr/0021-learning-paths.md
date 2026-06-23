# ADR-0021: Learning Paths — Structure, Creation Modes, and Import

**Date:** 2026-06-17
**Status:** Accepted  
**Amended:** 2026-06-23 — composite FK on edges to prevent cross-path edges (see Database section)

## Context

The EAP-Ecosystem catalog is currently a flat collection of independent resources.
The Knowledge Graph (ADR-0016) adds semantic relationships between resources, but
provides no traversal structure — there is no way to say "I want to learn Angular
from scratch, following this specific order, with these specific resources."

ADR-0016 anticipated that a Learning Path would be "an ordered, directed subgraph of
the broader knowledge graph." This definition proved insufficient for two reasons:

1. A path needs **stub nodes** (steps without an associated catalog resource) — it
   cannot be a pure subgraph if some nodes have no `LearningResource`.
2. A path may have **branching** (alternative routes, optional topics), which goes
   beyond a simple ordered list of resources.

Analysis of reference implementations confirms the pattern:

- **roadmap.sh**: ReactFlow-based graph with `topic`/`subtopic` nodes that carry no
  embedded content; content lives in separate markdown files. No official API exists —
  the JSON is accessible via GitHub raw.
- **Pluralsight Channels**: mixes platform content with external links (manually
  supplied title, type, skill level, duration) — the "external link" is the functional
  equivalent of a stub node.
- **Classic LMS platforms** (Thinkific, Teachable): structure-first, content-later —
  a node (chapter/lesson) can exist without published content.

## Decision

### Domain model

#### `LearningPath`

```typescript
export interface LearningPath {
  id: UUID;
  userId: UUID;
  title: string;
  description?: string;
  mode: "sequential" | "graph";
  source?: "manual" | "roadmap.sh";
  sourceSlug?: string; // e.g. 'frontend', 'angular'
  createdAt: Date;
  updatedAt: Date;
}
```

`mode` controls the editing UX and render strategy. The underlying data model is always
a graph — in `sequential` mode edges are implicit and derived from `order`; in `graph`
mode edges are explicit and user-editable.

#### `LearningPathNode`

```typescript
export interface LearningPathNode {
  id: UUID;
  learningPathId: UUID;
  title: string;
  description?: string;
  externalUrl?: string;
  learningResourceId?: UUID | null; // null = stub node
  stubScope?: "path-local" | "catalog"; // only relevant when learningResourceId is null
  order?: number; // only used in 'sequential' mode
  sourceNodeId?: string; // original node ID from roadmap.sh for deduplication
}
```

`learningResourceId` being nullable is the central design decision. When `null`, the
node is a stub. `stubScope` controls stub visibility:

- `path-local`: exists only within this path; invisible in the global catalog
- `catalog`: represents a `LearningResource` pending completion; can be promoted to a
  full resource from within the path

#### `LearningPathEdge`

```typescript
export interface LearningPathEdge {
  id: UUID;
  learningPathId: UUID;
  fromNodeId: UUID;
  toNodeId: UUID;
}
```

Only created and edited in `graph` mode. In `sequential` mode, edges are derived from
`order` and are not persisted as rows.

#### Node progress

Progress is stored as a `progress` column directly on `LearningPathNode` (`pending | in_progress | done`). There is no separate `LearningPathNodeProgress` entity.

**Rationale:** the app is designed for single-user use. Each path belongs to exactly one user (`userId` on `LearningPath`), so a separate progress table would always contain exactly one row per node — pure overhead with no benefit. Overall path progress is derived: `Math.floor((nodesDone / totalNodes) * 100)`.

**Future migration path (if path sharing is ever needed):** create a `learning_path_node_progress` table with `(userId, nodeId, status, completedAt)` and `UNIQUE(userId, nodeId)`, backfill from the existing `progress` column using the path's `userId`, then drop the column. The migration is mechanical and localized to the repository and use case layer.

---

### Database

```sql
CREATE TABLE learning_paths (
  id           uuid PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        varchar(255) NOT NULL,
  description  text,
  mode         varchar(20) NOT NULL DEFAULT 'sequential'
               CHECK (mode IN ('sequential', 'graph')),
  source       varchar(50),
  source_slug  varchar(100),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE learning_path_nodes (
  id                   uuid PRIMARY KEY,
  learning_path_id     uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  title                varchar(255) NOT NULL,
  description          text,
  external_url         text,
  learning_resource_id uuid REFERENCES learning_resources(id) ON DELETE SET NULL,
  stub_scope           varchar(20) DEFAULT 'path-local'
                       CHECK (stub_scope IN ('path-local', 'catalog')),
  "order"              integer,
  source_node_id       varchar(255),
  created_at           timestamptz NOT NULL DEFAULT now(),
  -- Required for the composite FK referenced by learning_path_edges.
  -- id is already globally unique via PRIMARY KEY, but the composite
  -- (learning_path_id, id) must be declared explicitly to serve as an FK target.
  CONSTRAINT uq_learning_path_nodes_path UNIQUE (learning_path_id, id)
);

CREATE TABLE learning_path_edges (
  id               uuid PRIMARY KEY,
  learning_path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  -- Composite FKs enforce that both nodes belong to the same path as the edge.
  -- A simple FK on from_node_id alone would allow edges connecting nodes from
  -- different paths, silently corrupting path-scoped graph reads.
  CONSTRAINT fk_edge_source FOREIGN KEY (learning_path_id, from_node_id)
    REFERENCES learning_path_nodes(learning_path_id, id) ON DELETE CASCADE,
  CONSTRAINT fk_edge_target FOREIGN KEY (learning_path_id, to_node_id)
    REFERENCES learning_path_nodes(learning_path_id, id) ON DELETE CASCADE,
  from_node_id     uuid NOT NULL,
  to_node_id       uuid NOT NULL,
  UNIQUE (from_node_id, to_node_id),
  CONSTRAINT no_self_loop CHECK (from_node_id <> to_node_id)
);

-- No learning_path_node_progress table. Progress lives as a column on
-- learning_path_nodes. See "Node progress" section in the domain model.
```

`ON DELETE SET NULL` on `learning_resource_id`: deleting a catalog resource downgrades
the node to a stub rather than cascading the deletion to the path structure.

**Cross-path edge prevention (amendment 2026-06-23):**
`learning_path_edges` uses composite FKs — `(learning_path_id, from_node_id)` and `(learning_path_id, to_node_id)`— both referencing `learning_path_nodes(learning_path_id, id)`. PostgreSQL verifies that the `learning_path_id` in the edge matches the `learning_path_id` of each referenced node, making it impossible to insert an edge that connects nodes belonging to different paths.
Simple FKs on the node IDs alone would allow that scenario and silently corrupt `findEdgesByPathId` results. Enforcement is also duplicated in the `addLearningPathEdge`
use case (defense in depth: DB constraint + application-layer validation).

---

### Mode suggestion wizard

When creating a path, the user answers 3 questions:

| #   | Question                                                                     | Answer that increments score toward `graph` |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Must all topics be studied in a fixed order?                                 | No                                          |
| 2   | Are there optional topics or alternative routes to the same destination?     | Yes                                         |
| 3   | Is this a reference map to explore freely, rather than a step-by-step track? | Yes                                         |

Score ≥ 2 → suggest `graph`. Score < 2 → suggest `sequential`.
The suggestion is non-binding — the user can choose either mode before confirming.

---

### Import from roadmap.sh

`POST /api/v1/learning-paths/import/roadmap-sh` receives `{ slug: string }` and runs:

1. Fetch `https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps/[slug]/[slug].json`
2. Filter nodes where `type === 'subtopic'` (the concrete learning steps)
3. Map each node to `LearningPathNode`:
   - `title = node.data.label`
   - `learningResourceId = null`
   - `stubScope = 'path-local'`
   - `sourceNodeId = node.id`
4. Import the `edges[]` array from the original JSON as `LearningPathEdge` rows
5. Create the path with `mode: 'graph'`, `source: 'roadmap.sh'`, `sourceSlug: slug`

Per-node content (articles, recommended links) lives in separate markdown files in the
roadmap.sh repo and **is not imported** — only the node title. The user links existing
resources or promotes stubs to full resources from within the path view.

**External dependency:** the JSON is accessible via GitHub raw without authentication.
No official API exists (issue #8118 in the repo). If the JSON schema changes, the import
may break — mitigated by schema validation before processing.

---

### Error model

Use cases return errors as typed values (never throw). Domain-specific errors live in `learning-resource/domain/src/errors/` — they are scoped to this bounded context and have no reason to exist in `domain-lib`. Errors in `domain-lib` (`NotFoundError`, `InvalidDataError`) are justified there because they are reused across multiple bounded contexts; LP-specific errors are not.

| Error | Extends | Returned by |
|---|---|---|
| `LearningPathNotFound` | `NotFoundError` | `getLearningPath`, `updateLearningPath`, `deleteLearningPath`, `addLearningPathNode` |
| `LearningPathForbidden` | `ForbiddenError` | any use case where path exists but belongs to a different user |
| `LearningPathNodeNotFound` | `NotFoundError` | `updateLearningPathNode`, `deleteLearningPathNode`, `updateLearningPathNodeProgress` |
| `LearningPathEdgeNotFound` | `NotFoundError` | `deleteLearningPathEdge` |
| `DuplicateLearningPathEdge` | `InvalidDataError` | `addLearningPathEdge` |
| `LearningPathCreationError` | `InvalidDataError` | `createLearningPath` |

**Authorization:** "path not found" and "path belongs to another user" are distinct errors internally — they carry different semantics and are useful for logging, metrics, and auditing. The HTTP layer maps each to its correct status code:

- `LearningPathNotFound` → `404`
- `LearningPathForbidden` → `403`

What must never reach the client: stack traces, TypeORM error messages, table or column names, raw query output, or any other internal system detail. The error mapper (`toHttpException`) produces clean, generic response bodies.

---

### API endpoints

```
# Paths
POST   /api/v1/learning-paths                              create path (with wizard result)
GET    /api/v1/learning-paths                              list user's paths
GET    /api/v1/learning-paths/:id                          path detail with nodes and edges
PATCH  /api/v1/learning-paths/:id                          update title, description, mode
DELETE /api/v1/learning-paths/:id                          delete path

# Nodes
POST   /api/v1/learning-paths/:id/nodes                    add node (linked or stub)
PATCH  /api/v1/learning-paths/:id/nodes/:nodeId            update node (link resource, etc.)
DELETE /api/v1/learning-paths/:id/nodes/:nodeId            remove node
POST   /api/v1/learning-paths/:id/nodes/:nodeId/promote    promote catalog stub to LearningResource

# Edges (graph mode only)
POST   /api/v1/learning-paths/:id/edges                    add edge
DELETE /api/v1/learning-paths/:id/edges/:edgeId            remove edge

# Progress
PATCH  /api/v1/learning-paths/:id/nodes/:nodeId/progress   update node status

# Import
POST   /api/v1/learning-paths/import/roadmap-sh            import from roadmap.sh
```

---

### Frontend

**Sequential mode:** vertical list with drag & drop (Angular CDK `DragDrop`). Each item
shows title, node progress status, and a badge indicating stub vs. linked resource.
Reordering updates the `order` field on each node.

**Graph mode:** SVG visualization using `@swimlane/ngx-graph`, which provides Dagre
hierarchical layout, draggable nodes, zoom/pan, and full Angular standalone component
support out of the box. Nodes are rendered as Angular templates; a side panel opens on
node selection.

`@swimlane/ngx-graph` is also adopted for the **Atlas View** (ADR-0016), replacing the
planned raw D3.js implementation. This consolidates all graph visualization under a
single dependency and a consistent rendering model across the application. ADR-0016
should be updated to reflect this change.

**Wizard:** 3-question modal with real-time scoring and a suggestion badge ("We suggest:
Sequential / Graph") before the user confirms creation.

**Stub promotion:** action on a node → opens the `LearningResource` form pre-filled with
the stub title. On save, `learningResourceId` on the node is updated.

---

## Relationship with ADR-0016 (Knowledge Graph)

Learning Paths and the Knowledge Graph are **complementary, not coupled**:

- A `LearningPathNode` may reference a `LearningResource` that also has
  `ResourceRelationship` entries in the knowledge graph — but it does not require them.
- `LearningPathEdge` rows are curation edges (traversal order); they are not the same as
  knowledge graph edges (`PREREQUISITE`, `BUILDS_ON`, etc.).
- A future "create path from Knowledge Graph" feature — selecting resources connected by
  `PREREQUISITE` relationships and converting them into a path — is explicitly deferred.

## Consequences

**Positive**

- A single data model (graph) supports both modes — a sequential path is a graph with a
  linear constraint, not a different entity
- `ON DELETE SET NULL` on `learning_resource_id` ensures deleting a resource does not
  destroy the path structure — the node gracefully degrades to a stub
- `path-local` stubs keep the global catalog clean; only intentionally promoted nodes
  appear as catalog resources
- The roadmap.sh import delivers a fully structured path in seconds; the user
  iteratively links resources or promotes stubs over time
- Node-level progress is granular and independent from catalog resource status — a user
  can mark a node done without having marked the linked resource as completed

**Negative**

- Graph mode requires additional frontend UX (zoom, pan, Dagre layout) not needed by
  sequential mode
- The roadmap.sh import depends on the availability and stability of the raw JSON on
  GitHub — no SLA or schema versioning is guaranteed
- Stub promotion requires a two-step flow (node action → resource form → save) which
  may feel heavy for users who just want to attach a URL

## Deferred

- **Persisted node positions in graph mode**: storing `position_x`, `position_y` per
  node so manual layout survives page refresh — requires additional columns
- **Path progress dashboard**: % complete by phase, estimated time remaining
- **Path sharing between users**: public paths or shareable links
- **Import from additional sources**: LinkedIn Learning, Pluralsight, Notion
- **"Create path from Knowledge Graph"**: select resources from the Atlas View and
  convert connected edges into a path

## Rejected alternatives

**Learning Path as a direct subgraph of the Knowledge Graph (original ADR-0016 vision)**
A path whose nodes were strictly `ResourceRelationship` edges could not support stubs or
roadmap.sh imports. The two structures share resources but serve different purposes: the
knowledge graph describes semantic relationships; a learning path describes a curated
learning sequence. They are complementary, not identical.

**Separate models per mode (list vs. graph)**
Implementing `SequentialPath` and `GraphPath` as distinct entities would duplicate domain
logic and complicate the upgrade path from sequential to graph. A unified model (graph
with an optional linear constraint) is cleaner and more extensible.

**Only sequential mode in v0.9.0**
Deferred graph mode does not simplify the data model — it only defers the graph editing
UI. Since the data model is identical for both modes, the marginal cost of shipping both
UIs together is low. `@swimlane/ngx-graph` covers both the learning path graph and the
Atlas View, so the dependency pays for itself across two features.

## References

- ADR-0016: Knowledge Graph — ResourceRelationship Entity and Atlas View
- ADR-0012: Modular Application System (`learning-paths` feature module to register)
- roadmap.sh JSON source: `src/data/roadmaps/[slug]/[slug].json`
- roadmap.sh API request: github.com/kamranahmedse/developer-roadmap/issues/8118
