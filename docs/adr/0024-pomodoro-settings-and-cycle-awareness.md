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
- **Cycle counter**: scoped to a "Pomodoro set" (resets on a long break or
  when the user ends the set). Needs a server-side home once it must
  survive a page refresh — ADR-0022's refresh-recovery only restores the
  active session, not an implicit "which round am I on" counter. This ADR
  needs to decide where that counter lives (on `Session`? a separate
  `PomodoroCycle` row? derived by counting recent sessions?) when it's
  picked up.
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

**Negative**

- Needs a decision this ADR doesn't make yet: what happens to an
  in-progress cycle count when `Settings` changes mid-set (e.g. user drops
  `amountOfFocus` from 4 to 3 while on round 3)?
- Adds a `Settings` entity and its own migration/UI surface that v0.9.5
  deliberately shipped without.

## References

- ADR-0022: Pomodoro Focus Sessions (base session/segment model this
  extends)
- ADR-0023: Notification Strategy (`type` union grows when this ships)
- Original data-modeling sketch: `Settings (future)` entity
- `pomodoro_v095_design_shaped` design-session notes (2026-09-02): the
  "configurable Pomodoro plan" idea, explicitly deferred there
