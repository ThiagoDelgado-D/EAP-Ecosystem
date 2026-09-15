# ADR-0025: Pomodoro Weekly Summary

**Date:** 2026-09-15
**Status:** Accepted

## Context

ADR-0022 already noted that "a history screen surfacing past `Session`s and
`Break`s to the user" was possible once the data model existed, but left it
explicitly unbuilt and unscheduled. With `Session`/`Segment` now real and
`Break` fully persisted (ADR-0022's revision), that data exists — the
question is what the first screen built on top of it should show.

An earlier design exploration sketched two distinct directions worth
distinguishing here, since they answer different questions: a lightweight
week readout paired with a scrollable day-by-day log (a handful of totals
plus the raw session list, deliberately not framed as a metrics dashboard),
and a separate, heavier year/quarter view (a calendar heatmap, an
accumulated-time curve, and a quarter-over-quarter comparison with a delta).
That exploration is evidence that both shapes are worth building eventually,
not a spec to implement as-is — the quarter-comparison idea in particular is
the pattern this ADR adapts to week granularity, and the calendar/curve
scale is deliberately left out (see Deferred) because it needs months of
real history to say anything meaningful, which the product doesn't have yet.

The product direction pulls from Rize's weekly review emails: a short recap
with comparatives ("how does this week compare to last") rather than a flat
list of numbers. This ADR scopes only the first, minimal slice of that: an
in-app weekly summary with a week-over-week delta and a small number of
plain-language observations. Email delivery is explicitly a later phase —
`apps/api` has no real email provider connected today, only a logging
stand-in used for auth codes, so shipping actual weekly emails is an
infrastructure decision on its own, not something to fold into this one.

## Decision

### No new persisted entity — read-time aggregation over existing data

The summary is computed on request from `Session`/`Segment`/`Break` rows
that already exist; nothing new is written to the database, and there is no
precomputed weekly-rollup table. At personal-user data volumes, summing a
week's rows at query time is cheap enough that a materialized rollup would
be solving a scale problem the product doesn't have (see Rejected
alternatives).

**`Break` is in scope, as its own line alongside focus time, not folded into
it.** This ADR's own research into the reference product found that its
weekly report's headline section is explicitly a Focus/Break/Meeting time
breakdown, each trending against its own multi-week average — focus and
break are shown as siblings, not focus-only with break as an afterthought.
That matches what the data model already gives for free: `Break` is now a
fully persisted, server-authoritative entity in its own right (ADR-0022's
revision), so it costs nothing extra to query it the same way as
`Session`/`Segment`. There is no "Meeting" concept in this product, so the
breakdown here is Focus + Break only.

### Backend: two range queries, no server-side aggregation logic

`ISessionRepository.findSegmentsByUserIdSince(userId, since)` already exists
for the suggestion engine's path-momentum signal. This ADR widens it to
`findSegmentsByUserIdSince(userId, since, until)` (an optional `until`,
defaulting to "now" so every existing caller keeps working unchanged) and
adds a matching use case that also returns the `Session` rows in range — a
segment on its own doesn't carry `plannedMin` or `intent`, both of which the
frontend needs for the log and for "average session length."

