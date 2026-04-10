# ADR-0012: Modular Dashboard — Widget Configuration System

## Status

Draft

## Context

As the EAP-Ecosystem matures toward MVP, several dashboard components are
currently hardcoded: FocusPulse, PendingTasks, and IdealMatch render static
data regardless of user preference or data availability. The system will
eventually have enough real features (pomodoro, recommendations, session
tracking) that it becomes meaningful to let the user choose which ones to
display and in what order.

The core product philosophy is "building blocks" — the user should never
feel forced to use every feature. A developer who only wants the resource
library and a pomodoro timer shouldn't have to navigate around a
recommendations engine they don't use.

This ADR documents the architectural decision for when that system is built.
It is intentionally deferred until the following conditions are met:

- User module and authentication are fully operational
- At least three dashboard widgets have real data (not hardcoded)
- Session tracking exists in some form

## Decision

Implement a widget configuration system with three layers:

### Domain — `User` entity

Add `widgetConfig: WidgetConfig[]` directly to the existing `User` entity
as a JSON column. A separate `UserPreferences` entity is not introduced —
the configuration is lightweight enough to live as a serialized field.

```typescript
export type WidgetId =
  | "ideal-match"
  | "system-check"
  | "focus-pulse"
  | "pending-tasks"
  | "pomodoro"
  | "session-history";

export interface WidgetConfig {
  id: WidgetId;
  enabled: boolean;
  order: number;
  config?: Record<string, unknown>; // widget-specific settings
}
```

```typescript
export interface User {
  id: UUID;
  email: string;
  name: string;
  widgetConfig: WidgetConfig[];
  // Others fields
}
```

The `config` field allows per-widget customization (e.g. pomodoro duration,
focus goal) without requiring new domain entities per widget.

### Application — use cases

Three use cases scoped to the user module:

- `getWidgetConfig` — returns the user's current `widgetConfig[]` sorted
  by `order`
- `updateWidgetConfig` — persists enabled/disabled state and order changes;
  validates that all provided `WidgetId` values are registered
- `resetWidgetConfig` — restores defaults (all enabled, default order)

### API — endpoints

```bash
GET    /api/v1/preferences/widgets
PATCH  /api/v1/preferences/widgets
DELETE /api/v1/preferences/widgets  (reset to defaults)
```

### Backend validation of `WidgetId`

The backend mirrors the frontend `WidgetId` union as a TypeScript `const`
enum in the user domain:

```typescript
export const VALID_WIDGET_IDS = [
  "ideal-match",
  "system-check",
  "focus-pulse",
  "pending-tasks",
  "pomodoro",
  "session-history",
] as const;
```

`updateWidgetConfig` validates incoming IDs against this list.
Frontend and backend stay synchronized because the source of truth is the
backend enum — the frontend `WidgetId` type is derived from it via the API
contract. Adding a new widget requires updating the backend enum first.

### Frontend — widget registry

A static map in the Angular application that associates each `WidgetId` with
its component. The `DashboardComponent` becomes generic — it loads
`widgetConfig`, iterates by `order`, and renders only enabled widgets via
the registry. No per-widget `@if` hardcoded in the template.

```typescript
export const WIDGET_REGISTRY: Record<WidgetId, Type<unknown>> = {
  "ideal-match": IdealMatchComponent,
  "system-check": SystemCheckComponent,
  "focus-pulse": FocusPulseComponent,
  "pending-tasks": PendingTasksComponent,
  pomodoro: PomodoroComponent,
  "session-history": SessionHistoryComponent,
};
```

Adding a new widget requires only registering it in this map and adding its
`WidgetId` to the union type — the dashboard itself is never modified.

### Settings panel

A `/settings/dashboard` route (not a modal) that renders toggles and
drag-to-reorder for each registered widget. Calls `PATCH /preferences/widgets`
on every change. No save button — changes are immediate and optimistic.

## Consequences

**Positive**

- Users only interact with features they actively choose
- Adding new widgets has zero impact on the dashboard layout logic
- Widget-specific config (pomodoro duration, etc.) lives in one place
- The settings panel doubles as documentation of available features

**Negative**

- Requires the user module and auth to be complete before this is useful
- The widget registry is a frontend-only concept — backend has no knowledge
  of what components exist, only what IDs are valid
- Drag-to-reorder adds frontend complexity (CDK DragDrop or equivalent)

## Deferred Until

- User module operational with persistent preferences
- At least 3 widgets rendering real data
- Pomodoro or session tracking exists in some form

## Rejected Alternatives

- **Per-route opt-in** (separate URLs per widget): breaks the dashboard
  mental model; the value is seeing everything in one place
- **localStorage only**: preferences would be lost on new devices; defeats
  the purpose for a daily-use tool
- **Drag-only, no toggles**: order without enable/disable is insufficient —
  the user should be able to fully hide features they don't use

## References

- ADR-0011: URL metadata extraction strategy
- Roadmap: post-MVP — dashboard personalization
- Depends on: User Module (in progress), Authentication (planned)
