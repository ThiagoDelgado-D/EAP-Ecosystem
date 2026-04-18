# ADR-0016: Knowledge Graph — ResourceRelationship Entity and Atlas View

## Status

Accepted

## Context

The current domain model treats learning resources as independent, flat items
linked only by shared topics (tags). This is sufficient for a catalog, but
insufficient for representing how knowledge actually builds: some resources are
prerequisites of others, some concepts are alternatives to each other, and some
topics only make sense after foundational material is understood.

Inspiration from Obsidian's bidirectional link graph — where documents become
nodes connected by explicit relationships, making the structure of knowledge
visible and navigable — suggests a similar model applied to learning resources
could be genuinely useful. Rather than organizing by tags, users could navigate
their knowledge by traversing a graph: "I know this concept, it connects to
these three others, and unlocking this one requires completing that one first."

This model also underpins the **Learning Paths** feature (v0.9.0). A Learning
Path is an ordered, directed subgraph of the broader knowledge graph — not a
separate data structure, but a curated view of it.

The **Atlas View** shown in the application designs renders this graph as an
interactive force-directed visualization where nodes are resources and edges
are relationships, with a detail panel opening on node selection.

## Decision

### Domain — `ResourceRelationship` entity

Add a `ResourceRelationship` domain entity representing a directed edge between
two learning resources:

```typescript
export type RelationshipType =
  | "PREREQUISITE" // source must be completed before target
  | "BUILDS_ON" // target deepens understanding of source
  | "RELATED" // thematically connected, no ordering implied
  | "ALTERNATIVE"; // target covers the same concept via a different medium

export interface ResourceRelationship {
  id: UUID;
  sourceId: UUID; // the "from" resource
  targetId: UUID; // the "to" resource
  type: RelationshipType;
  note?: string; // optional user annotation on the relationship
  createdAt: Date;
}
```

Relationships are **user-created** — not inferred automatically. Auto-inference
based on shared topics is deferred until there is sufficient data to validate
its usefulness.

### Repository port

```typescript
export interface IResourceRelationshipRepository {
  save(relationship: ResourceRelationship): Promise<void>;
  delete(id: UUID): Promise<void>;
  findBySource(sourceId: UUID): Promise<ResourceRelationship[]>;
  findByTarget(targetId: UUID): Promise<ResourceRelationship[]>;
  findNeighbors(resourceId: UUID): Promise<ResourceRelationship[]>;
  findAll(): Promise<ResourceRelationship[]>;
}
```

`findNeighbors` returns all relationships where the resource appears as either
source or target — used to build the local neighborhood graph for the Atlas View.

### API endpoints

```
POST   /api/v1/resource-relationships          — create a relationship
DELETE /api/v1/resource-relationships/:id      — remove a relationship
GET    /api/v1/resource-relationships          — all relationships (Atlas View)
GET    /api/v1/resource-relationships/:id/neighbors — neighbors of a resource
```

### Frontend — Atlas View

The Atlas View renders the knowledge graph as a force-directed visualization
using **D3.js** (`d3-force`). Each resource is a node; each relationship is
a directed edge with a label indicating its type. Clicking a node opens a
detail panel (same data as `ResourceDetailComponent`) without navigating
away from the graph.

Visual encoding:

- Node size: proportional to number of relationships (more connected = larger)
- Node color: derived from `status` (Pending = slate, InProgress = blue,
  Completed = emerald)
- Edge style: solid for `PREREQUISITE` / `BUILDS_ON`, dashed for `RELATED` /
  `ALTERNATIVE`
- Edge direction: arrow indicating source → target

The Atlas View is registered as the `knowledge-graph` feature module
(see ADR-0016). It is only active when the user has enabled the feature.

### Relationship to Learning Paths

A Learning Path is a **named, ordered subset** of the knowledge graph. It
references resources by ID and adds ordering metadata (`sequenceIndex`) and
grouping metadata (`phase`, `milestone`). Learning Paths do not duplicate the
relationship graph — they reference resources that may or may not have
`ResourceRelationship` entries between them.

This means a resource can exist in multiple Learning Paths and simultaneously
be part of the broader knowledge graph. The two structures are complementary,
not redundant.

### Database

`ResourceRelationship` maps to a `resource_relationships` table:

```sql
CREATE TABLE resource_relationships (
  id          uuid PRIMARY KEY,
  source_id   uuid NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  type        varchar(20) NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_loop CHECK (source_id <> target_id),
  UNIQUE (source_id, target_id, type)
);
```

The `UNIQUE` constraint on `(source_id, target_id, type)` prevents duplicate
relationships of the same type between the same pair of resources. A pair can
have at most one `PREREQUISITE` and one `RELATED` relationship, for example.

## Consequences

**Positive**

- Resources become navigable knowledge nodes, not just catalog items
- Learning Paths and the Knowledge Graph are complementary — building
  one does not block or conflict with the other
- The `note` field allows users to annotate why a relationship exists,
  making the graph personally meaningful
- D3.js integrates cleanly with Angular via a directive wrapping the SVG
  container; no full library rewrite needed
- The `CASCADE` delete on `source_id` and `target_id` keeps the graph
  consistent when resources are deleted

**Negative**

- D3.js force simulation performance degrades with very large graphs
  (>500 nodes rendered simultaneously). Graph virtualization or clustering
  will be needed at scale — deferred.
- User-created relationships require intentional curation. The graph will
  be sparse initially; value is realized over time as the user builds
  connections. This is acceptable — the same is true of Obsidian.
- The `findAll()` endpoint returns the full graph for the Atlas View. A
  pagination or windowing strategy will be needed when the graph grows
  large — deferred to when it becomes a performance issue.

## Deferred

- **Auto-inference of relationships** from shared topics or co-occurrence
  in Learning Paths — deferred until there is enough data to evaluate quality
- **Graph clustering / community detection** for the full Knowledge Map view
  (grouping related resources into visual clusters) — v0.10.x or later
- **Graph virtualization** for large node counts — deferred
- **Bidirectional link UI** (showing incoming relationships in the resource
  detail view) — planned for the same version as Atlas View, but lower priority
  than the graph itself

## Rejected Alternatives

- **Graph database (Neo4j, ArangoDB)**: The relationship graph in EAP is
  relatively simple — no multi-hop traversal, no complex path queries. A
  relational `resource_relationships` table with a self-join handles all
  current query patterns. Introducing a second database engine adds operational
  complexity without proportional benefit.
- **Embedding relationships in the LearningResource entity**: Creates a
  circular dependency in the domain and complicates repository contracts.
  A dedicated entity with its own repository is the correct bounded context
  boundary.
- **Topic-based implicit graph**: Topics already exist as shared metadata.
  A resource graph built only from shared topics produces noise (too many
  spurious connections) and does not capture directional knowledge dependency.
  Explicit user-created relationships are more meaningful.

## References

- ADR-0012: Modular Application System (knowledge-graph feature module)
- Roadmap: v0.9.0 — Learning Paths and Knowledge Graph
