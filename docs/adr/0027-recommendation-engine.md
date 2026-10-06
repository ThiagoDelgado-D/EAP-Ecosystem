# ADR-0027: Recommendation Engine

**Date:** 2026-09-28

## Status

Accepted

## Context

v0.10.0 targets a Recommendation Engine: rule-based suggestions drawn from
the learner's current energy/state and their pending resources. The
`recommendation/domain` and `recommendation/application` workspace
packages already exist in the monorepo, scaffolded but empty — nothing has
been built there yet.

Most of the signal this module needs already exists elsewhere.
`LearningResource` already carries `energyLevel`, `mentalState`,
`difficulty`, and `status`. Pomodoro already has a narrower, rule-based
suggestion mechanism of its own (`CandidateNodesPort` /
`suggestSessionTarget`, see ADR-0022): it filters nodes that are already
part of an active Learning Path by energy level and by whether their
prerequisites are done, and returns a filtered list — no persisted
context, no notion of mental state or available time, no explanation of
why a candidate was returned.

`ARCHITECTURE.md`'s module-communication section already anticipated this
module by name, twice: as the worked example for synchronous cross-module
communication through a port (a `RecommendationService` depending on a
port implemented by an adapter, the same shape Pomodoro's
`CandidateNodesPort` already uses), and as the example for future
event-driven communication ("when a learning resource is completed, it
could publish an event that recommendation modules listen to").

A design exploration done ahead of this decision — not part of the system,
evidence informing it — worked through a richer scoring model worth
drawing from: matching energy, fitting available time, matching mental
state, weighting relevance to an already-active path, penalizing
abandonment, and surfacing the reasons behind a suggestion instead of an
opaque score.

Separately, EAP's cross-platform ambition (ADR-0017: Mobile Client
Strategy, ADR-0018: Desktop Client Strategy) means whatever holds "what
state is the learner in right now" needs to survive a device switch, not
just live in one browser tab.

## Decision

### A persisted, per-user Recommendation Context

Add a `RecommendationContext` entity to `recommendation/domain`, one per
user:

```typescript
interface RecommendationContext {
  userId: UUID;
  energyLevel: EnergyLevel; // mirrors learning-resource's EnergyLevelType value set
  availableMinutes?: number; // free-form; the UI can still offer preset chips
  mentalState?: MentalState; // mirrors learning-resource's MentalStateType value set
  updatedAt: Date;
}
```

`recommendation/domain` defines its own `EnergyLevel`/`MentalState` types
rather than importing `learning-resource/domain`'s directly, mirroring the
same value sets — the same per-module type duplication Pomodoro's own
`CandidateNodeEnergyLevel` already established, for the same reason
(keeping modules independent).

This context is persisted server-side rather than kept only in browser
memory. An ephemeral, browser-only version was considered and rejected:
it would not survive a device switch, which defeats the point once
mobile/desktop clients exist — the persisted context is meant to double as
that sync point from day one.

### Cross-module reads through ports, not direct domain imports

`recommendation/domain` defines the ports it needs to read candidate
material from other modules — at minimum a port into `LearningResource`,
and one into `LearningPath` nodes, so a recommendation is not limited to
standalone resources. `apps/api` wires the adapters
(`TypeOrm*Adapter` implementations reading the other modules'
infrastructure entities directly), the same seam already used for
Pomodoro's `TypeOrmCandidateNodesAdapter`. This keeps
`recommendation/domain` framework-free and without a direct dependency on
`learning-resource/domain`'s internals, consistent with the module
independence `ARCHITECTURE.md` already documents.

The scoring itself — a `getRecommendations` use case in
`recommendation/application` — evaluates each candidate against the
current `RecommendationContext`:

- energy match: penalize distance between the context's energy level and
  the candidate's
- time fit: candidate's estimated duration against the context's
  available minutes
- mental-state match: bonus when the candidate's mental state equals the
  context's
- active-path relevance: bonus if the candidate is the next actionable
  node in a path already in progress
- abandonment: penalty that grows the longer a candidate has gone
  untouched, read from `LearningResource.lastViewed` (already on the
  entity, nothing new to add there)

