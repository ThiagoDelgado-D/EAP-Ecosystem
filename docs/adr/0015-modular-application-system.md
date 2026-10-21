# ADR-0015: Modular Application System

## Status

Accepted. Revised 2026-10-13: Layer 1 is replaced. Revised 2026-10-21:
capability keys, entitlements and the beta channel are defined. See the
revisions at the end of this document.

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

> Replaced by the 2026-10-13 revision below.

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

## Revision 2026-10-13 — Real modules, one capability check, composed workflow

**Status of this revision:** Accepted

### What the original decision assumed

Layer 1 listed nine features up front, most of them planned rather than
built, and made each one opt-in from a settings list. A disabled feature
was meant to leave its routes unregistered at startup. The principle behind
it, that the learner chooses which blocks to assemble and the resource
library is the only always-on core, still holds. What changed is how that
principle is applied, because neither layer ever took effect and the
product now has needs the original decision did not anticipate.

### Why it changed

A learner can turn modules on and off twice: once in the last onboarding
step, and again in Settings › Modules. Both save the choice as the user's
`featureConfig`, and the API persists it. Nothing reads it. Navigation,
routes, the dashboard, the command palette and the recommendation engine
behave the same whatever the learner chose, so turning a module off has no
visible effect.

The list behind those toggles doesn't match the product either. The domain
knows four keys: `learning-paths`, `knowledge-graph`, `pomodoro` and
`spaced-repetition`. Two of them name features that don't exist. The
resource library and the recommendation engine, which do exist, can't be
toggled, and the web client's catalog adds entries of its own
(`resource-library`, `session-tracking`) that the domain doesn't know.
`widgetConfig` has the same problem: it is saved from Settings and read
nowhere.

There is also no moment where the learner says what they want from the
product. Onboarding asks for a name and a list of modules, which assumes
the learner already knows how each module would help them. A learner
preparing for an exam, one organizing a backlog of saved links and one
studying out of curiosity get the same setup, and the product never learns
the difference.

Finally, the product is meant to become a subscription. Plans will grant
access to more complete or more advanced capabilities. A module a learner
switched off and a capability their plan doesn't include are different
things: the first is a preference, the second is a permission. If both are
modeled as the same on/off list now, they have to be pulled apart when
plans arrive.

### New decision

This revision replaces Layer 1, its `FeatureId` list, the
`/preferences/features` contract and the conditional route registration.
Layer 2 (`widgetConfig`) is left as written but unread, see the deferred
item below.

#### The module catalog lists only what exists

The domain owns one catalog of modules:

| Module | Can be turned off |
|---|---|
| `resource-library` | No, it is the core every other module builds on |
| `learning-paths` | Yes |
| `pomodoro` | Yes |
| `recommendation` | Yes |

`knowledge-graph` and `spaced-repetition` are removed from the catalog,
and the web client's catalog becomes a presentation of the domain's list
(labels, icons, tones) with no keys of its own. A module joins the catalog
in the same change that ships it.

`featureConfig` is replaced by `enabledModules`. A migration gives every
existing learner every module, since no choice made so far ever took
effect, and drops the keys that no longer exist.

#### Turning a module off hides it, everywhere, without deleting anything

A module that is off disappears from the places a learner meets it:
navigation, its routes (which redirect to the dashboard), the dashboard
widgets that belong to it, its command palette entries, and the actions
other screens offer into it. The recommendation engine stops proposing
candidates from it: with Learning Paths off, path steps are not
recommended. Turning a module off never deletes its data, and turning it
back on brings everything back as it was.

The API does not reject requests to a module that is off. Turning a module
off is a preference about what to see, not a permission, and enforcing it
on the server would only add a failure mode with nothing to protect.

#### One capability check decides what a learner can use

What a learner can use is resolved in one place, a domain function:

```
capabilities = catalog ∩ entitlements ∩ preferences
```

- **Catalog**: what the product has.
- **Entitlements**: what the learner's plan grants.
- **Preferences**: what the learner chose to use (`enabledModules`).

Each capability resolves to one of three states, and the web client shows
them differently:

| State | Meaning | Presentation |
|---|---|---|
| `enabled` | Granted and chosen | Shown |
| `disabled` | Granted, switched off by the learner | Hidden |
| `locked` | Not granted by the plan | Shown with a lock and where to get it |

The API returns the resolved capabilities with the learner's session and
from the preferences endpoint. The web client drives navigation, guards,
widgets, the command palette and module-dependent actions from them, and no
component reads the raw preferences to decide what to show.

