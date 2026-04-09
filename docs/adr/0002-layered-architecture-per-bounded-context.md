# ADR-0002: Layered Architecture per Bounded Context

## Status

Accepted

## Context

EAP-Ecosystem follows Domain-Driven Design (DDD) principles, where each bounded context (learning-resource, user, recommendation) needs a clear separation of concerns between business logic, application orchestration, and infrastructure details.

The architecture needed to:

- Protect domain logic from infrastructure concerns
- Allow application logic to be tested without I/O dependencies
- Make it possible to swap infrastructure implementations (e.g. JSON files → database) without touching domain or application layers
- Enforce dependency direction: infrastructure depends on application, application depends on domain, domain depends on nothing internal

## Decision

Each bounded context is structured into three independent workspaces following a layered architecture:

```
learning-resource/
  domain/          # @learning-resource/domain
  application/     # @learning-resource/application
  infrastructure/  # @learning-resource/infrastructure
```

**Domain layer** (`@learning-resource/domain`):

- Contains entities, value objects, repository interfaces and domain types
- Depends only on `domain-lib` (shared base contracts)
- No framework dependencies, no I/O

**Application layer** (`@learning-resource/application`):

- Contains use cases that orchestrate domain logic
- Depends on `@learning-resource/domain`
- Depends on repository interfaces, never on concrete implementations

**Infrastructure layer** (`@learning-resource/infrastructure`):

- Contains concrete implementations of repository interfaces
- Depends on `@learning-resource/domain` and `infrastructure-lib`
- Currently implements persistence via `JsonStorage<T>`

## Considered Options

- **Layered architecture per bounded context** — chosen
- **Single package per bounded context** — discarded as it would mix domain logic with infrastructure concerns and make testing harder
- **Hexagonal architecture (ports and adapters)** — considered but deferred as it adds interface abstraction overhead not yet justified by the current scale

## Consequences

### Positive

- Domain and application layers can be tested in complete isolation from I/O
- Infrastructure implementations can be swapped without modifying business logic
- Dependency direction is enforced at the package level by Yarn Workspaces
- Each layer can evolve and be versioned independently

### Negative

- Each new bounded context requires creating and registering three separate workspaces
- Cross-layer imports must be managed carefully to avoid circular dependencies
- TypeScript path configuration must be maintained for each new workspace added
