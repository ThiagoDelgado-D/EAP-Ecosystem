# ADR-0005: Dual-Path TypeScript Strategy for Monorepo Builds

## Status

Accepted

## Context

In a Yarn Workspaces monorepo where each workspace is an independent TypeScript package, cross-workspace imports need to be resolved differently depending on the context:

- **During development and type-checking**: the editor and `tsc --noEmit` should resolve imports from `src/` to get live feedback on source changes without requiring a prior build step
- **During compilation**: `tsc` must resolve imports from `dist/` because the compiled output of each workspace is what gets consumed by its dependents, and mixing `src/` references during a build violates TypeScript's `rootDir` constraint

Using a single `tsconfig.json` with paths pointing to `src/` causes `TS6059` and `TS6307` errors during build because TypeScript detects files outside the declared `rootDir`. Using paths pointing to `dist/` breaks the editor experience because `dist/` doesn't exist until a build has run.

## Decision

Each workspace maintains two TypeScript configuration files with distinct responsibilities:

**`tsconfig.json` — development and type-checking:**

```json
{
  "compilerOptions": {
    "baseUrl": "../../",
    "paths": {
      "domain-lib": ["shared/domain-lib/src/index.ts"],
      "infrastructure-lib": ["shared/infrastructure-lib/src/index.ts"],
      "@learning-resource/domain": ["learning-resource/domain/src/index.ts"]
    },
    "noEmit": true
  }
}
```

**`tsconfig.build.json` — compilation:**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "baseUrl": "../../",
    "paths": {
      "domain-lib": ["shared/domain-lib/dist/index.d.ts"],
      "infrastructure-lib": ["shared/infrastructure-lib/dist/index.d.ts"],
      "@learning-resource/domain": ["learning-resource/domain/dist/index.d.ts"]
    }
  },
  "exclude": ["dist", "node_modules"]
}
```

Additional rules that must be respected across all workspaces:

- `composite: true` goes only in `tsconfig.build.json`, never in the base `tsconfig.json`
- `rootDir: "src"` goes only in `tsconfig.build.json`
- All workspaces use `tsc -p tsconfig.build.json` (not `tsc --build`) to avoid project references complexity
- No `references` array in any `tsconfig.build.json` — build order is handled by Yarn's topological `foreach`

## Considered Options

- **Single tsconfig.json with src paths** — discarded because it causes `TS6059`/`TS6307` errors during build when TypeScript follows paths outside `rootDir`
- **Single tsconfig.json with dist paths** — discarded because it breaks editor experience and type-checking when `dist/` hasn't been built yet
- **TypeScript project references (`tsc --build`)** — discarded because it requires `composite: true` on all referenced projects and adds significant configuration complexity that conflicted with the ESM setup
- **Dual-path strategy with separate tsconfig.build.json** — chosen

## Consequences

### Positive

- Editor and type-checking always work from source without requiring a prior build
- Compilation correctly resolves dependencies from built outputs, avoiding `rootDir` violations
- Build order is explicit and controlled by Yarn's topological workspace ordering
- The pattern is consistent and replicable across all workspaces

### Negative

- Every new workspace must implement both configuration files following this pattern
- Paths must be kept in sync across both files when workspaces are added or renamed
- Developers unfamiliar with the pattern may introduce `rootDir` violations by modifying only one of the two files
- The `dist/` outputs of dependency workspaces must exist before a dependent workspace can be built, requiring correct topological build order
