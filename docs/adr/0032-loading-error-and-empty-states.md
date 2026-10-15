# ADR-0032: Loading, Error and Empty States in the Web Client

**Date:** 2026-10-15

## Status

Proposed

## Context

ADR-0030 made every error message in the web client say what actually went
wrong. It did not decide when and where a screen shows that message, or how
a screen looks while it waits for data, after a request fails, or when there
is nothing to show. Each screen still decides that on its own, and moving
every feature onto the error layer surfaced the same bugs again and again:

| Problem | Where it appeared |
|---|---|
| One service exposes a single `loading` and `error` for unrelated requests, and every screen or section that reads them reacts to all of them | A failed notes save replaced the whole resource page with "Failed to load resource"; one preferences error showed in Appearance, Modules and Widgets at once; saving notes swaps the loaded resource page for its skeleton |
| The empty state shows when the request failed | The dashboard said "Nothing fits this calibration yet" when recommendations failed to load; Settings said "No active sessions found." next to a load error |
| The same failure is reported twice | The guided capture form showed a toast and an inline message; signing out other devices did the same |
| An error is invisible | The dashboard's recommendation error was written and never read; the guided form's inline error only appeared after the next interaction |

The pieces are also built by hand on every screen: ten templates draw
their own skeleton or pulse, about thirty `loading`/`error` signal pairs are
declared one by one, empty states are written inline, and the shared
component folder has no state component at all.

Angular offers a ready-made model for this: `resource()`, which loads data
from signals and exposes its status as `idle`, `loading`, `reloading`,
`error` or `resolved`, and `httpResource()`, its variant for HTTP requests.
In Angular 21, the version this client uses, both are still marked
experimental (since 19.0 and 19.2), so their API can change in a minor
release. They also cover reads only.
Most of the bugs above happened on writes: saving, deleting, toggling a
field, starting a break.

## Decision

### Every request has its own state

A small `AsyncState` model in `core/` describes one request: a `status` and,
when it failed, the message for the error. The status values are `idle`,
`loading`, `reloading`, `error` and `resolved`, the same names Angular's
`resource()` uses, so a read can later move to `resource()` or
`httpResource()` without changing what the screens check.

- A state belongs to one request and to the part of the screen that shows
  its result. Loading a list, loading one item, saving and deleting each
  have their own state, even when the same service runs them.
- A service no longer exposes one `loading` or `error` shared by unrelated
  operations. When several screens or sections use the same service, each
  reads the state of the request it shows.
- Reads and writes use the same model.

### Loading

- The first load of a section shows a skeleton shaped like the content it
  replaces.
- Once content has loaded, it stays on screen. A reload or an action on it
  shows a light indicator next to the content (`reloading`, or the action's
  own pending state), never the skeleton again.

### Errors

Where an error appears depends on what failed:

- **A load** shows the message in place of the content that didn't arrive,
  with a way to try again.
- **An action** on loaded content (save, delete, change a field, start or
  end something) shows the message as a toast through the error notifier,
  and an optimistic change goes back to its previous value in the same
  place it had.
- **Submitting a form** shows the message inline, next to the submit
  button, and keeps what the learner typed.

A failure is reported in one place only, never as a toast and inline at
once. A section shows only the errors of its own requests.

### Empty states

An empty state shows only when a load succeeded and returned nothing. It
says what would appear there and offers the next step to get it (capture a
resource, create a path, start a session). It never shows when the load
failed.

### Shared pieces

`shared/` provides the pieces every screen uses: a skeleton, a load error
with its retry action, and an empty state with its message and action.
How each one looks (and how the reload indicator looks) is defined with the
design system's tokens, in the design work that follows this decision.
Toasts keep using the existing notifier.

### Adoption

Screens move to the model one feature per change, as the error messages did
under ADR-0030. New screens follow it from the start. Writing any state
change must update the view while the app runs without zone-based change
detection, which holding state in signals guarantees.

## Consequences

### Positive

- A failure on one request can no longer hide, replace or mislabel the
  content of another, because nothing shares a state across requests.
- "Empty" and "failed" can't be confused: they are different statuses.
- Every screen loads, fails and comes up empty the same way, and the rules
  for where an error appears are written down once.
- Reads can adopt `resource()` or `httpResource()` once they are stable,
  mostly by replacing how the state is produced, since the screens already
  check the same status values.

### Negative

- `AsyncState` is the client's own code to maintain, and it overlaps with
  what Angular is building into `resource()`.
- Services that today expose one `loading` and `error` change their public
  shape, and every screen that reads them changes with them.
- Until every feature has moved, screens built both ways coexist.
- The visual pieces wait on design work before the first feature can adopt
  them fully.

## Rejected Alternatives

- **Shared components and written rules only** — rejected. It would make
  screens look consistent but leave the shared `loading`/`error` signals in
  place, which caused most of the bugs above; avoiding them would depend on
  each screen remembering to keep its own state.
- **Angular's `resource()` and `httpResource()` for every request, now** —
  rejected for now. Both are experimental in Angular 21, they cover reads
  but not the writes where most of the bugs were, and adopting them would
  change every service from loading on request to deriving loads from
  signals at the same time as the state standard. Matching their status
  values keeps that door open.
- **Keeping per-screen handling** — rejected. It is what produced the bugs
  above, one screen at a time.

## References

- ADR-0002: Layered architecture per bounded context
- ADR-0030: Web client shares the domain's error types
