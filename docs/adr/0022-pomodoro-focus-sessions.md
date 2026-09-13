# ADR-0022: Pomodoro Focus Sessions

**Date:** 2026-09-03
**Status:** Accepted

## Context

Pomodoro is the piece that starts to close the loop on EAP's general
study-session lifecycle. Learning Paths and Resources already model *what*
to study and in what order; nothing yet models the actual act of sitting
down and studying — starting a focus block, staying in it, and knowing
afterward where that time actually went.

The feature is built around the Pomodoro technique, which is what I use day
to day. But I also run plain attention blocks of up to 90 minutes when the
task calls for it — long enough to get properly immersed in whatever I'm
working on or studying. Both have to be first-class: the product can't
force Pomodoro's cycle onto every session, and open-ended sustained focus
needs to be a fully supported mode, not a workaround. Forcing a block past
its natural point degrades the ability to focus faster than working with
it does — so the design stays simple, minimalist, and to the point, rather
than adding structure nobody asked for.

The goal driving every modeling decision below is **transparency**: a
session should be honest afterward about where the time, energy, and
attention actually went. In a long, immersed block, some sittings move
across different sources as the material leads there — an article, a saved
PDF, a video — and others stay with a single source the whole time, like
reading straight through one book. Neither is the "right" way to use the
block; how the time gets spent is a personal call the data model has no
business presuming. What it has to get right is not getting in the way of
either case. Modeling a session as "one optional resource" (a single
nullable FK) would force picking just one source even on the sittings
where several were actually touched, losing track of the rest — exactly
what this feature promises to be honest about. It would also fail to
represent a session started against a Learning Path **stub** (a
`LearningPathNode` not yet promoted to a real `LearningResource`) — a stub
has no `resourceId` to point a plain FK at, yet time spent on it is real
time that should count.

**The same resource can be a node in more than one Learning Path** (e.g.
"Clean Architecture" as a step in both a "Frontend Architecture Mastery"
path and a "System Design Prep" path). When a session starts against that
resource, there is no derivable answer for "which path does this count
toward" — being honest about where time went means asking, not guessing.

**Scope boundary drawn today:** configurable timer settings and
cycle-awareness (how many focus rounds before a long break, distinct
short/long break lengths) are split out entirely into ADR-0024, explicitly
Post-MVP. This ADR's `Session`/`Segment` model does not depend on a
`Settings` entity existing.

## Decision

### Bounded context

`pomodoro/` follows the ADR-0002 layout: `domain/`, `application/`,
`infrastructure/` workspaces.

### Data model — Session + Segment, not one resource per session

**`Session`**