Until plans exist, there is one implicit plan that grants every capability,
so no capability is ever `locked` and preferences alone decide. A later
decision on plans and subscriptions only changes where entitlements come
from. Two rules for that decision are fixed here:

- **Entitlements are capabilities and limits, not modules.** A module can
  hold capabilities from different plans, and a plan can grant a capability
  up to a limit (for example a number of learning paths). Capability keys
  may therefore be finer than module keys.
- **Entitlements are enforced by the API.** Unlike preferences, a
  capability the plan doesn't grant is rejected on the server, and losing
  it keeps the learner's data readable rather than deleting it.

#### Onboarding composes the learner's workflow from what they want

The modules step of onboarding is replaced by a short intake:

1. **What are you here for?** One or more of: pass an exam, prepare for an
   interview, master a topic, organize what I already have, build a study
   habit, explore without pressure.
2. **How do you like to study?** One of: adapt day by day, short blocks,
   long sessions, a structured schedule.

From the answers, a pure domain function composes a setup: which modules
are enabled and the weekly focus goal. It only sets things that exist and
that the learner can change afterwards. Each choice comes with the reason
behind it ("Learning Paths on: mastering a topic goes better with a route
to follow"), and the learner sees the proposed setup, can adjust it, and
confirms it. Skipping the intake keeps every module on and the default
goal.

The answers are stored with the learner, next to the setup they produced:

- The composition runs on the server, so there is one source of truth and
  the rules are tested like any other domain logic.
- Keeping the answers lets the setup be composed again when the rules
  change, and lets later features use them (for example, the
  recommendation engine favoring material for an upcoming exam).

#### The workflow has one home after onboarding

After onboarding, the learner's workflow lives in a single Settings page:
the module toggles and the option to take the intake again, side by side.
There is no separate workflow screen in the navigation, and no second,
thinner copy of the same choices elsewhere. Taking the intake again shows
its result as a change to the current setup and applies only once
confirmed.

Any later way of changing the setup, such as installing a study method,
writes to the same `enabledModules` and goes through the same capability
check. It never keeps a parallel list of what is on.

### Consequences of the revision

#### Positive

- Every module toggle has a visible effect, and the catalog stops
  advertising modules that don't exist.
- New learners start from a setup that matches what they came for, with
  the reasons in front of them, instead of a list of modules to judge
  blind.
- The web client asks one question, "what can this learner use?", in one
  place, so adding a module or a plan doesn't mean finding every screen
  that checks.
- Plans can be added later by filling in entitlements, without reworking
  how modules are hidden or how screens decide what to show.

#### Negative

- Every module-dependent surface has to be wired to the capability check,
  across navigation, guards, the dashboard, the command palette and the
  recommendation engine's candidate selection.
- `featureConfig` becomes `enabledModules`, which needs a migration and
  changes the user payload the web client reads.
- The composition rules are product decisions encoded in the domain. They
  will need revisiting as modules are added, and every change to them
  needs its tests updated.
- Until plans exist, the `locked` state and the entitlement half of the
  check are present but never exercised in production.

### Alternatives rejected in this revision

- **Keeping planned modules in the catalog as "coming soon" toggles** —
  rejected. A toggle that does nothing is what made the current setting
  meaningless.
- **Composing the setup in the web client** — rejected. It would put
  product rules in the client, out of reach of the API and of the
  recommendation engine, and store only their result.
- **Storing only the composed setup, not the answers** — rejected. The
  setup couldn't be recomposed when the rules change, and the learner's
  stated goal would be lost to every later feature.
- **Treating disabled modules as permissions the API enforces** —
  rejected. Hiding something a learner chose not to use protects nothing,
  and server-side rejections would turn a preference into errors.
- **Modeling plans as sets of modules** — rejected. Plans are expected to
  differ by depth within a module and by limits, which a module list can't
  express.
- **A separate workflow screen alongside Settings** — rejected. Showing
  the same choices in two places, one richer than the other, made it
  unclear which one is the real setting.
- **Including study methods in this decision** — deferred to their own
  decision. Methods depend on questions this one doesn't need to answer,
  such as whether study material gets dates, and this decision only fixes
  that they change the setup through the same capability check.
- **Including dashboard widgets and interface density in this decision** —
  deferred. `widgetConfig` is equally unread and its keys predate the
  current dashboard, so it belongs with a redesign of the dashboard's
  widgets. The intake can grow a question for it then.

## Revision 2026-10-21 — Capability tree, entitlements and beta channel

**Status of this revision:** Accepted

### What the previous revision left open

The 2026-10-13 revision fixed the formula
`capabilities = catalog ∩ entitlements ∩ preferences`, the three states
`enabled`, `disabled` and `locked`, and one rule for plans: capability keys
may be finer than module keys. It did not say what a capability key is,
how a finer key relates to its module, how a feature that depends on two
modules resolves, where entitlements come from, or what shape the resolved
capabilities take on the wire.

### Why it is decided now

The capability check is the next piece to build, and every surface that
reads it (navigation, guards, the dashboard, the command palette and the
recommendation engine) depends on the answers. Deciding the keys after
those surfaces are wired would mean rewiring them. An opt-in channel for
experimental features is also close enough to plan for, and it fits the
same check.

### New decision

#### A capability is a unit of value, not a screen or a way of seeing one

A capability is something the learner can do that is worth having on its
own: something a plan could grant or a beta could introduce separately.
Screens and routes are not capabilities, because they change with the
interface while the value stays the same. How a feature is presented is not
a capability either. The zen view, the floating mini timer, the default
view mode and the shortcut hints change how the learner looks at Pomodoro,
not what Pomodoro does, so they stay presentation preferences in Settings.

A capability joins the catalog in the same change that ships it, as modules
already do.

#### Capabilities form a tree rooted at the modules

Every capability has one parent. The roots are the modules, and a key is
written as `<module>.<capability>`. The tree is the record of what each
module does and what it is made of:

| Capability | Value | Requires |
|---|---|---|
| `resource-library` | Save and organize study material. Core, cannot be turned off | |
| `resource-library.url-import` | Create a resource from a link, with a preview | |
| `resource-library.voice-capture` | Capture a resource by voice | |
| `resource-library.file-import` | Import resources from a file | |
| `learning-paths` | Arrange material into routes of ordered steps | |
| `learning-paths.graph` | See and edit a path as a graph | |
| `pomodoro` | Timed focus sessions | |
| `pomodoro.breaks` | Tracked breaks between sessions | |
| `pomodoro.weekly-summary` | A weekly readout of focus and breaks | |
| `pomodoro.path-focus` | Focus a session on a learning path step | `learning-paths` |
| `pomodoro.suggestion` | A suggestion of what to focus on when starting | `recommendation` |
| `recommendation` | What to study now, given the learner's state | |
| `recommendation.calibration` | Calibrate energy, mental state and available minutes | |
| `recommendation.path-steps` | Propose the next step of a learning path | `learning-paths` |
| `beta-channel` | Access to features still in beta | |

Navigation entries, routes, dashboard widgets, command palette entries and
the recommendation engine's candidate selection are surfaces, not
capabilities. Each surface reads the capability of the module or feature
that owns it.

#### A feature that spans two modules belongs to one of them

Every feature that touches two modules has an owner and a provider. Focusing
a session on a path step is Pomodoro's feature, and Learning Paths provides
the steps. Such a feature is a child of its owner and declares the provider
in `requires`. Turning the provider off removes only that feature: Pomodoro
still runs free and resource sessions without Learning Paths, and the
recommendation engine still proposes resources.

#### Resolving a capability

A capability's state is resolved in this order:

1. If it has a parent that is not `enabled`, it takes the parent's state.
   Nothing is offered inside a module the learner cannot see.
2. If the learner's entitlements don't include it, it is `locked`.
3. If anything it requires is not `enabled`, it takes the worst of those
   states, where `locked` is worse than `disabled`.
4. If it is a module the learner turned off, it is `disabled`.
5. Otherwise it is `enabled`.

`locked` takes precedence over `disabled`. A capability the plan doesn't
grant has no toggle, so a learner can only have turned it off while it was
still granted, for example before moving to a plan without it. In that case
the offer is shown, and the stored preference stays: if the capability is
granted again, the learner finds it the way they left it.

#### History from a module that is off stays truthful

Turning a module off never deletes its data, and what was already done
still counts. Time focused on a path step still appears in Pomodoro's
history and weekly summary, under the path's name, without a link into the
hidden module. A session already running when its provider is turned off
continues, since preferences are not enforced by the API, and nothing in
its outcome points into the hidden module.

The API rejects only what is `locked`, as the previous revision fixed. Until
plans exist nothing is `locked`, so no request is rejected.

#### Entitlements come from a port

The application layer declares an `EntitlementsProvider` port that returns
the set of capability keys granted to a learner. Until plans exist, its one
adapter is an implicit plan that grants every key in the catalog. A plan
decision replaces the adapter, not the capability check or the screens that
read it. The port returns keys only: limits are left to the plan decision.

#### The beta channel is a capability like any other

Each capability carries a stage, `stable` or `beta`. A `beta` capability
requires `beta-channel`, and `beta-channel` resolves through the same rules:

- Being allowed to join is an entitlement. The implicit plan grants it to
  every learner.
- Joining is a preference: one switch in Settings, which the learner can
  turn off at any time.

So a beta capability is `enabled` for a learner who joined and `disabled`
for one who didn't. When a beta capability becomes stable its stage
changes and it resolves like any other capability. Leaving the channel, or
retiring a beta capability, hides it without deleting what was created
with it.

The opt-in is stored with the learner, next to `enabledModules`.

#### The resolved capabilities on the wire

The API returns every capability in the catalog, keyed by capability, each
with its state and stage:

```json
"capabilities": {
  "learning-paths": { "state": "enabled", "stage": "stable" },
  "pomodoro.path-focus": { "state": "enabled", "stage": "stable" }
}
```

Every key is always present, so a missing key never has to be read as off.
An object per key leaves room for later fields, such as a limit, without
changing the contract's shape. The capabilities are added next to
`enabledModules` in the session responses and the preferences responses.
`enabledModules` stays the learner's raw choice, which Settings edits, and
no surface reads it to decide what to show.

### Consequences of this revision

#### Positive

- Each key states the value it stands for, so the catalog doubles as the
  record of what the product does.
- A feature that depends on two modules degrades on its own instead of
  every screen reasoning about both modules.
- Plans, access to the beta channel and its later restrictions change one
  adapter, not the check or the screens.
- A preference outlives a change of plan in both directions.

#### Negative

- Finer keys are defined before plans or betas read most of them, so for
  now most children resolve exactly like their module.
- Every surface has to be mapped to the right capability, a larger wiring
  job than reading module keys.
- The port makes resolving capabilities asynchronous and adds a dependency
  to every use case that returns them, for an adapter that grants
  everything.
- The beta opt-in is a new persisted field and needs a migration.

### Alternatives rejected in this revision

- **One key per screen or route** — rejected. It ties the domain to the
  interface's structure, so reorganizing screens would change the contract.
- **Flat keys with no parent** — rejected. Turning a module off would have
  to be propagated to its features by hand, and the record of what each
  module contains would be lost.
- **Turning individual capabilities on and off** — rejected. The learner
  chooses modules. Finer keys exist for plans and betas, and a toggle per
  capability would reopen what preferences are.
- **Presentation modes as capabilities** — rejected. A way of looking at a
  feature doesn't change what the learner can do with it.
- **`disabled` taking precedence over `locked`** — rejected. It hides an
  offer from a learner who turned something off while it was still
  granted.
- **Opting in per beta feature** — rejected. One switch is simpler to
  understand and to leave.
- **Entitlements as a domain constant** — rejected. It would change call
  sites when plans arrive instead of replacing one adapter.
- **An array of `{ key, state }`** — rejected. Every reader would search
  the list, and duplicates would have to be guarded against.

### Deferred

- **A fourth state for beta capabilities** a learner hasn't joined, shown
  as an invitation instead of hidden.
- **How access to the beta channel is restricted**: access codes, given as
  an incentive and reward to active learners, or admission in batches.
  Both are adapters of the same port.
- **What a retired beta does with its data**, beyond not deleting it.
- **Limits** within a granted capability, for example a number of learning
  paths.
- **Where the API enforces each capability** once something can be
  `locked`.

## References

- ADR-0014: Real-time Communication Strategy
- ADR-0016: Knowledge Graph
- ADR-0017: Mobile Client Strategy
- ADR-0018: Desktop Client Strategy
- Roadmap: v0.8.x — Authentication and Platform Core

Revision 2026-10-13 — the modules in the new catalog and the one removed:

- ADR-0016: Knowledge Graph — removed from the catalog
- ADR-0021: Learning Paths — `learning-paths` module
- ADR-0022: Pomodoro Focus Sessions — `pomodoro` module
- ADR-0027: Recommendation Engine — `recommendation` module; stops proposing
  candidates from modules that are off

Revision 2026-10-21 — the decisions the capability tree draws on:

- ADR-0022: Pomodoro Focus Sessions — `pomodoro.path-focus`, sessions
  focused on a path step
- ADR-0025: Pomodoro Weekly Summary — `pomodoro.weekly-summary`, which keeps
  showing time from modules that are off
- ADR-0027: Recommendation Engine — `recommendation.path-steps`, path step
  candidates
