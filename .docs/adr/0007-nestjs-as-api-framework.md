# ADR-0007: NestJS as API Framework

## Status

Accepted

## Context

EAP-Ecosystem requires an HTTP API layer to expose the application's use cases to external consumers. The framework chosen for this layer needed to:

- Have strong TypeScript support out of the box
- Provide a structured, opinionated architecture that scales with the project
- Support dependency injection to wire repositories and services into the use case adapters
- Be widely adopted with an active ecosystem and long-term maintenance guarantees
- Integrate cleanly with the existing monorepo structure without imposing its conventions on the domain or application layers

## Decision

**NestJS** was adopted as the API framework for `apps/api`.

NestJS is used exclusively as the **infrastructure and delivery layer** — it handles HTTP routing, request parsing, dependency injection, and middleware. It does not reach into the domain or application layers. Use cases remain plain functions; NestJS services act only as thin adapters that wire the DI container's instances into those functions.

The health module illustrates the intended boundaries:

```
HealthController  →  HealthService  →  addResource() (use case function)
    (NestJS)           (NestJS DI)        (application layer)
```

NestJS-specific concerns (decorators, pipes, guards, interceptors) stay within `apps/api` and never cross into `learning-resource/application` or `shared/`.

## Considered Options

- **Express** — seriously considered given prior familiarity and production experience with the framework. However, NestJS was chosen deliberately — not as a casual experiment, but as a decision to apply its structured architecture in a DDD context and validate how well its conventions (modules, DI, decorators) map to the layered design of EAP-Ecosystem. The technical tradeoffs were evaluated and the structured approach NestJS provides was deemed more appropriate for a system with multiple bounded contexts and explicit layer boundaries.
- **Fastify** — discarded primarily due to its plugin-based architecture and lower-level API surface, which would require more manual setup to achieve the same structural guarantees NestJS provides out of the box. Its performance advantages over NestJS are not a priority at this stage of the project, where developer experience and architectural clarity outweigh raw throughput.
- **NestJS** — chosen for its opinionated structure, first-class TypeScript support, built-in DI container, and large ecosystem

## Consequences

### Positive

- Built-in DI container handles wiring of repositories and services without additional libraries
- Decorator-based routing and pipes provide a clean, readable controller layer
- Strong TypeScript integration aligns with the monorepo's strict type-safety requirements
- Large ecosystem provides ready-made solutions for guards, interceptors, pipes, and OpenAPI documentation
- Clear module boundaries enforce separation between HTTP concerns and business logic

### Negative

- NestJS conventions (decorators, modules, providers) add learning overhead for developers unfamiliar with the framework
- The DI container introduces a layer of indirection that can make dependency resolution harder to trace compared to explicit wiring
- NestJS's opinionated structure can feel heavy for simple endpoints where plain Express would suffice
- Decorator-based metadata relies on `experimentalDecorators` and `emitDecoratorMetadata`, which add compiler complexity
