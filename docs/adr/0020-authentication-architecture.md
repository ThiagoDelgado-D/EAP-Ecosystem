# ADR-0020: Authentication Architecture

## Status

Accepted

## Context

EAP-Ecosystem reached v0.7.5 with a fully functional learning resource layer
but no real authentication. The existing `User` entity was designed around
a username/password model (`hashedPassword`, `emailValidationToken`,
`tokenConfirmedAt`, `tokenExpiresAt`) that was never wired to a running
auth flow — it existed only as domain scaffolding.

Before implementing authentication (v0.8.x), the architecture decisions
had to be made as a group, balancing security, simplicity for a personal
tool, and extensibility toward multi-provider support (Google, GitHub, MFA).

Several design questions were open:

- **How should sign-up vs. sign-in be handled?** A separate registration
  form adds friction and reveals whether an email is already registered.
- **How should multiple providers be supported?** Storing provider identity
  directly on `User` creates coupling and makes account linking complex.
- **How should sessions be managed?** JWTs alone cannot be revoked;
  stateless tokens are a poor fit for a tool that may run on shared devices
  or require emergency session invalidation.
- **What auth methods make sense for a personal productivity tool?**
  Password authentication adds implementation cost and a credential
  management burden with minimal benefit when passwordless alternatives exist.

## Decisions

### 1. Magic Link as the primary auth method (unified sign-in = sign-up)

A single entry point handles both new and returning users. The UI presents
one step (enter email) and one step (enter 6-digit code). The backend never
reveals whether an email is registered — the resolution of "new vs. existing
user" happens silently inside `verifySignInCode`, after the code is validated.

This eliminates enumeration risk, removes the registration form entirely, and
aligns with the pattern used by Notion and Linear for low-friction onboarding.

**Endpoints:**
- `POST /auth/sign-in/request` — generates a `SignInChallenge`, hashes the
  code, invalidates any previous pending challenge for that email, and
  dispatches the code via `EmailService`.
- `POST /auth/sign-in/verify` — validates hash, expiry, and attempt count;
  creates `User` + `Identity` if the user is new; issues a JWT access token + opaque refresh token and persists
  `Session` regardless.

### 2. `Identity` entity separated from `User`

A `User` is an application-level person. An `Identity` is a verified link
between a `User` and an external or internal authentication provider
(`magic-link`, `google`, `GitHub`).

One user can have multiple identities. Account linking (e.g., sign in with
Google on an account originally created via Magic Link) resolves cleanly by
looking up the identity's provider + subject before falling back to email
matching.

This avoids polluting `User` with provider-specific fields and supports
future providers without schema changes to the core user entity.

### 3. Opaque refresh token stored in DB with rotation and reuse detection

Access tokens are short-lived JWTs (15 minutes). Refresh tokens are
cryptographically random opaque strings stored as a SHA-256 hash in a
`Session` entity. SHA-256 is used instead of bcrypt because refresh tokens
are high-entropy random values (not user-chosen passwords), so the
brute-force resistance of bcrypt is unnecessary — and its non-determinism
would prevent O(1) equality lookup by hash. On every refresh:

1. The incoming token is hashed with SHA-256 and looked up by equality.
2. A new token pair is issued.
3. The old `Session` is replaced (rotation).
4. If a refresh token is used after it has already been rotated (reuse
   detected), the entire family is revoked (`revoke-all` on the user's
   sessions).

This allows:
- Individual session revocation (logout from one device)
- Logout everywhere (revoke all sessions)
- Future device listing (`Session` stores `userAgent` and `createdAt`)

### 4. Drop of password-related fields from `User`

The fields `hashedPassword`, `emailValidationToken`, `tokenConfirmedAt`,
and `tokenExpiresAt` are removed from the `User` entity. No real users
existed at the time of this change, making it a clean breaking change with
no migration cost.

Password-based authentication is explicitly **out of scope** for this
project. The SMTP dependency for Magic Link in self-hosted contexts (see
ADR-0019) is the accepted trade-off.

### 5. `featureConfig` and `widgetConfig` on `User` from day one

The modular system (ADR-0015) requires per-user configuration of which
features and dashboard widgets are active. These are stored directly on the
`User` entity as typed arrays rather than separate tables, avoiding premature
normalization for a personal tool where users are few.

## Implementation Plan

| Version | Scope                                                         |
|---------|---------------------------------------------------------------|
| v0.8.0  | `User` entity refactor + domain contracts for new entities + Docker |
| v0.8.1  | Magic Link end-to-end (NestJS + Angular login page)          |
| v0.8.2  | OAuth Google (+ extensible provider pattern)                 |
| v0.8.3  | JWT guards, route protection, resources scoped to user        |

## Consequences

### Positive

- No password storage means no credential leak surface.
- Unified sign-in/sign-up flow removes user friction and enumeration risk.
- `Identity` separation makes account linking and future providers additive
  changes rather than breaking ones.
- Refresh token rotation with reuse detection provides session security
  comparable to OAuth-style token flows.
- `featureConfig`/`widgetConfig` on `User` avoids a join table for a single-
  user tool while keeping the domain model clean.

### Negative

- Magic Link requires SMTP — self-hosters must configure an email provider.
  Mitigated by documenting `.env.example` thoroughly (see ADR-0019).
- Stateful refresh tokens mean the database is involved on every token
  refresh. Acceptable given the personal-tool scale; not a concern until
  multi-tenant scaling.
- Dropping `registerUser` use case and all password-related code is a
  breaking change on the domain layer. Accepted because no production users
  exist.

## Rejected Alternatives

- **Password authentication**: Adds a credential storage and hashing
  obligation, a "forgot password" flow, and brute-force protection — all
  for a personal tool where a single user controls the instance.
- **Separate sign-up and sign-in endpoints**: Reveals email existence,
  adds UI complexity, and requires a separate confirmation step.
- **Storing provider identity directly on `User`**: Works for one provider
  but requires schema migration for each additional provider. `Identity`
  is the standard pattern (used by Auth0, Supabase, Lucia).
- **JWT-only sessions (no refresh token in DB)**: Cannot be revoked.
  Acceptable for public APIs; not acceptable for a personal workspace tool.

## References

- ADR-0004: Functional use cases with explicit DI
- ADR-0010: Auth integrated within user module
- ADR-0015: Modular application system (`featureConfig`, `widgetConfig`)
- ADR-0019: Self-hosting and Docker strategy (SMTP context)
- OWASP Authentication Cheat Sheet
- OWASP Session Management Cheat Sheet
