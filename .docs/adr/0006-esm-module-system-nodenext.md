# ADR-0006: ESM as Module System with NodeNext Resolution

## Status

Accepted

## Context

JavaScript historically used CommonJS (CJS) as its module system in Node.js environments. The ecosystem has been progressively migrating toward native ECMAScript Modules (ESM), which is the standard module system defined by the language specification.

EAP-Ecosystem needed to choose a module system that would:

- Align with the direction of the Node.js and TypeScript ecosystems
- Work consistently across all workspaces in the monorepo
- Support modern features like `import.meta.url` for file-relative path resolution
- Be compatible with the chosen tooling (Vitest, tsx, NestJS)

The decision carries significant implications across the entire monorepo — it is not a per-workspace choice but a system-wide commitment.

## Decision

The entire monorepo adopts **ESM as the module system**, configured as follows:

**Every workspace `package.json`:**

```json
{
  "type": "module"
}
```

**Root and workspace `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

**Consequences of this choice that must be respected across all workspaces:**

- All relative imports in TypeScript source must use `.js` extensions (resolved to `.ts` by TypeScript at dev time, emitted as `.js` at build time):

```typescript
import { JsonStorage } from "./storage/json-storage.js";
```

- `__dirname` and `__filename` are not available — use `import.meta.url` instead:

```typescript
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
```

- Jest requires `NODE_OPTIONS=--experimental-vm-modules` to run ESM test files
- `resolvePackageJsonExports: false` is set in the root `tsconfig.json` to prevent TypeScript from following `exports` fields in `package.json` during path resolution, which conflicted with the dual-path strategy

## Considered Options

- **CommonJS** — discarded as it is a legacy module system that the ecosystem is moving away from; mixing CJS and ESM across workspaces introduces interoperability issues
- **ESM with `bundler` moduleResolution** — discarded because it requires a bundler in the pipeline and doesn't work directly with Node.js's native ESM loader
- **ESM with `NodeNext` moduleResolution** — chosen because it matches Node.js's native ESM behavior, is fully supported by TypeScript, and works without a bundler

## Consequences

### Positive

- Aligns with the long-term direction of Node.js and the TypeScript ecosystem
- Enables use of `import.meta.url` for reliable file-relative path resolution
- Works natively with Node.js without a bundler
- Vitest has first-class ESM support, making test configuration straightforward

### Negative

- All relative imports require explicit `.js` extensions, which is unintuitive for developers coming from CJS or bundler-based environments
- `__dirname` and `__filename` are unavailable, requiring `import.meta.url` boilerplate
- Some libraries and tools still have incomplete or broken ESM support, requiring workarounds (e.g. `NODE_OPTIONS=--experimental-vm-modules` for Jest)
- `resolvePackageJsonExports` must be disabled in the root tsconfig to avoid conflicts with the dual-path strategy, which can mask misconfigured package exports
