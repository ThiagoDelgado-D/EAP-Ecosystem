# ADR-0023: Notification Strategy (NotificationPort)

**Date:** 2026-09-03
**Status:** Proposed

## Context

ADR-0017 (Mobile) and ADR-0018 (Desktop) already each describe how to fire a
notification when a Pomodoro session ends — `@capacitor/local-notifications`
on mobile, a Tauri IPC command backed by `tauri-plugin-notification` on
desktop. Both were written client-first, before web (the client shipping
first, in ADR-0022, v0.9.5) had any notification mechanism defined at all.

That's a problem in the making rather than a bug today: EAP is multi-client
by design (web now, mobile and desktop in ADR-0017/0018), and "when do we
notify" is a business rule, not a UI detail — a focus session completing,
a short break ending, the Nth pomodoro triggering a long break instead of a
short one. If that rule is decided independently inside three client
codebases, it will diverge the first time someone tweaks it in one client
and forgets the other two. It also forces `SessionService`
(`@pomodoro/application`, ADR-0022) to either import a client-specific SDK
directly — breaking the dependency direction ADR-0002 enforces — or grow
`if (platform === ...)` branches.

## Decision

Introduce a `NotificationPort` interface in `@pomodoro/domain` (same
pattern as `SessionRepository`): the Application layer depends on the
interface, each client supplies the implementation at its own composition
root.

```typescript
interface NotificationPort {
  notify(event: DomainNotification): Promise<void>;
}

interface DomainNotification {
  type: "session.completed" | "break.started";
  title: string;
  body: string;
  occurredAt: Date;
}
```

> `type` stays limited to what ADR-0022 actually has events for. A
> `long-break.reached` (or similar cycle-aware) variant gets added when
> ADR-0024 (Pomodoro Settings & Cycle Awareness, Post-MVP) ships — adding a
> union member later is additive, not a breaking change to this port.

The contract is deliberately thin — title, body, type, timestamp. No
actions, no buttons, no platform-specific payload. Anything richer is an
adapter-level concern, not a domain-level requirement.

`SessionService`/`PomodoroService` (ADR-0022) call `notify()` when a
session transitions state; they never know which adapter is wired in.

**Adapters, one per client:**

| Client  | Adapter                    | Backing mechanism                                    | Ships |
| ------- | --------------------------- | ----------------------------------------------------- | ----- |
| Web     | `WebNotificationAdapter`    | `Notification` API + permission prompt                 | v0.9.5 |
| Mobile  | `CapacitorNotificationAdapter` | `@capacitor/local-notifications` (ADR-0017)         | ADR-0017 timeline |
| Desktop | `TauriNotificationAdapter`  | `invoke("start_pomodoro_notification", …)` (ADR-0018) | ADR-0018 timeline |

This ADR **amends** ADR-0017 §"Push notification integration with
Pomodoro" and ADR-0018's `start_pomodoro_notification` IPC command: both
become adapters behind this port instead of freestanding decisions. No
code in either ADR changes today — this is the contract they should be
written against once mobile/desktop work starts.

## Consequences

**Positive**

- `SessionService`/`PomodoroService` specs mock one interface instead of
  stubbing three SDKs — matches how `SessionRepository` is already tested.
- A future fourth surface (browser extension, email digest) is one new
  adapter, zero changes to domain or application code.
- Keeps ADR-0002's dependency direction intact: application depends on an
  interface it owns, not on infrastructure or a platform SDK.

**Negative**

- Web is the only adapter that exists at first — the port's shape is
  designed against one real implementation and a lot of reading of
  ADR-0017/0018, not validated against a second one. It may need a
  breaking revision once the mobile adapter is actually built.
- One extra abstraction (interface + DI wiring) for what is, on web alone,
  a thin wrapper over `new Notification()` — accepted because the
  duplication cost across three clients is worse than the abstraction
  cost.

## Deferred

- **Notification preferences** (mute a type, quiet hours) — depends on
  `Settings` (deferred in ADR-0022).
- **Rich/actionable notifications** (snooze from the notification itself)
  — per-platform, additive at the adapter level if ever needed.

## Rejected alternatives

- **Fire notifications from Presentation-layer components** — rejected:
  puts the "after N pomodoros, long break" rule in UI code, duplicated per
  client (`PomodoroWidget` on web, its mobile/desktop equivalents), instead
  of once in `PomodoroService`.
- **Leave ADR-0017/0018 as freestanding, client-specific decisions**
  (status quo) — rejected: the "what triggers a notification" rule would
  live in three places; any new event type (e.g. a streak notification)
  means touching three client codebases instead of one Application
  service.

## References

- ADR-0002: Layered Architecture per Bounded Context
- ADR-0022: Pomodoro Focus Sessions (`SessionService`/`PomodoroService` as
  the port's consumers)
- ADR-0017: Mobile Client Strategy (amended — local-notifications adapter)
- ADR-0018: Desktop Client Strategy (amended — Tauri IPC adapter)
