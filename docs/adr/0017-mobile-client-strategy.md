# ADR-0017: Mobile Client Strategy

## Status

Accepted

## Context

Learning sessions happen in many contexts beyond a desktop browser — commuting,
between meetings, waiting rooms, brief windows of free time throughout the day.
A mobile client that carries EAP into those moments significantly increases
the product's daily utility and makes session tracking data richer (more
sessions captured = better recommendations and analytics).

The mobile client is prioritized **before** the desktop client (Tauri) because
a smartphone is always present in a way a laptop is not. The core web
application (`apps/web`) is already the reference implementation; the strategic
question is how to build a mobile client that maximizes code reuse while
providing a native-quality experience.

Three approaches were considered:

1. **Progressive Web App (PWA)**: add `@angular/pwa` to `apps/web`; installable
   on iOS/Android from the browser; no app store distribution
2. **Capacitor**: wrap the Angular app in a native WebView container; access
   native device APIs; distributes via App Store / Google Play
3. **React Native**: separate codebase, separate language runtime (Hermes/JSC);
   native components instead of WebView

## Decision

**Two-phase approach: PWA first, Capacitor second.**

### Phase 1 — PWA (alongside v0.9.x)

Add `@angular/pwa` to `apps/web` progressively during v0.9.x development.
This is not a separate version — it is an enhancement to the existing web app
that runs in parallel with feature development:

- Service Worker for offline caching of the shell and static assets
- Web App Manifest (`manifest.webmanifest`) for installability
- `Add to Home Screen` prompt on supported browsers
- Background sync for queued actions (e.g., a session completed while offline)

PWA gives mobile users a near-native experience with zero additional
infrastructure. It is the bridge while Capacitor is being prepared.

### Phase 2 — Capacitor (v0.12.0)

Wrap `apps/web` with **Capacitor** to produce native iOS and Android builds:

```
apps/
├── web/          ← shared Angular source (PWA + Capacitor target)
├── mobile/       ← Capacitor project (ios/, android/, capacitor.config.ts)
```

`apps/mobile` is a Capacitor project that points to `apps/web/dist` as its
webDir. The Angular build is shared; Capacitor adds the native shell.

**Native APIs used via Capacitor plugins:**

| Capability          | Plugin                                                          |
| ------------------- | --------------------------------------------------------------- |
| Push notifications  | `@capacitor/push-notifications` (FCM + APNs)                    |
| Local notifications | `@capacitor/local-notifications` (Pomodoro timer)               |
| Haptic feedback     | `@capacitor/haptics`                                            |
| Secure storage      | `@capacitor/preferences` (token storage, replaces localStorage) |
| Network status      | `@capacitor/network` (offline detection)                        |
| SQLite (offline)    | `@capacitor-community/sqlite`                                   |

**Offline strategy**: When `@capacitor/network` reports no connection,
the app reads from a local SQLite mirror (synced on last connection).
Write operations are queued and replayed when connectivity is restored.
Conflict resolution uses last-write-wins with server timestamp authority.
This strategy is documented separately in the offline sync ADR (planned).

**Push notification integration with Pomodoro**: When a focus session is
started on mobile, a local notification is scheduled for session end.
Cross-device sync (session started on web, visible on mobile) requires
WebSockets (see ADR-0013), introduced in v0.9.5.

### Mobile-first layout preparation

The Angular application should adopt mobile-friendly layouts progressively
from v0.9.0 onward — not as a big-bang redesign in v0.12.0. Concretely:

- Responsive breakpoints for resource cards, detail view, and Learning Paths
- Bottom navigation bar for mobile (mirrors the tab bar in the mobile designs:
  Atlas, Kanban, Focus, Vault)
- Touch-friendly tap targets (minimum 44×44px) on interactive badges and
  toggle controls
- No hover-only interactions for actions that also appear on mobile

This progressive approach means the Capacitor build in v0.12.0 wraps an app
that already works well on small screens rather than requiring a layout overhaul
at wrapping time.

## Consequences

**Positive**

- Maximum code reuse: the Angular codebase serves web, PWA, and mobile;
  no separate framework or language required
- PWA in Phase 1 delivers immediate mobile value without App Store processes
- Capacitor's plugin ecosystem covers all required native capabilities
- Angular's existing SSR guard patterns (`isPlatformBrowser`) already protect
  against browser-only APIs — compatible with Capacitor's WebView environment
- Monorepo structure (`apps/mobile`) keeps everything in one repository

**Negative**

- WebView-based apps have a performance ceiling compared to fully native UIs;
  acceptable for this product's interaction patterns (no video processing,
  no heavy animations)
- App Store review process adds deployment friction vs. web releases; both
  iOS and Android stores require review for each published version
- SQLite offline sync introduces conflict resolution complexity; deferred
  until the offline ADR is written
- Push notification certificates (APNs for iOS, FCM for Android) require
  platform developer accounts and certificate management

## Rejected Alternatives

- **React Native**: Would require a completely separate codebase, separate
  component library, and context-switching between Angular and React paradigms.
  The reuse story is zero. Not justified when Capacitor achieves the same
  native API access while sharing the entire Angular codebase.
- **Capacitor only (skip PWA phase)**: PWA is low-cost, delivers immediate
  value, and validates mobile layout decisions before the heavier Capacitor
  investment. Skipping it wastes the opportunity.
- **Ionic UI components**: Ionic adds a mobile-specific component layer on
  top of Angular. The existing Tailwind CSS design system is sufficient and
  adding Ionic would introduce component conflicts and dual styling systems.

## References

- ADR-0012: Modular Application System (featureConfig applies identically
  on mobile — same backend, same user preferences)
- ADR-0014: Real-time Communication (WebSocket client works in Capacitor
  WebView without modification)
- ADR-0019: Self-Hosting and Docker Strategy (mobile connects to self-hosted
  or cloud-hosted API via configurable base URL)
- ADR-0018: Desktop Client Strategy (mobile ships before desktop)
- Roadmap: v0.9.x — PWA progressive enhancement; v0.12.0 — Capacitor build
