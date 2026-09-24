# ADR-0026: `CurrentUser` as an Injected Dependency

## Status

Accepted

## Context

ADR-0004 established functional use cases that receive a `Dependencies`
object (repositories, services) and a `RequestModel` (the caller's input),
validated at the start of every use case per ADR-0003's defense-in-depth
strategy.

The ongoing data-isolation work (scoping `LearningResource` to its owner)
put `userId` inside `RequestModel`, validated by the same schema as
user-supplied fields (`uuidField("UserId", { required: true })`). This
mirrors the pattern already used by every `learning-path` and `pomodoro`
use case that needs ownership checks — roughly 30 use cases across two
modules do this today.

That placement conflates two different things the request carries:

- **What the caller is asking for** — the payload, fully untrusted,
  validated because it can be anything.
- **Who is asking** — resolved once at the HTTP boundary by
  `JwtAuthGuard` + `@CurrentUserId()` from a verified JWT, never supplied
  by the caller in a form a use case needs to distrust the same way.

Putting both in `RequestModel` means every controller manually spreads
`{ userId, ...dto }` before calling a use case, and every DTO shape
implicitly excludes `userId` by convention rather than by the type system
making it structurally impossible to confuse the two.

Analyzing that scenario surfaced two viable directions. One is to keep
`userId` where the codebase already puts it — inside `RequestModel`,
validated like any other field — and accept the conflation as a known,
cheap trade-off. The other is to treat identity as infrastructure the
caller is trusted with, resolved once per request and passed to every use
case as part of its dependencies, the same way `cryptoService` or a
repository instance already is, never as part of the validated payload.

The second direction costs more right now — it's a real, multi-module
refactor instead of a one-line addition per use case — but it pays off at
this specific point in the project: EAP-Ecosystem has no permission model
yet, and user-scoped resources are exactly the shape such a system would
need to check against. Settling where identity lives now, while the
data-isolation work is already touching every affected use case, avoids
re-touching the same ~30 use cases a second time once permissions become
a real requirement instead of re-deriving this decision under more
pressure later.

## Decision

A `CurrentUser` entity — not a bare `UUID` — moves from `RequestModel` to
`Dependencies` for every use case that needs to know who is calling it.

```typescript
// shared/domain-lib/src/entities/current-user.ts
export interface CurrentUser {
  id: UUID;
}
```

It's intentionally minimal today: the JWT only carries `sub` (the user
id), and EAP-Ecosystem has no role or permission model yet. It's an
object rather than a primitive specifically so it can grow — a `role` or
`permissions` field would extend this one interface instead of changing
every use case's dependency type from `UUID` to something else a second
time.

```typescript
export interface CreateLearningPathDependencies {
  learningPathRepository: ILearningPathRepository;
  cryptoService: CryptoService;
  currentUser: CurrentUser;
}

export interface CreateLearningPathRequest {
  title: string;
  description?: string;
  mode: PathMode;
  source?: PathSource;
  sourceSlug?: string;
}

export const createLearningPath = async (
  { learningPathRepository, cryptoService, currentUser }: CreateLearningPathDependencies,
  request: CreateLearningPathRequest,
) => {
  const validated = await createLearningPathSchema(request);
  // ...
  const path: LearningPath = { userId: currentUser.id, ...validated, /* ... */ };
  return learningPathRepository.save(path);
};
```

`RequestModel`'s validation schema no longer declares a `userId` field —
it only validates what the caller actually controls. Ownership-check
helpers (`verifyLearningPathOwnership`, `verifyLearningResourceOwnership`,
`verifySessionOwnership`) take `currentUser` from dependencies and compare
`currentUser.id` against the resource's `userId` the same way.

At the HTTP boundary, `JwtAuthGuard` is unchanged — it still only verifies
the JWT and sets `req.userId`. A new `@CurrentUser()` param decorator
wraps that into `{ id: req.userId }`; it sits alongside the existing
`@CurrentUserId()` decorator rather than replacing it, since modules not
yet migrated under this ADR still use the old one:

```typescript
@Post()
async create(@Body() dto: CreateLearningPathDto, @CurrentUser() currentUser: CurrentUser) {
  return createLearningPath({ learningPathRepository, cryptoService, currentUser }, dto);
}
```

This reconciles with ADR-0003: `currentUser` stops being "payload that
happens to be trusted" and becomes what it actually is — infrastructure
supplied by whoever wires the call, in the same class as `cryptoService`
or a repository instance. Neither of those is schema-validated at the use
case boundary today, and `currentUser` doesn't need to be either once
it's no longer caller-supplied content. A use case invoked directly from
a script or test is trusted to pass a real `CurrentUser`, the same way
it's trusted to pass a real repository implementation.

A generic, centrally-enforced execution wrapper — auth-required flags and
declarative permission checks run before every use case body, behind one
shared entry point — is **not** part of this decision. That would replace
ADR-0004's explicit, per-use-case dependency wiring with an implicit
convention enforced by a shared runner, which is a bigger structural
change than moving one field. It's worth revisiting once a real
permission model exists — this ADR only settles where identity lives, not
how authorization gets enforced.

## Rollout

Applied module by module, each its own PR with its specs updated
alongside the production code — not a single sweeping rename across the
codebase:

| Module                                  | Status                          |
|------------------------------------------|----------------------------------|
| `learning-resource` (resource use cases) | First module, done under this ADR |
| `learning-path`                          | Not started                     |
| `pomodoro` (sessions, breaks)             | Not started                     |

## Consequences

### Positive

- A DTO's shape and its validation schema fully describe what the caller
  controls — no implicit "don't validate this one field, it's injected
  elsewhere" convention to remember.
- Controllers can't accidentally forward a client-supplied `userId` for a
  field that's supposed to come from the verified session, because
  `RequestModel` no longer has a slot for it to land in.
- Ownership checks read identity from the same place regardless of which
  use case they're in, which is what a future permission check would
  need to hook into.

### Negative

- Touches every use case that currently validates `userId` in its
  payload (~30 across `learning-resource` and `pomodoro`) — a real,
  multi-PR refactor, not a one-file change.
- Two conventions (`userId`-in-payload and `currentUser`-in-dependencies)
  coexist until the rollout finishes; a reader jumping between an
  unmigrated and a migrated use case sees different shapes for the same
  concept.

## Considered Options

- **Leave `userId` in `RequestModel`, validated like any other field** —
  what every existing use case does today. Rejected because it's the
  problem this ADR exists to fix, and because it gives a future
  permission check no single seam to hook into.
- **Build a centralized use-case execution wrapper now** (declarative
  auth-required/permission checks enforced before every use case body,
  behind one generic entry point) — rejected for now as too large a
  change to take on before there's an actual permission model to enforce;
  revisit ADR-0004 then instead of guessing at its shape today.

## References

- ADR-0003: Defense-in-depth validation strategy
- ADR-0004: Functional use cases with explicit dependency injection
- ADR-0020: Authentication architecture (`JwtAuthGuard`, `@CurrentUserId()`)
