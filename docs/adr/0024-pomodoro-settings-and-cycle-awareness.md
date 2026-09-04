# ADR-0024: Pomodoro Settings & Cycle Awareness

**Date:** 2026-09-03
**Status:** Proposed — Post-MVP, not scheduled to a version

## Context

ADR-0022 ships v0.9.5 with a fixed set of duration choices picked per
session (15 / 25 / 50 / 90 min) and a flat, non-cycle-aware break — no
short/long distinction, no tracking of how many focus rounds happened in a
row. Real Pomodoro practice benefits from a repeatable plan: a default
focus length, N focus rounds before a longer break, distinct short/long
break durations.

The original data-modeling pass had already sketched this shape, labeled
`Settings (future)`: `focus_duration`, `amount_of_focus` (rounds before a
long break), `short_break_duration`, `long_break_duration`. It was
deliberately kept out of ADR-0022 — building it now would mean deciding
persistence semantics (per-user? applied retroactively or only forward?
editable mid-set?) that nothing in the current roadmap needs yet. This was
an explicit, named decision, not an oversight: kept manual-only and
auto-cycle-free for v0.9.5, treating a configurable plan as "a natural
extension once the basic timer is built and validated."

## Decision (sketched — not final, revisit when this is actually scheduled)

- **`Settings`**: one row per user — `focusDurationMin`, `amountOfFocus`
  (focus rounds before a long break), `shortBreakMin`, `longBreakMin`.
  Editable, applied to sessions/rounds started **after** the edit — never
  rewriting a past `Session.plannedMin` (same snapshot principle ADR-0022
  uses).
- **Cycle position — derived, not stored**: no new field or table.
  `PomodoroService.breakAfter()` counts the user's focus `Session` rows
  started on the current calendar day — any `targetKind`, any `plannedMin`
  (a 90-minute immersion block counts the same as a 15-minute round) — and
  computes:
  - `dayCount` = number of focus Sessions started today
  - `cyclePosition = ((dayCount - 1) % amountOfFocus) + 1`
  - `isLongBreak = dayCount % amountOfFocus === 0`

  Reaching `isLongBreak` is what closes the set — the next Session starts
  a new set at position 1. Taking a break, short or long, never forces the
  set closed by itself; only completing `amountOfFocus` rounds does. This
  survives a page refresh for free, since it is recomputed from `Session`
  rows already durable in Postgres — no counter to lose.
- **Daily reset**: the cycle resets every calendar day regardless of
  whether the previous day's set was completed — an incomplete set (say 2
  of 4 rounds) never carries into the next day as "2 of 4," it starts over
  at 0. The day boundary is already the reset point used elsewhere (session
  history, streaks), so this introduces no new concept of "abandoning a
  set" to define.
- **Cycle-aware break**: a `breakAfter(cycle)`-style computation (short vs.
  long break, based on how many rounds have run) lives in `PomodoroService`
  and reads the user's `Settings`. Still **offered**, not auto-started —
  the manual-tap transition from ADR-0022 doesn't change here.
- **Notification type**: ADR-0023's `DomainNotification.type` gains a
  cycle-aware variant (e.g. `long-break.reached`) once this ships.
- **Full auto-cycling** (skipping the manual tap between phases) stays
  explicitly out of scope even for this ADR unless separately re-opened.

## Consequences

**Positive**

- Real Pomodoro practice (short/long break rhythm) becomes possible without
  having forced that complexity onto v0.9.5.
- A version of this exact rhythm calculation is already sketched at the
  UI level — this isn't starting from zero, just moving it from throwaway
  client state to a real, tested service method.
- The cycle-position mechanism needs zero new tables or columns beyond
  `Settings` itself — cheaper to ship than the original sketch assumed.

**Negative**

- Because cycle position is derived live from `Settings.amountOfFocus`, a
  mid-day change to that value immediately reinterprets the whole day's
  count — a round that would have triggered a short break before the edit
  can retroactively become the long-break-triggering round, or vice versa.
  Accepted: the daily reset caps the blast radius to a single day: it never
  carries the reinterpretation into tomorrow.
- Adds a `Settings` entity and its own migration/UI surface that v0.9.5
  deliberately shipped without.

## Rejected alternatives

- **A dedicated `cycleIndex` field on `Session`** — rejected: still
  requires computing "how many rounds so far" at write time instead of
  read time, and gives a `Settings` change mid-set nowhere better to
  snapshot against than the derived approach already gets for free from
  the daily reset.
- **A separate `PomodoroCycle` entity** grouping `Session` rows into an
  explicit "set" — rejected as unnecessary once the reset is daily: there
  is no ambiguous "when did this set actually end" left to track, since
  the calendar day is already the boundary, and the target-count-reached
  rule needs no persisted state of its own.

## References

- ADR-0022: Pomodoro Focus Sessions (base session/segment model this
  extends)
- ADR-0023: Notification Strategy (`type` union grows when this ships)
- Original data-modeling sketch: `Settings (future)` entity
- `pomodoro_v095_design_shaped` design-session notes (2026-09-02): the
  "configurable Pomodoro plan" idea, explicitly deferred there
