# ADR-0003: Defense-in-Depth Validation Strategy

## Status

Accepted

## Context

EAP-Ecosystem exposes data entry points at multiple levels: HTTP endpoints (via NestJS controllers and DTOs), use cases in the application layer, and potentially direct programmatic calls from scripts, tests, or future consumers.

Relying solely on a single validation layer (e.g., `class-validator` at the HTTP boundary) creates a false sense of security. If a use case is called directly — from a seed script, a test, a CLI tool, or a future non-HTTP interface — no validation would occur, allowing malformed or malicious data to reach the domain.

The system needed a validation strategy that:

- Guarantees data integrity regardless of where a use case is invoked from
- Keeps domain logic decoupled from HTTP-specific validation mechanisms
- Provides full control over what types and values are considered valid
- Does not introduce external dependencies into the domain layer

## Decision

A two-layer validation strategy was adopted:

**Layer 1 — HTTP boundary (`class-validator` + NestJS DTOs):**
Validates incoming HTTP requests at the controller level before they reach the application layer. This layer is framework-specific and handles concerns like request shape, required fields, and basic type coercion.

**Layer 2 — Application boundary (custom validators in `domain-lib`):**
Each use case defines its own `ValidationSchema` using the custom field validator system built into `domain-lib`. This validation runs at the start of every use case execution, independently of how the use case was invoked.

```typescript
export const addResourceSchema =
  createValidationSchema<AddResourceRequestModel>({
    title: stringField("Title", { required: true, maxLength: 500 }),
    url: urlField("Url", { required: false }),
    resourceTypeId: uuidField("ResourceTypeId", { required: true }),
    topicIds: arrayField<UUID>("TopicIds", { required: true, minLength: 1 }),
    difficulty: enumField(Object.values(DifficultyType), "Difficulty", {
      required: true,
    }),
    estimatedDurationMinutes: numberField("EstimatedDuration", {
      required: true,
      positive: true,
      integer: true,
    }),
  });
```

The custom validator system was built from scratch in `domain-lib` to avoid introducing external validation libraries as dependencies into the domain layer, keeping it framework-agnostic and fully under the team's control.

## Considered Options

- **Single validation layer (class-validator only)** — discarded because it only protects the HTTP entry point, leaving use cases unprotected when called from other contexts
- **class-validator in domain layer** — discarded because it introduces a framework-specific dependency into domain-lib and relies on decorators, which couple validation to class definitions
- **Zod or Yup in domain layer** — discarded to avoid external dependencies in the shared domain library; a custom system gives full control over validation behavior and error messaging
- **Two-layer strategy with custom domain validators** — chosen

## Consequences

### Positive

- Use cases are protected regardless of the caller: HTTP controller, seed script, test, CLI, or future consumer
- The domain validation layer is framework-agnostic and has zero external dependencies
- Validation errors are returned as values (`InvalidDataError`) rather than thrown exceptions, making error handling explicit and predictable
- The validator API is consistent across all field types (`stringField`, `numberField`, `enumField`, etc.) making schemas easy to read and maintain
- Full control over error messages, validation rules, and behavior without being constrained by third-party library decisions

### Negative

- Maintaining a custom validation system requires more internal effort than relying on a battle-tested library
- Developers must learn the custom validator API in addition to `class-validator`
- Some advanced validation scenarios may require building new field types or options that would be available out-of-the-box in libraries like Zod
