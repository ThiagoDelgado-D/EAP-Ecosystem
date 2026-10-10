# ADR-0030: Web Client Shares the Domain's Error Types

**Date:** 2026-10-10

## Status

Proposed

## Context

Every use case returns its errors as values. Each application package
derives the union of its errors from its use cases' return types
(`UserDomainError = UseCaseErrors<UserUseCaseMap>`, and the same in
learning-resource, pomodoro and recommendation), and the API combines them
into one union whose status map must list every error or the API fails to
compile.

That guarantee stops at the API. The web client never reads the error a
response carries. Around a hundred `catch` blocks each write their own
generic message ("Failed to load resources", "Failed to send sign-in code"),
and only three places look at the response at all, each by comparing a
status number by hand. A learner who asks for a sign-in code too soon gets a
429 that says exactly how long to wait, and sees "Failed to send sign-in
code. Please try again." Nothing connects a new error on the server to a
message on the client, and nothing flags a message for an error that no
longer exists.

The web client can't close that gap by itself because it doesn't import
the packages that define the errors: it talks to the API only over HTTP and
keeps its own copy of every shape it reads.

The API also has no single error format. What reaches the client depends on
where the error was raised:

| Source | Body |
|---|---|
| Use case errors (`toHttpException`) | `{ error: "X_ERROR", ...context }` |
| Per-IP rate limit guard | `{ error: "TOO_MANY_REQUESTS_ERROR" }` |
| DTO validation (`ValidationPipe`) | `{ statusCode: 400, message: [...], error: "Bad Request" }` |
| Framework exceptions (e.g. `UnauthorizedException`) | `{ statusCode: 401, message: "Unauthorized" }` |
| Anything unhandled | `{ message: "Internal server error" }` |

A client can't interpret errors reliably while the same field means a code
in one response, a status phrase in another, and is missing in a third.

## Decision

### The web client imports the error types from the application packages

`apps/web` may import **types** from the application packages and from
`domain-lib`, with `import type` only. It still never imports their values:
no use cases, no error classes, nothing that ends up in the bundle. Every
request still goes over HTTP.

The error classes live in three places: generic ones (`NotFoundError`,
`ForbiddenError`, `ValidationError`, `TooManyRequestsError`,
`UnexpectedError`, …) in `domain-lib`, and the rest in each bounded
context's application package, next to the use cases that return them.
The web client doesn't import those classes one by one. Each application
package already exports the union of every error its use cases return,
derived from its use case map with `UseCaseErrors`, and that union already
includes the generic errors those use cases return:

| Package | Error unions it exports |
|---|---|
| `@user/application` | `UserDomainError` |
| `@learning-resource/application` | `LearningResourceDomainError`, `LearningPathDomainError`, `LearningPathNodeDomainError`, `LearningPathEdgeDomainError`, `TopicDomainError` |
| `@pomodoro/application` | `PomodoroDomainError` |
| `@recommendation/application` | `RecommendationDomainError` |

These are the same unions `apps/api` combines into `AppDomainError` for
its status map. The web client combines them the same way and adds the
errors raised outside use cases, which come from `domain-lib`:

```ts
import type { UserDomainError } from "@user/application";
import type {
  LearningResourceDomainError,
  LearningPathDomainError,
  LearningPathNodeDomainError,
  LearningPathEdgeDomainError,
  TopicDomainError,
} from "@learning-resource/application";
import type { PomodoroDomainError } from "@pomodoro/application";
import type { RecommendationDomainError } from "@recommendation/application";
import type {
  TooManyRequestsError,
  UnauthorizedError,
  UnexpectedError,
} from "domain-lib";

export type AppDomainError =
  | UserDomainError
  | LearningResourceDomainError
  | LearningPathDomainError
  | LearningPathNodeDomainError
  | LearningPathEdgeDomainError
  | TopicDomainError
  | PomodoroDomainError
  | RecommendationDomainError
  | TooManyRequestsError
  | UnauthorizedError
  | UnexpectedError;

export type AppErrorName = AppDomainError["name"];
```

A new error in an existing use case reaches the web client with no change
to this file, because it enters its package's union. A new use case map or
bounded context means adding its union here and in the API.

`apps/web` lists these five packages as workspace dev dependencies, so the
compiler can resolve their declaration files. Their declarations reference
their own domain packages, which resolve through the same workspace. None
of them reaches the bundle, since every import is type-only.

A lint rule enforces the boundary: importing from these packages is an
error unless the import is type-only. The web client has no linter today,
so this adds one, configured with that rule alone.

