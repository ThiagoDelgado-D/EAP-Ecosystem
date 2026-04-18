# ADR-0018: Desktop Client Strategy

## Status

Accepted

## Context

A desktop client for EAP would enable OS-level integrations that are not
possible in a browser or mobile WebView: system tray presence, native
notifications for the Pomodoro timer, global keyboard shortcuts to start
a focus session without switching windows, and deep offline support via
local database access.

The desktop client is deprioritized relative to mobile (see ADR-0017) because
mobile captures the broadest set of out-of-desk study moments. Desktop is
the last new surface before v1.0.0 — it completes the ecosystem rather than
extending its reach.

Two mainstream approaches exist for building desktop apps with web technology:
**Electron** and **Tauri**.

## Decision

**Tauri** for the desktop client, targeting v0.13.0.

```
apps/
├── web/        ← shared Angular source
├── mobile/     ← Capacitor project
├── desktop/    ← Tauri project (src-tauri/)
```

### Why Tauri over Electron

| Concern           | Electron                     | Tauri                          |
| ----------------- | ---------------------------- | ------------------------------ |
| Bundle size       | ~150 MB (ships Chromium)     | ~10 MB (uses OS WebView)       |
| Memory footprint  | High (full Chromium process) | Low (Rust + OS WebView)        |
| Native API access | Node.js + electron APIs      | Rust backend via IPC           |
| Build complexity  | npm scripts                  | Cargo + npm                    |
| Security model    | Chromium sandbox             | Rust memory safety + allowlist |

Tauri uses the system's native WebView (WebKit on macOS/Linux, WebView2 on
Windows) to render the Angular frontend — the same HTML/CSS/TypeScript codebase
runs inside the desktop shell with zero modification. The Rust backend handles
OS-level operations via an explicit IPC allowlist.

### Monorepo integration

`apps/desktop/src-tauri/` contains the Tauri Rust project. The `tauri.conf.json`
points `distDir` to `apps/web/dist` — the Angular build output. Building the
desktop app is:

```bash
cd apps/desktop
yarn tauri build        # produces platform binary in src-tauri/target/release/bundle/
```

The Angular source is not duplicated. `apps/web` is the single source of truth
for the frontend; both the web server (Nginx) and the Tauri desktop shell
consume its build output.

### Rust backend — IPC commands

Native capabilities are exposed to Angular via Tauri's `invoke()` IPC bridge:

```typescript
// Angular service
import { invoke } from "@tauri-apps/api/tauri";

await invoke("start_pomodoro_notification", {
  resourceTitle: "System Architecture",
  durationSecs: 2700,
});
```

```rust
// src-tauri/src/main.rs
#[tauri::command]
fn start_pomodoro_notification(resource_title: String, duration_secs: u64) {
    // schedule OS notification via tauri-plugin-notification
}
```

**IPC commands planned for v0.13.0:**

| Command                        | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `start_pomodoro_notification`  | Schedule OS notification at session end    |
| `cancel_pomodoro_notification` | Cancel on pause/stop                       |
| `show_tray_session_status`     | Update tray icon with active resource name |
| `open_focus_window`            | Open the Deep Work full-screen view        |
| `register_global_shortcut`     | `Ctrl+Shift+F` → start focus session       |

### Tray integration

The system tray icon shows the current session status (idle, in-progress,
paused) and provides quick actions: "Start Focus Session", "View Today's
Sessions", "Open EAP". This gives EAP a persistent desktop presence
without requiring the window to be open.

### Offline and local database

The desktop app can optionally run a local SQLite database (via
`tauri-plugin-sql`) that mirrors a subset of the user's data for offline
access. Sync strategy is the same as mobile (see ADR-0016, offline ADR
planned): last-write-wins with server timestamp authority, write queue
replayed on reconnect.

### Distribution

- **macOS**: `.dmg` via Tauri bundler; notarized via Apple Developer account
- **Windows**: `.msi` or `.exe` via Tauri bundler; code-signed
- **Linux**: `.AppImage` and `.deb`; distributed via GitHub Releases

GitHub Actions builds platform-specific binaries on release tag push.
No separate app store submission for desktop (unlike mobile).

## Consequences

**Positive**

- Angular codebase is completely shared — zero duplication between web
  and desktop frontends
- Bundle size (~10 MB) is acceptable for a developer-focused productivity tool
- Rust backend provides memory safety and a minimal attack surface vs.
  Node.js in Electron
- OS notification and tray support are the features that make the desktop
  experience genuinely different from a browser tab — not just packaging
- Global keyboard shortcuts enable focus-session entry without context-switching

**Negative**

- Rust introduces a second language in the monorepo; the Tauri IPC surface
  must be kept minimal to limit the Rust surface area
- Different system WebViews (WebKit, WebView2) can produce minor rendering
  differences; CSS compatibility must be verified across platforms
- Apple Developer account and Windows code signing certificate required for
  distribution without security warnings
- Building for all three platforms requires CI runners for each (macOS,
  Windows, Linux) — adds to build time and GitHub Actions minutes

## Rejected Alternatives

- **Electron**: Bundle size and memory overhead are the primary rejections.
  A ~150 MB app shipping its own Chromium for a personal study tool is
  disproportionate. Tauri achieves the same Angular rendering with a fraction
  of the footprint.
- **Native app (Swift/Kotlin)**: Would require completely separate codebases
  per platform, separate design implementations, and context-switching out
  of the TypeScript/Angular ecosystem. Not justified when Tauri achieves
  native OS integration via a thin Rust layer.
- **Browser extension as desktop substitute**: A browser extension provides
  URL capture but not OS-level tray, global shortcuts, or offline database.
  It is a complementary tool (v0.9.5), not a desktop client replacement.

## References

- ADR-0012: Modular Application System (featureConfig is the same on desktop
  — the Angular app reads preferences from the API identically)
- ADR-0014: Real-time Communication (WebSocket client runs in Tauri WebView
  without modification)
- ADR-0019: Self-Hosting (desktop can connect to self-hosted API via
  configurable base URL in Tauri settings)
- ADR-0017: Mobile Client Strategy (mobile ships before desktop)
- Roadmap: v0.13.0 — Tauri desktop client
