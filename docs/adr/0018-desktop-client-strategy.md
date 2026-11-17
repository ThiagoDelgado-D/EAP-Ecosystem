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
access. Sync strategy is the same as mobile (see ADR-0017, offline ADR
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

## Revision 2026-11-16 — Electron, with the API and database bundled

**Status of this revision:** Accepted

### What prompted this revision

Version 1.0.0 ships Cauce first as a desktop app for people who are not
technical: they download an installer, open it and start, with no server to
set up. The desktop app is no longer a client of a remote API; it carries the
API, the web client and an encrypted database (ADR-0034) inside the installer.
That changes what the shell has to do, so both shells were built around the
same API and measured the same way before choosing.

### What the original decision assumed

- The desktop app would be a thin client of a remote API, so the shell only
  had to render the web client.
- Native work would live in a small Rust backend reached through IPC.
- A Tauri installer would weigh about 10 MB and use far less memory than
  Electron, because it uses the system WebView instead of shipping Chromium.
- Desktop would ship after mobile, as the last surface before v1.0.0.

### Why it changed

The API is a NestJS application on Node.js. Bundling it means shipping a Node
runtime with either shell: Electron already contains one, while Tauri has to
carry a separate Node binary next to its Rust executable. Rewriting the API in
Rust was never an option.

Both shells were built and measured before choosing; the next section
describes how. The results on Windows:

| Metric | Electron | Tauri with a Node sidecar |
|---|---|---|
| Installer download | 119 MB | 26 MB |
| Installed on disk | 374 MB | 103 MB |
| First launch to window ready | 1.5 s | 9.0 s |
| Later launches to window ready (median) | 0.76 s | 1.83 s |
| Memory at rest, private bytes | 257 MB | 259 MB |
| Close | 74 ms | 345 ms |

Once Node is bundled, memory is the same: the API weighs the same in both, and
the system WebView on Windows is itself a Chromium engine with several
processes. Tauri keeps a clear advantage in download and disk size; Electron
opens more than twice as fast every day and about six times as fast the first
time.

### How the numbers were obtained

- **Two experimental branches**, never merged:
  `exp/v100-desktop-shell-spike` holds the Electron shell, and
  `exp/v100-desktop-tauri-spike` adds a Tauri shell on top of it. Both run the
  same API bundle, the same web client build and the same encrypted SQLite
  database; only the shell differs. The Tauri shell starts the API as a
  separate Node binary and passes it the database key over standard input,
  the way Electron passes it over its own process channel.
- **One workflow builds and measures both:**
  `.github/workflows/desktop-measure.yml` runs on every push to those
  branches. For each shell it builds the API and the web client, packages the
  Windows installer, installs it silently and runs
  `apps/desktop/scripts/measure-windows.ps1`.
- **What the script measures:** the installer and installed sizes; five
  launches, the first one on a fresh install, each timed from starting the
  executable until the app's page has finished loading in the window; memory
  20 seconds after the last launch, summed over every process the app started
  (WebView processes included); and the time to close, checking that no
  process is left behind.
- **Where it ran:** GitHub's `windows-latest` runner (Windows Server 2025,
  4 CPUs), each shell on its own fresh machine, in run #10 of the workflow on
  2026-11-16. The workflow publishes the comparison table and both installers
  as artifacts of the run.
- **Limits:** each number comes from a single run on a CI machine, not on a
  learner's computer. They are good for comparing the two shells with each
  other, not as the times a learner will see. An earlier run of the same
  workflow measured Tauri's first launch at 6.6 s instead of 9.0 s; the order
  between the shells did not change.

### Why Electron, in this project

- **Launch time is what learners feel.** The app is opened every study
  session, while the installer is downloaded once. Electron is faster on
  every launch, and its slowest launch is faster than Tauri's usual one.
- **Tauri's memory advantage does not apply here.** It comes from keeping the
  backend in Rust. This project's backend is a Node application that has to
  ship anyway, and with it bundled both shells use the same memory.
- **Getting Tauri's real advantages means rewriting the backend in Rust.**
  That is most of the codebase: every bounded context, its use cases and its
  persistence, plus the tests around them. It is not something to take on
  for v1.0.0, but it is not ruled out either; see the alternatives below.