### Every error response uses one format

The global exception filter becomes the single place that writes error
bodies. Every body is `{ error: name, ...context }`, with `name` from
`AppDomainError`:

- Use case errors pass through as they are today.
- DTO validation failures become `VALIDATION_ERROR`, the error the use case
  validators already return, with the failing fields in its context.
- Framework exceptions map by status to errors that already exist in
  `domain-lib`: 403 to `FORBIDDEN_ERROR`, 404 to `NOT_FOUND_ERROR`. A 401
  becomes `UNAUTHORIZED_ERROR`, a new error class in `domain-lib`.
- The rate limit guard returns `TOO_MANY_REQUESTS_ERROR` with
  `retryAfterSeconds`, the same body as the per-email limit, besides the
  `Retry-After` header.
- Anything else becomes `UNEXPECTED_ERROR` with status 500.

The errors raised outside use cases, `UNAUTHORIZED_ERROR`,
`TOO_MANY_REQUESTS_ERROR` and `UNEXPECTED_ERROR`, join the union on both
sides, so the format covers every response and the client's union covers
every name it can receive.

### Error context is typed

`BaseError` takes the type of its context as a second type parameter, and
every error that carries context declares it. The client reads an error's
context through that type, for example `retryAfterSeconds` on
`TOO_MANY_REQUESTS_ERROR`, instead of an untyped record.

### The web client interprets errors in one layer

- **Normalizing.** An HTTP interceptor turns every failed response into an
  `ApiError`: a value discriminated by the error's `name`, carrying its
  status and its typed context. A response whose body can't be read, or
  whose name the client doesn't know, becomes `UNEXPECTED_ERROR`. That can
  happen when the API is deployed ahead of an open tab. A request that never
  reached the server becomes `NETWORK_ERROR`, a client-only name.
- **Messages.** One map gives every error its user-facing text, typed as a
  record over the union's names. An error with no message, or a message for
  an error that no longer exists, fails the web client's build.
- **Notifying.** A service shows an error's message as a toast by default.
  A screen that needs a different presentation, such as an inline message
  under a form field, handles the `ApiError` itself.

Existing `catch` blocks move to this layer one feature at a time.

## Consequences

### Positive

- Adding, renaming or removing an error in any use case fails the web
  client's build until its messages agree. Errors can't be silently
  dropped, and stale messages can't accumulate.
- The guarantee comes from the unions the use cases already produce. There
  is no second list of errors to keep in sync.
- Every error response has one format, whatever raised it.
- Learners see what actually went wrong, including how long to wait after
  a rate limit, instead of a generic failure.
- Type-only imports leave no domain code in the web client's bundle.

### Negative

- The web client's build now depends on the application packages being
  built first, as the API's already does.
- `BaseError` gains a type parameter, and every error that carries context
  has to declare its type.
- The union of all errors is assembled twice, in the API and in the web
  client. Both are checked against the packages, but a new bounded context
  has to be added to both.
- Changing the bodies of validation, framework and unhandled errors changes
  the API's responses for every client. The web client is the only one
  today.
- The web client gains a linter, used for one rule for now.
- Until every feature has moved to the new layer, some screens still show
  their own generic messages.

## Rejected Alternatives

- **Hand-maintained list of errors in the web client** — rejected. Nothing
  connects it to the API, so a new error shows the generic message and a
  removed one leaves a dead message behind, with no signal either way.
- **A separate contract package that both sides import** — rejected. It
  adds a second list of errors that the API would have to check against its
  own unions, when the application packages already are the source of
  those unions.
- **Importing the error classes at runtime** — rejected. It would allow
  `instanceof` checks on the client, but it bundles every application
  package into the web client and needs a registry of constructors to
  rebuild each error. Discriminating by `name` gives the same type safety.
- **Generating the contract from an OpenAPI description** — rejected. The
  API doesn't describe its error responses in OpenAPI today, and doing so
  would add a generator and a description to maintain for what the existing
  types already provide.
- **Use case errors only** — rejected. Validation, framework and unhandled
  errors would keep their own formats and stay outside every check, which
  is the gap this decision exists to close.
- **Sharing request and response types too** — deferred. It would bring the
  same guarantee to every endpoint's payloads, but it means replacing the
  models the web client defines by hand. The type-only boundary set here
  already allows it later.

## References

- ADR-0001: Monorepo with Yarn workspaces
- ADR-0002: Layered architecture per bounded context
- ADR-0003: Defense-in-depth validation strategy
- ADR-0004: Functional use cases with explicit DI
