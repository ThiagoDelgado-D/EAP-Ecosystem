# ADR-0015: Modular Application System

## Status

Accepted

## Context

As EAP-Ecosystem grows toward a multi-feature product, two distinct
configuration problems have emerged:

**Problem 1 — Feature-level modularity**: Different users have different
workflows. A developer who only wants a resource library with a Pomodoro timer
should not be forced to navigate around a recommendation engine, a Knowledge
Graph, or a Learning Paths module they don't use. Features must be independently
activatable, not always-on.

**Problem 2 — Dashboard-level modularity**: The dashboard hosts multiple widgets
(Ideal Match, Focus Pulse, System Check, Pending Tasks, Pomodoro, Session
History). Users should control which widgets appear and in what order without
being tied to a fixed layout.

These are two distinct concerns that require two distinct configuration
mechanisms. Conflating them into a single config produces a system that is
either too coarse (features toggle too much) or too fine (widgets configure too
little).

The core product philosophy driving this decision is the **Lego principle**: the
user chooses which blocks to assemble. EAP should never feel like a monolithic
tool that forces a particular workflow. Every significant feature module is
opt-in; the resource library is the only always-on core.

## Decision

Implement a dual-layer configuration system stored on the `User` entity as two
JSON columns: `featureConfig` and `widgetConfig`.

---

### Layer 1 — Feature Configuration (`featureConfig`)

Controls which application modules are active. An inactive feature is not just
hidden — its routes are not registered in the Angular router, and its
module-specific API calls are never made.

```typescript
export type FeatureId =
  | "learning-paths"
  | "knowledge-graph"
  | "pomodoro"
  | "session-tracking"
  | "spaced-repetition"
  | "voice-capture"
  | "file-import"
  | "roadmap-import"
  | "browser-extension-sync";

export interface FeatureConfig {
  id: FeatureId;
  enabled: boolean;
  config?: Record<string, unknown>; // feature-specific settings
}
```

The `config` field allows per-feature customization without new domain entities.
Examples: `pomodoro` stores `{ sessionMinutes: 45, breakMinutes: 10 }`;
`spaced-repetition` stores `{ algorithm: "simple", reviewIntervalDays: 7 }`.

**Backend validation**: The backend maintains `VALID_FEATURE_IDS` as a
`const` array. `updateFeatureConfig` validates incoming IDs against it.
The frontend `FeatureId` type is derived from the API contract — never
defined independently.

**Angular implementation**: Lazy-loaded route modules are registered
conditionally at startup based on `featureConfig`. A disabled feature
produces no routes, no lazy chunk download, and no navigation entries.

```typescript
// app.routes.ts — routes registered conditionally at startup
function buildRoutes(features: FeatureConfig[]): Routes {
  const routes: Routes = [...CORE_ROUTES];
  if (isEnabled(features, "learning-paths")) {
    routes.push({
      path: "paths",
      loadChildren: () =>
        import("./features/learning-paths/learning-paths.routes"),
    });
  }
  if (isEnabled(features, "knowledge-graph")) {
    routes.push({
      path: "atlas",
      loadChildren: () =>
        import("./features/knowledge-graph/knowledge-graph.routes"),
    });
  }
  // ... etc
  return routes;
}
```

Sidebar navigation items are derived from the same `featureConfig` — no
separate visibility logic needed in templates.

---

### Layer 2 — Widget Configuration (`widgetConfig`)

Controls which dashboard widgets are visible and in what order. A disabled
widget is not rendered; an enabled widget is loaded lazily via the widget
registry.

```typescript
export type WidgetId =
  | "ideal-match"
  | "system-check"
  | "focus-pulse"
  | "pending-tasks"
  | "pomodoro"
  | "session-history"
  | "knowledge-pulse";

export interface WidgetConfig {
  id: WidgetId;
  enabled: boolean;
  order: number;
  config?: Record<string, unknown>; // widget-specific settings
}
```

**Widget registry** (Angular):

```typescript
export const WIDGET_REGISTRY: Record<WidgetId, Type<unknown>> = {
  "ideal-match": IdealMatchComponent,
  "system-check": SystemCheckComponent,
  "focus-pulse": FocusPulseComponent,
  "pending-tasks": PendingTasksComponent,
  pomodoro: PomodoroComponent,
  "session-history": SessionHistoryComponent,
  "knowledge-pulse": KnowledgePulseComponent,
};
```

`DashboardComponent` is generic — it loads `widgetConfig`, sorts by `order`,
and renders enabled widgets via the registry. No per-widget `@if` in the
template.

**Dependency between layers**: Some widgets only make sense when their
corresponding feature module is active. `pomodoro` widget requires
`pomodoro` feature; `knowledge-pulse` requires `knowledge-graph`. The
settings UI enforces this dependency by disabling the widget toggle when
its parent feature is off.

---

### API endpoints

```
GET    /api/v1/preferences/features          — current featureConfig[]
PATCH  /api/v1/preferences/features          — update enabled/config per feature
DELETE /api/v1/preferences/features          — reset features to defaults

GET    /api/v1/preferences/widgets           — current widgetConfig[]
PATCH  /api/v1/preferences/widgets           — update enabled/order/config per widget
DELETE /api/v1/preferences/widgets           — reset widgets to defaults
```

### Settings panel

A `/settings/modules` route for feature toggles and a `/settings/dashboard`
route for widget toggles and drag-to-reorder. Changes are immediate and
optimistic — no save button.

---

### User entity

```typescript
export interface User {
  id: UUID;
  email: string;
  name: string;
  featureConfig: FeatureConfig[];
  widgetConfig: WidgetConfig[];
  createdAt: Date;
  updatedAt: Date;
}
```

Both fields are stored as `jsonb` columns in PostgreSQL. Default values
are applied on user creation: all features enabled, all widgets enabled
with sensible default order.

## Consequences

**Positive**

- Users interact only with features they actively choose
- Adding a new feature or widget requires zero changes to the shell or
  dashboard layout logic — only a new entry in the registry and the ID enum
- Feature-specific config (Pomodoro duration, SRS interval) lives in one
  place without polluting the User entity with typed fields per feature
- Inactive features produce no network requests, no lazy chunk downloads,
  no navigation entries — not just visually hidden
- The settings panel doubles as a discovery surface for available features

**Negative**

- Requires the User module and authentication to be complete before this
  has any effect (preferences are per-user, not global)
- Conditional route registration at startup requires the feature config
  to be fetched before the router is initialized — adds one async step
  to app bootstrap
- Widget ↔ feature dependency must be maintained manually in the settings UI

## Deferred Until

This ADR is implemented across v0.8.x as authentication and the User module
are completed. The `featureConfig` and `widgetConfig` fields are added to
the User entity in v0.8.0 even if no settings UI exists yet, to avoid a
schema migration later.

## Rejected Alternatives

- **Per-route opt-in only**: order without enable/disable is insufficient
- **localStorage for preferences**: preferences lost on new devices; not
  viable for a multi-client ecosystem (web, mobile, desktop)
- **Single merged config**: conflating feature modules and dashboard widgets
  into one structure requires knowing the difference at read time anyway;
  two clean contracts are simpler
- **Plugin system (Obsidian-style)**: plugins loaded from external sources
  add security surface and distribution complexity; built-in toggleable
  modules achieve the same user experience without the overhead

## References

- ADR-0014: Real-time Communication Strategy
- ADR-0016: Knowledge Graph
- ADR-0017: Mobile Client Strategy
- ADR-0018: Desktop Client Strategy
- Roadmap: v0.8.x — Authentication and Platform Core
