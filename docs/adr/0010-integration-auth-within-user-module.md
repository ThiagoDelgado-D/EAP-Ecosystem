# ADR-0010: Integration of Authentication and Authorization within User Module

## Status

Accepted

## Context

The EAP-Ecosystem project is developing bounded contexts progressively, starting with learning-resource and now focusing on the user module. Authentication and authorization (auth) are critical functionalities for user management, including registration, login, email verification, and permissions. However, auth could grow independently (e.g., support for OAuth, MFA) and potentially be reused across modules.

The current architecture follows Clean Architecture with domain/application/infrastructure layers per module, and shared libraries for common utilities. The user entity already includes auth-related fields (hashedPassword, emailVerified), indicating tight coupling.

A decision was needed on how to structure auth to balance simplicity for initial development, maintainability, and future scalability, while aligning with progressive development.

## Decision

Integrate authentication and authorization primarily within the user module initially, following a hybrid approach:

- **Core auth logic** (use cases like RegisterUser, AuthenticateUser) resides in user/application.
- **Common services** (e.g., password hashing, JWT token management, email sending) are extracted to shared/infrastructure-lib for reusability.
- **Domain interfaces** (e.g., IUserRepository with auth methods) stay in user/domain.
- **Infrastructure implementations** (e.g., TypeORM for user persistence, concrete email service) in user/infrastructure, using shared services.

If auth complexity grows significantly, refactor parts (e.g., move token management to a dedicated auth module) without breaking the architecture.

This allows starting simple, building on the existing user entity, and scaling via shared services or module separation.

## Considered Options

- **Full Integration in User Module** — Auth as part of user, all in one place. Simple but risks bloating the module.
- **Separate Auth Module** — Independent auth module with its own layers. Clean separation but adds complexity early, potentially delaying user development.
- **Hybrid with Shared Services** — Integrate in user but extract common services to shared. Balances simplicity and scalability — chosen.

## Consequences

### Positive
- **Simplicity for Initial Development**: Builds directly on existing user entity, aligns with progressive module development.
- **Reusability**: Shared services (e.g., email, hashing) can be used by other modules without duplication.
- **Scalability**: Easy to refactor if auth grows (e.g., extract to separate module).
- **Clean Architecture Compliance**: Maintains layer separation, with shared as cross-cutting concerns.

### Negative
- **Potential Coupling**: If auth logic stays in user, other modules might depend on user indirectly.
- **Refactor Overhead**: If auth expands, moving code requires careful dependency management.
- **Shared Bloat Risk**: Over-reliance on shared/infrastructure-lib could make it a catch-all.

### Mitigations
- Regularly review module boundaries; use Nx for dependency visualization.
- Start with minimal services in shared, expand only as needed.
- Document integration points for future refactoring.