`IBreakRepository` gets a new method, `findByUserIdSince(userId, since,
until)`, returning every `Break` row in range — the same shape decision as
the session-side query, kept as its own method rather than overloading
`findActiveByUserId` (that one is intentionally scoped to "the single open
break," a different question than "every break in a range"). A break's
actual duration for this purpose is `endedAt - startedAt` (the real elapsed
time), not the stored `durationSec` — `durationSec` is the *allocated*
length a break was started or extended to, which can end up longer or
shorter than how long the break actually ran before the user ended it, and
"how much break time did I actually take" should answer with the honest
number, same server-authoritative principle ADR-0022 already applies to
`Session`/`Segment`.

The endpoint returns the raw `Session[]`/`Segment[]`/`Break[]` for the
requested range. It does **not** return pre-aggregated totals, deltas, or
observations — all of that is derived client-side, from the same raw shape
the design exploration's own data module derived everything from. This
keeps the backend surface to two reads, keeps the "what counts as a week"
question (see below) entirely out of the server, and means a UI iteration
on which numbers to show never touches `apps/api`.

### Date-range boundaries are computed client-side, not server-side

ADR-0024 already flagged that evaluating a day boundary in the user's local
timezone requires the server to know that timezone, which nothing today
provides. Rather than solve that now, the client computes concrete
`since`/`until` instants for "this week" and "last week" and sends them as
plain range parameters; the backend only ever filters a range it's given,
with no timezone logic of its own.

**Week start defaults to Monday**, matching ISO convention. This is a
frontend-only constant for now. ADR-0024 already reserves `Settings` as
where a future per-user day-boundary preference (`dayStartHour`) belongs;
a `weekStartDay` field on that same future `Settings` entity is the natural
home for making this configurable, following the exact pattern
`dayStartHour`/`durationPresets` already set. Until `Settings` ships, this
stays a hardcoded frontend constant — not a reason to pull `Settings`
forward ahead of its own ADR-0024 schedule. When it does ship, only the
frontend's range calculation changes; the backend range-query shape
introduced here doesn't move.

### Content: a Focus/Break breakdown, a week-over-week delta, and a small set of observations

**Totals** (this week), as two grouped lines rather than one merged number:

- **Focus**: total focus time, session count, average session length,
  active days out of 7, and unattributed time (segments with no
  `resourceId`/`learningPathNodeId`) — the same numbers the design
  exploration's week readout already settled on.
- **Break**: total break time and break count, from the same week's
  `Break` rows.

Focus and break are never summed into one "time spent" figure — ADR-0022 is
explicit that break time is not attributed time, and merging them would
quietly undo that distinction the moment it reached a summary screen.

**Delta**: each of those numbers compared against a **trailing average of
up to the preceding 4 weeks** (same day-of-week span each, going back from
the start of the current week) — not just the single immediately-prior
week. A single prior week can itself be atypical (a lighter week, a push
before a deadline, a vacation), which makes a one-week-back comparison
noisy; averaging several prior weeks gives a steadier baseline. This
mirrors how Rize's own weekly report frames its comparisons — against a
multi-week average, not last week alone — and its phrasing states the
comparison basis explicitly ("compared to your four-week average," not a
bare percentage), which this ADR's observation sentences also do (see
below), for the same audit-ability reason ADR-0022's suggestion engine
already commits to: a number you can't see the basis for is one you stop
trusting.

The average is taken over however many prior weeks actually have data (1
to 4), not padded with zero-weeks — a single light prior week would
otherwise drag the baseline down and produce a misleadingly large
"improvement." **If there are zero prior weeks with any sessions, no delta
is shown at all** — a comparison against nothing produces a meaningless or
misleading percentage (nominally infinite), so the UI omits the
comparative entirely rather than showing a degenerate number, until
there's at least one real prior week to average against.

**Observations**: up to **two** short plain-language sentences surfacing
the most notable deltas, each naming its comparison basis so it reads as
audit-able rather than a bare claim — e.g. "Your average focus session was
18% longer than your last 4-week average," "You had 2 more active days
than usual this week," or "Your break time was 25% higher than your last
4-week average." This is rule-based and deterministic, not generated by
any model — a fixed set of candidate observation templates, each bound to
one of the delta signals above (focus total time, average session length,
active days, break total time), each firing only past a minimum threshold
so small, noisy differences don't get narrated:

- Focus total time / average session length / break total time: only
  worth saying past a **±10%** relative change.
- Active days: only worth saying past a **±1 day** change (the metric is
  already coarse — any nonzero difference is real).

When more than two candidates clear their threshold, the two with the
largest relative change are shown, prioritizing signal over completeness —
the same "light depth that earns its place, not depth for its own sake"
call this ADR makes everywhere else. Observations are skipped entirely
under the same no-prior-data condition the delta itself skips under.

### Delivery: in-app only for this slice

The summary is a screen, not a notification or an email. Weekly email
delivery is a deliberately separate, later phase — it needs a real email
provider decision first (`apps/api` only has `LoggerEmailService`, a
development stand-in that logs instead of sending, wired for auth codes
today), which is its own infrastructure question independent of what this
summary shows.

## Consequences

**Positive**

- Zero new tables, zero new migrations — the entire feature reads data
  ADR-0022's `Session`/`Segment`/`Break` model already persists.
- The backend surface is small and stable (one widened repository method
  plus one new one, two range-returning use cases) regardless of how the
  summary's content evolves — adding or changing an observation template,
  or changing what totals are shown, is a frontend-only change.
