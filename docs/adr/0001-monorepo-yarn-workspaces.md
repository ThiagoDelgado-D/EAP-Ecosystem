# ADR-0001: Monorepo with Yarn Workspaces

## Status

Accepted

## Context

EAP-Ecosystem is a system composed of multiple bounded contexts (learning-resource, user, recommendation) that share common libraries (domain-lib, infrastructure-lib). Each context has its own layers (domain, application, infrastructure) and the API consumes all of them.

A code organization strategy was needed that would allow:

- Sharing code between contexts without duplication
- Maintaining clear boundaries between bounded contexts
- Managing dependencies between internal packages explicitly
- Orchestrating builds, tests and type-checks in a unified way

## Decision

A monorepo structure was adopted using **Yarn 4 Workspaces** as the management tool, with the following organization:

```
EAP-Ecosystem/
  apps/
    api/                          # NestJS API
  shared/
    domain-lib/                   # Shared base types and contracts
    infrastructure-lib/           # Shared infrastructure utilities
  learning-resource/
    domain/
    application/
    infrastructure/
  user/
    domain/
    application/
  recommendation/
    domain/
    application/
```

Each workspace has its own `package.json` with a package name (`@learning-resource/domain`, etc.) and references each other using `workspace:^`.

## Considered Options

- **Monorepo with Yarn Workspaces** — chosen
- **Separate repositories (polyrepo)** — discarded due to the complexity of synchronizing changes between shared libraries and consumers
- **Monorepo with Nx or Turborepo** — discarded due to unnecessary configuration overhead at this stage of the project

## Consequences

### Positive

- Changes in `domain-lib` or `infrastructure-lib` are immediately visible to all consumers without publish/install
- A single `yarn install` installs all system dependencies
- Build, test and type-check scripts can be orchestrated from the root with `yarn workspaces foreach`
- The dependency graph between workspaces is explicit and validated by Yarn

### Negative

- TypeScript configuration requires a dual-path strategy (src for development, dist for build) to avoid `rootDir` violations during compilation
- Build order must respect the topological dependency graph between workspaces
- Adding a new bounded context requires registering the workspace in the root `package.json`