Each suggestion carries the short list of reasons behind its score, not
just a number — recommendations should be explainable, not a black box.
Abandonment specifically is meant to surface as one of those reasons in
plain language with the actual elapsed time (e.g. "You haven't opened
this in 7 days"), not just move the score silently — the point is to
nudge the learner back to something stalling, and that only works if it
says so. The exact day threshold before abandonment starts weighing in is
a tuning parameter, not fixed by this decision.

### Relationship to Pomodoro's existing suggestion mechanism: coexistence, not a merge

Pomodoro's `CandidateNodesPort` / `suggestSessionTarget` stays exactly as
it is. It answers a narrower, session-scoped question — "which node of an
already-active path can I start a session on right now" — filtered by
energy and prerequisite completion, nothing else. `recommendation`
answers the broader question — "what should I be doing right now, across
everything I have" — and is meant to sit as the more central layer other
parts of the system read from over time, not a replacement for Pomodoro's
own narrower lookup.

A merge in either direction was considered and rejected: the two
questions are shaped differently enough — session-start candidate
filtering with prerequisite logic, versus general-purpose ranked
suggestions with reasons — that forcing one to implement the other would
either overload Pomodoro's port with concerns it doesn't need, or strip
`recommendation`'s use case down to something narrower than its actual
job.

Left open, not decided here: whether `suggestSessionTarget` should
eventually read its energy input from the persisted
`RecommendationContext` instead of its current ad-hoc query parameter,
once that context exists. Recorded as a future consideration, not a
commitment either way.

**Resolved 2026-10-06.** `suggestSessionTarget` keeps receiving its
inputs as request parameters rather than reading the persisted
`RecommendationContext` itself. The client fills them from the
calibration it already holds, so Start and the dashboard always rank
against the same values. This is the same place Start already resolves
its duration cascade from that calibration, and it adds no dependency
from `pomodoro` onto `recommendation`. Reading the context server-side
through a new Pomodoro-owned port was considered and set aside for now:
it would give a single server-side source of truth, but it costs a new
cross-module edge, and today there is only one client.

The inputs grow from energy alone to energy plus mental state. Mental
state enters Pomodoro's scorer as its own signal: a match-only bonus,
weighted below energy, with no mismatch penalty. This mirrors how the
Recommendation engine treats it. Available minutes stays out of the
ranking, because it already decides the session's duration. Start waits
for the calibration to load before it asks for suggestions, and asks
again whenever energy or mental state changes. Both parameters stay
optional, so a request without them ranks exactly as before.

Deriving one input from the other — treating a focused mental state as
high energy, or a tired one as low — was considered and rejected. Such a
mapping is a decision made for the learner in advance, and it encodes one
particular model of how focus works that won't hold for everyone. Energy
and mental state are calibrated separately and score separately. Neither
one ever sets, overrides or shifts the other, in the client or in either
scorer.

### Consumption pattern

The backend stays a stateless use case queried on demand
(`getRecommendations`), reading the persisted `RecommendationContext`
internally rather than requiring the caller to pass energy/time/mental
state on every call. The frontend is expected to follow the same
shared-service/signal pattern already used for Pomodoro's own session
state (an injectable Angular service exposing signals, read reactively by
whichever components need it) — the exact shape of that store is a
frontend-lane implementation decision, not fixed here.

### Dismissals ("Not today")

_Added 2026-10-06._ A learner can set a recommendation aside for the rest
of the day. Dismissals are held by the client, each recording the
dismissed candidate (a resource or a path node) and an expiry at the next
local midnight. `getRecommendations` accepts the unexpired dismissals as a
list of candidates to exclude and ranks without them, so the alternates
re-flow and refill instead of the list simply shrinking. Restoring the
day's dismissals clears that list.

This deliberately differs from the Recommendation Context, which is
persisted server-side so it survives a device switch. A dismissal lives
less than a day and means nothing past it, so cross-device consistency
isn't worth a persisted entity, its migration, and its own endpoints.
Keeping the expiry on the client also follows ADR-0025's precedent: day
boundaries are evaluated client-side because the server holds no user
timezone. If cross-device dismissals become a real need, moving them
server-side changes only where the exclusion list comes from, not how
`getRecommendations` uses it.

## Consequences

**Positive**

- One canonical place records "what state is the learner in," reusable by
  the dashboard, by Pomodoro if it opts in later, and by future clients
- Recommendations are explainable, not a black-box score
- Cross-module reads go through ports, keeping `recommendation/domain`
  framework-free and not directly coupled to other modules' internals
- Lays the persisted-context groundwork the mobile/desktop strategy will
  need regardless

**Negative**

- A new persisted entity and its migration, plus one more thing that can
  go stale if the user stops updating their context
- Two rule-based "what to work on" mechanisms now exist in the codebase
  (Pomodoro's and `recommendation`'s) — deliberate, per the coexistence
  decision above, but a real duplication risk if their scoring rules
  drift apart without anyone noticing

## Rejected Alternatives

- **Ephemeral, browser-only context**: rejected because it would not
  survive a device switch, defeating the cross-platform-bridge motivation.
- **`recommendation` absorbing `suggestSessionTarget` outright**:
  rejected; session-start prerequisite-aware filtering is a
  different-shaped question than general ranked suggestions, and forcing
  one into the other would compromise both.
- **Direct domain-to-domain imports instead of ports**: rejected; would
  break module independence and the pattern Pomodoro's own
  `CandidateNodesPort` already established for the same kind of
  cross-module read.
- **Server-persisted dismissals** (_added 2026-10-06_): a per-user
  dismissal record with an expiry would carry "Not today" across devices,
  but for state that expires within the day, that cost outweighs the
  benefit. The exclusion list on `getRecommendations` keeps the move open
  without reworking the use case.

## References

- ADR-0002: Layered Architecture per Bounded Context (the ports/adapters
  pattern this decision reuses)
- ADR-0017: Mobile Client Strategy / ADR-0018: Desktop Client Strategy
  (the cross-platform motivation for a persisted context)
- ADR-0022: Pomodoro Focus Sessions (owns the `CandidateNodesPort` /
  `suggestSessionTarget` mechanism this ADR coexists with, not merges
  into)
- ADR-0025: Pomodoro Weekly Summary (the client-side day-boundary
  precedent the dismissal expiry follows)
- `ARCHITECTURE.md`, "How Modules Communicate" (already used
  `recommendation` as its own worked example for the ports pattern and
  for future event-driven communication)