| Field         | Type                | Notes                                                                                                         |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`          | uuid                |                                                                                                               |
| `startedAt`   | timestamp           | Server-set, at creation (see Lifecycle below)                                                                 |
| `completedAt` | timestamp, nullable | Server-computed at `Ended`, from the server's own clock                                                       |
| `intent`      | text, nullable      | Free-text "session goal" (e.g. "Understand conditional types…"), shown as a quote in zen mode                 |
| `plannedMin`  | int                 | Duration chosen at start (15 / 25 / 50 / 90 in the v0.9.5 prototype — a placeholder default, not a fixed business rule; becomes per-user via `Settings.durationPresets` once ADR-0024 ships); a snapshot, not a live pointer to any settings |

**`Segment`** (belongs to `Session`, one-to-many, ordered by `startSec`)

| Field                | Type                                 | Notes                                                                        |
| -------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `id`                 | uuid                                 |                                                                              |
| `sessionId`          | uuid (FK)                            |                                                                              |
| `targetKind`         | enum: `free` \| `resource` \| `node` | What this segment is attributed to                                           |
| `resourceId`         | uuid, nullable                       | Set when `targetKind` is `resource`, or `node` with a promoted resource      |
| `learningPathId`     | uuid, nullable                       | Set when `targetKind` is `node`                                              |
| `learningPathNodeId` | uuid, nullable                       | Set when `targetKind` is `node`. `resourceId` null here = a **stub** segment |
| `startSec`           | int                                  | Seconds from `Session.startedAt`                                             |
| `endSec`             | int, nullable                        | Null = this is the currently active segment                                  |

At most one segment per session may have `endSec = null` at a time.
Switching material (`SessionService.switchTarget`) closes the current
segment (`endSec = elapsed`) and opens a new one — the clock never
stops. This is enforced in `SessionService`; at the infrastructure level, a
Postgres **partial unique index** on `(sessionId) WHERE end_sec IS
NULL` backstops it against concurrent requests.

A "free" session (no target picked at all) is just a session whose only
segment has `targetKind = 'free'` — not a special case at the `Session`
level.

### Target resolution — path context is declared, never inferred

When a segment's `targetKind` is `node`, both `learningPathId` and
`learningPathNodeId` are set — a node is always addressed within one
specific path. Resolution rule, matching the picker logic already worked
out in the design mock:

- Resource belongs to **zero** paths → plain `resource` segment.
- Resource belongs to **exactly one** path → auto-resolves to that
  path's node (still shown, and removable, in the UI's context breadcrumb).
- Resource belongs to **two or more** paths → the client must ask
  explicitly ("this resource is a step in N paths — pick which one this
  session counts toward, or neither"). `SessionService` never guesses.

### Presentation layer (designed and mocked, not yet built — documented here, not redesigned)

- **Start**: single-suggestion hero (ranked by: in-progress > continues
  last session > unblocked prerequisites > energy match > path momentum),
  one tap to start with a pre-picked duration. The duration picker shows
  quick-pick buttons (15/25/50/90 in the v0.9.5 default) plus a "Custom"
  option that opens a numeric input right there, before the session
  starts — a one-off value for this session, not saved as a preset unless
  the user does so separately (same pattern as Rize's "Use a custom
  duration..."). "Browse" opens the full picker (Ready to learn / In
  progress / All paths / Library tabs). "Just focus, nothing attached" is
  first-class, not a fallback.
- **Active**: three view modes — full (timer + right rail with
  Session/Segments/Notes tabs), mini (floating widget, persists while
  browsing the rest of the app), zen (fullscreen, no chrome). Mode changes
  only how the timer is _shown_; it never changes session data. "Switch
  material" mid-session opens a picker and creates a new segment without
  stopping the clock.
- **End**: per-segment time breakdown (measured, never divided evenly);
  stub segments get an inline promote (link to an existing resource or
  create one); free-only sessions get a retroactive attach. `LearningPathNode`
  status and `LearningResource` status are edited **independently** at this
  screen — neither implies the other, and both default to unchanged unless
  the user opens "Adjust progress."

### Lifecycle — server-authoritative writes

The `Session` row is created at `Idle → Focusing` (session **start**, not
completion) — the server sets `startedAt`; `completedAt` and total duration
are computed server-side, from the server's own clock, at `Ended`. The
client is never trusted to self-report elapsed focus time (trivially
fakeable via devtools). On reload, the app asks the backend for an active
session instead of trusting `localStorage`; recovery always resumes into
**mini** view, never back into whatever full/zen mode was active before the
reload. A session ended under a to-be-tuned minimum threshold (~1 min,
illustrative) is deleted server-side rather than finalized into history.

### Break — a first-class entity, not a stateless side effect

**Revised 2026-09-13.** This section originally specified breaks as a
stateless side effect: a fixed-duration notification with no persisted
state and nothing to rehydrate. That shape broke down as soon as the
feature was actually used — refreshing mid-break lost it entirely, since
nothing about it outlived the browser tab. Rather than patch around the
gap with client-only storage, `Break` becomes a real, server-persisted
entity. This reopens a decision the ADR treated as settled, so the change
and its reasoning are recorded here rather than silently overwritten.

Two technical arguments drove persisting `Break` server-side instead of in
browser storage:

1. **A history view of past focus sessions and breaks is a planned
   direction for this feature line**, even though it isn't scheduled to a
   version yet. A `Break` row created now is already a history record —
   nothing about it needs to be rebuilt or backfilled once that screen
   exists. Client-only storage would fix today's refresh-loss bug and
   then need replacing wholesale the moment history has to query past
   breaks, since browser storage isn't server-queryable data and doesn't
   survive a cleared browser or a different device.
2. **The server-authoritative principle this ADR already applies to
   `Session` extends cleanly to `Break` once it is recorded data.** The
   original flat design left `Break` unpersisted specifically because
   nothing about it was *attributed* time — there was nothing whose
   integrity needed protecting. That reasoning stops holding the moment a
   `Break` row exists and gets shown back to the user as history: at that
   point it is a record like any other, and its `startedAt`/`durationSec`
   should come from the same server-clock discipline
   `Session.startedAt`/`completedAt` already follow, not from a
   client-reported value sitting in `localStorage`.

**`Break`**

| Field         | Type                | Notes                                                                        |
| ------------- | ------------------- | ----------------------------------------------------------------------------- |
| `id`          | uuid                |                                                                               |
| `userId`      | uuid                |                                                                               |
| `startedAt`   | timestamp           | Server-set, at creation — same discipline as `Session.startedAt`             |
| `durationSec` | int                 | Mutable — extending the break updates this in place, not an event log        |
| `endedAt`     | timestamp, nullable | Set when the break finishes or is skipped; null = the active break           |

At most one un-ended `Break` per user at a time, enforced at the
application layer the same way `Session`'s "at most one active session per
user" rule already is. No partial-unique-index backstop is needed here the
way `Segment`'s open/closed toggle has one — there is no concurrent-write
race on a single user's own break the way there is on segment boundaries.

Lifecycle mirrors `Session`'s: `startBreak(userId)` creates the row (the
server sets `startedAt`, and still fires the existing break-started
notification); `extendBreak(userId, breakId, seconds)` adds to
`durationSec` after an ownership check identical in shape to
`verifySessionOwnership`; `endBreak(userId, breakId)` sets `endedAt` from
the server's own clock. `getActiveBreak(userId)` is the break-side
counterpart to `getActiveSession` — the client asks it on load instead of
trusting any client-side record of being on break, the same
refresh-recovery pattern `Session` already uses.

`Break` still creates no `Segment` row and still does not touch `Session`
— a break can now outlive a page refresh, but it remains entirely
decoupled from session/segment attribution, matching this ADR's original
point that break time is not attributed time. Cycle-aware break length and
configurable durations remain ADR-0024's problem, not this one.

## Consequences

**Positive**

- Segment-level attribution answers "where did my time actually go"
  precisely — the motivating multi-resource scenario is a first-class case,
  not a workaround bolted onto a single-resource model.
- Explicit path disambiguation prevents silently crediting progress to the
  wrong path when a resource is shared across paths.
- Splitting Settings/cycle logic into ADR-0024 means this ADR doesn't block
  on designing a feature nothing in the current roadmap needs yet.
- A `Break` row is a ready-made history record — a future history view of
  past sessions and breaks needs no separate backfill or migration for
  breaks taken after this shipped.

**Negative**

- More tables/joins than a single `learningResourceId` FK on `Session`
  would have been — accepted because it's the only shape that supports
  mid-session switching and per-target time, both already confirmed UX.
- "At most one open segment" has no natural full DB constraint; it needs
  both the partial unique index and an application-level check to be safe
  under concurrent requests.
- Flat break duration in v0.9.5 means no short/long distinction at all
  until ADR-0024 ships.
- `extendBreak`/`endBreak` are now real network calls where they were
  previously instant client-side updates — a break carries the same
  latency and failure surface as any other Pomodoro action, which the
  original flat design had deliberately avoided.

## Deferred

- **Settings persistence + cycle-aware breaks** — see ADR-0024 (explicitly
  Post-MVP). Includes making the quick-pick duration list itself per-user
  (`Settings.durationPresets`) instead of the hardcoded 15/25/50/90 this ADR
  ships with — that list reflects one person's habits, not every user's.
- **Cross-device session sync** — requires the WebSocket gateway (ADR-0014).
  CHANGELOG lists this as Post-MVP, not scheduled; ADR-0017's ambiguous
  wording on this point was corrected (2026-09-05) to match.
- Exact color/state semantics for the timer ring, and the Angular-level
  implementation of the mini widget's persistence (layout-level singleton
  service vs. CDK overlay) — implementation detail, not architecture.
- Exact minimum-duration-discard threshold value (prototype uses 1 min as
  illustrative).
- A history screen surfacing past `Session`s and `Break`s to the user —
  the data model now supports it, but the screen itself is not built or
  scheduled to a version.

## Rejected alternatives

- **Single nullable `learningResourceId` FK on `Session`** (this ADR's own
  first draft) — rejected: can't represent more than one resource per
  session, and can't represent a stub (no `resourceId` to point at).
  Superseded by the `Segment` model.
- **Two separate join tables** (`session_resources` M:N `LearningResource`,
  `session_path_nodes` M:N `LearningPathNode`) — an earlier candidate for
  supporting multiple resources + stubs. Rejected once the `Segment` model
  was found in the existing prototype: it captures per-target _time_, which
  a pair of join tables cannot, and needs only one table instead of two.
- **A single polymorphic join table** (`session_subjects` with
  `subject_type` + `subject_id`) — same reasoning: solves "which things
  were touched" but not "for how long each," and `Segment.targetKind`
  already gives a typed discriminator without a generic polymorphic id.
- **Always ask which path a resource belongs to, even when unambiguous** —
  rejected as needless friction; the picker only interrupts when a resource
  genuinely belongs to 2+ paths.
- **Silently picking the first matching path when a resource is
  ambiguous** — rejected: this is exactly the case with no derivable
  answer; picking one silently would misattribute progress.
- **Client-only persistence (`localStorage`) for `Break`, to survive a
  refresh without any backend change** — fixes the immediate refresh-loss
  bug on its own, but doesn't survive a cleared browser or work
  cross-device, and would need replacing entirely once a history view
  needs to query past breaks as real, server-held data. Rejected once the
  history direction made clear this data needs to exist server-side
  regardless of when the history screen itself gets built.

## References

- ADR-0002: Layered Architecture per Bounded Context
- ADR-0021: Learning Paths (`LearningPathNode`, stubs, multi-path membership)
- ADR-0023: Notification Strategy (`NotificationPort`, consumed by
  `SessionService`)
- ADR-0024: Pomodoro Settings & Cycle Awareness (Post-MVP — split out of
  this ADR)
- ADR-0017: Mobile Client Strategy · ADR-0018: Desktop Client Strategy
  (notification adapters)
- ADR-0014: Realtime Communication Strategy (deferred cross-device sync)
- CHANGELOG.md, `[Unreleased]` → Planned: "Pomodoro timer + `LearningSession`
  records — v0.9.5"
- Duration picker pattern (quick-pick presets + custom-duration input at
  session start): Rize
