# ADR-0004: Functional Use Cases with Explicit Dependency Injection

## Status

Accepted

## Context

The application layer needs a pattern for implementing use cases that is testable, framework-agnostic, and explicit about its dependencies. Common alternatives include class-based use cases with constructor injection (often tied to a DI framework like NestJS's IoC container) or service classes grouping multiple operations.

The pattern needed to:

- Make dependencies explicit and visible at the call site
- Allow use cases to be tested without a DI container or framework setup
- Keep the application layer decoupled from NestJS or any specific framework
- Handle errors in a predictable, type-safe way without relying on exceptions

## Decision

Use cases are implemented as plain async functions that receive their dependencies as a first argument and the request model as a second:

```typescript
export const addResource = async (
  {
    learningResourceRepository,
    resourceTypeRepository,
    topicRepository,
    cryptoService,
  }: AddResourceDependencies,
  request: AddResourceRequestModel,
): Promise<void | InvalidDataError | NotFoundError> => {
  const validationResult = await addResourceSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  // ...domain logic
};
```

Each use case defines:

- A `Dependencies` interface listing the repository and service contracts it needs
- A `RequestModel` interface describing the input data shape
- A return type that explicitly enumerates possible error outcomes as values

Errors are returned as typed values rather than thrown as exceptions. This makes the full range of outcomes visible in the function signature and forces callers to handle each case explicitly.

NestJS services act as thin adapters that wire the DI container's instances into the functional use case:

```typescript
@Injectable()
export class LearningResourceService {
  constructor(
    private readonly learningResourceRepository: ILearningResourceRepository,
    private readonly resourceTypeRepository: IResourceTypeRepository,
    private readonly topicRepository: ITopicRepository,
    private readonly cryptoService: CryptoService,
  ) {}

  addResource(request: AddResourceRequestModel) {
    return addResource(
      {
        learningResourceRepository: this.learningResourceRepository,
        resourceTypeRepository: this.resourceTypeRepository,
        topicRepository: this.topicRepository,
        cryptoService: this.cryptoService,
      },
      request,
    );
  }
}
```

## Considered Options

- **Class-based use cases with constructor injection** — discarded because it couples the application layer to the DI framework and requires more boilerplate to test
- **Service classes grouping multiple use cases** — discarded because it obscures dependencies and makes individual use cases harder to test in isolation
- **Functional use cases with explicit dependency injection** — chosen

## Consequences

### Positive

- Dependencies are explicit in the function signature — no hidden coupling through a container
- Use cases can be tested by passing mock implementations directly, without any DI framework setup
- Each use case is a single-responsibility function, easy to locate, read, and reason about
- Error outcomes are part of the type signature, making it impossible to ignore failure cases
- The application layer has zero coupling to NestJS — it can be reused with any framework or called directly

### Negative

- NestJS services are required as a thin adapter layer to bridge the DI container with the functional use cases, adding a small amount of indirection
- Developers unfamiliar with this pattern may expect class-based use cases as is conventional in NestJS applications
- As the number of dependencies grows, the `Dependencies` interface and the wiring in the NestJS service can become verbose