- The date-range approach is forward-compatible with `Settings.dayStartHour`
  /`weekStartDay` once ADR-0024 ships: the backend contract (an arbitrary
  range) doesn't need to change when that happens.

**Negative**

- Computing totals over a week's segments and breaks happens on every
  request rather than being precomputed. This scales independently of how
  much history a user has accumulated in total — the query window is
  always a fixed lookback (this week plus up to 4 prior weeks), never
  "since account creation," so the row count per request stays roughly
  constant regardless of account age. This is a structural property of
  the range being bounded, not a bet that data volume stays low; it does
  not extend to the deferred year/quarter view, whose query window grows
  with account age by design (see Deferred).
- Until `Settings.weekStartDay` exists, every user gets Monday-start weeks
  with no way to change it — a known, accepted gap, not an oversight.
- The observation thresholds (±10%, ±1 day) and the cap of two are
  arbitrary starting points, not derived from any usage data — expect to
  retune them once the feature has real usage to learn from.

## Deferred

- **Year/quarter-scale views** (a calendar heatmap, an accumulated-time
  curve, milestones) — the design exploration this ADR draws from already
  designed this shape, but it needs months of real history to say anything
  a user couldn't already see from a handful of weeks side by side. Revisit
  once enough historical data exists for it to earn its place, not before.
  Unlike this ADR's bounded 5-week window, that view's query window grows
  with account age (it needs a full year of rows), so when it gets scoped,
  consider a database index on `Session.startedAt`/`Break.startedAt` (and
  whether a precomputed rollup is warranted by then) as part of that
  ADR's own decision, not something to retrofit here.
- **Weekly email delivery** — needs a real email provider connected to
  `apps/api` first (see Context). Until then, `LoggerEmailService` remains
  auth-only.
- **Retroactive attribution** (assigning a path/resource to a session that
  was logged as free/untargeted) — the design exploration's day-log view
  includes this, and it's a real, separately-scoped feature (it mutates
  `Segment` rows after the fact, which this ADR's read-only summary doesn't
  touch). Not part of this slice.
- **`Settings.weekStartDay`** — belongs on the same future `Settings`
  entity ADR-0024 already reserves for `dayStartHour`; not created here.

## Rejected alternatives

- **A precomputed/materialized weekly-rollup table**, updated on every
  session/segment write — rejected as solving a scale problem this product
  doesn't have. Read-time aggregation over a single user's week of segments
  is cheap; a rollup table would add write-path complexity (keeping it in
  sync with every session/segment/break mutation) for a performance
  problem that doesn't exist yet.
- **A new `WeeklySummary` persisted entity**, computed and stored once per
  week (e.g. by a scheduled job) — rejected for the same reason, plus it
  would need its own invalidation story if a past session's attribution
  changes after the fact (see the deferred retroactive-attribution item).
- **Server-computed totals/deltas/observations**, with the endpoint
  returning finished numbers instead of raw sessions/segments — rejected
  because it would move "what counts as a week" (and therefore timezone
  handling) onto the server, which is exactly what ADR-0024 already
  flagged as unsolved. Keeping the backend a plain range query sidesteps
  that entirely.
- **Showing the delta/observations against a zero baseline** when there's
  no prior week — rejected as producing a misleading first-week experience
  (a "+∞%" or an oddly confident sentence about a week that has nothing
  real to compare against).
- **Comparing only against the single immediately-preceding week**, the
  original shape of this decision before checking how Rize's own weekly
  report frames the same comparison — rejected once it was clear a single
  prior week is itself noisy (an atypical week ahead of it makes every
  delta suspect). A trailing multi-week average is steadier and matches
  the reference product's own approach.

## References

- ADR-0022: Pomodoro Focus Sessions (`Session`/`Segment` model this summary
  reads; the original, unscheduled mention of a history screen)
- ADR-0024: Pomodoro Settings & Cycle Awareness (`dayStartHour`, the
  day-boundary precedent this ADR's `weekStartDay` follows; Post-MVP)
- ADR-0023: Notification Strategy (unrelated to this ADR's in-app delivery,
  referenced here only to note that weekly email is deliberately not routed
  through it — email is a distinct channel, not a `DomainNotification`)