- **One language and fewer moving parts.** The shell stays in TypeScript and
  JavaScript like the rest of the monorepo, runs the API on the Node runtime
  it already contains, and includes the operating system keystore access the
  database key needs.

### New decision

#### Electron is the desktop shell

`apps/desktop/electron/` holds the shell. Tauri, the Rust backend and its IPC
command list from the original decision are dropped.

#### The desktop app is the main v1.0.0 product

It ships before mobile and before any hosted version. ADR-0017's order changes
accordingly; the hosted deployment, drafted as ADR-0033, is out of v1.0.0.

#### The app bundles the API, the database and the web client

- The API runs in a separate Node process started by the shell, listening only
  on `127.0.0.1` on a free port chosen at each launch, and serves the web
  client from the same origin.
- The process inherits the shell's environment and adds its own settings: on
  Windows, Node needs system variables such as `SystemRoot` that a replaced
  environment would drop.
- The database is the encrypted SQLite file of ADR-0034, in the app's data
  folder.

#### Secrets never pass through the environment

The shell generates the database key and the token signing secrets on first
launch, keeps them protected by the operating system keystore, and hands them
to the API over the channel between the two processes. If no keystore is
available, the app never stores them unprotected; it asks for the recovery key
at each launch instead (ADR-0020, revision 2026-11-17). If
the API does not receive its key, or does not answer, within a fixed time, it
exits with a clear error and the shell shows it, instead of waiting forever.

#### The window is locked down

The window runs sandboxed, with context isolation and without Node
integration. It can only navigate within the app's own origin; links to other
sites open in the system browser.

#### Distribution

Windows gets a per-user installer that needs no administrator rights; Linux
gets an AppImage. Both are published on GitHub Releases. Installers are
unsigned in v1.0.0, so Windows shows a warning on first install; signing is a
cost decided later. macOS is not part of v1.0.0.

#### Launch time is a tracked metric

The measurement workflow stays in the repository. Before optimizing, launch is
measured by phase (process start, API ready, window painted), so the work goes
where the time actually goes.

### Consequences of the revision

#### Positive

- The fastest launch of the two shells, every day.
- One language across the monorepo, shell included.
- Keystore access and a sandboxed window come with the shell.
- The same measurement workflow catches regressions in size, memory and launch
  time.

#### Negative

- A 119 MB download and 374 MB on disk, about four times Tauri's.
- Electron ships its own Chromium, so security fixes reach learners only when
  Cauce ships an update with a newer Electron. Keeping Electron current
  becomes part of every release.
- Unsigned installers trigger a warning on Windows that non-technical learners
  may find alarming.
- The tray, notifications and global shortcuts of the original decision have
  to be rebuilt on Electron's APIs when they are scheduled.

### Alternatives rejected in this revision

- **Tauri with a Node sidecar:** the smallest installer, but no memory
  advantage once Node is bundled, a launch more than twice as slow, a second
  language in the monorepo, and keystore access added through a separate
  library.
- **Tauri with the API rewritten in Rust (deferred, not discarded):** it is
  the only way to get Tauri's size and memory advantages, and it would also
  remove the bundled Node runtime. Today it would mean rewriting and
  maintaining most of the codebase in a second language before v1.0.0 can
  ship. It can be reconsidered later, for example if installer size or memory
  become real complaints from learners, or if parts of the backend move to
  Rust for other reasons. The measurement workflow can be pointed at such a
  build to compare it the same way.
- **A browser app on a hosted server:** needs a server, a domain and running
  costs before anyone can use Cauce, which is what the desktop app avoids for
  v1.0.0.

## References

- ADR-0012: Modular Application System (featureConfig is the same on desktop
  — the Angular app reads preferences from the API identically)
- ADR-0014: Real-time Communication (WebSocket client runs in Tauri WebView
  without modification)
- ADR-0019: Self-Hosting (desktop can connect to self-hosted API via
  configurable base URL in Tauri settings)
- ADR-0017: Mobile Client Strategy (mobile ships before desktop)
- Roadmap: v0.13.0 — Tauri desktop client (superseded by the 2026-11-16 revision)
- ADR-0020: Authentication architecture (local access mode for the desktop app, revision pending)
- ADR-0034: Database engine per deployment
