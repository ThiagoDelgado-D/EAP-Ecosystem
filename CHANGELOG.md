## [Unreleased][Unreleased]

### Planned

- Learning resources associated to authenticated user (data isolation per user) — v0.8.4earning resources associated to authenticated user (data isolation per user) — v0.8.4
- `LearningPath` entity — graph + sequential modes, stub nodes, roadmap.sh import (ADR-0021) — v0.9.0LearningPath` entity — ordered resource sequences with phases and progress tracking — v0.9.0
- `ResourceRelationship` entity — typed directed edges between resources — v0.9.0ResourceRelationship` entity — typed directed edges between resources — v0.9.0
- Atlas View — `@swimlane/ngx-graph` force-directed knowledge graph visualization — v0.9.0tlas View — D3.js force-directed knowledge graph visualization — v0.9.0
- Pomodoro timer + `LearningSession` records — v0.9.5omodoro timer + `LearningSession` records — v0.9.5
- WebSocket gateway for cross-device session sync — v0.9.5ebSocket gateway for cross-device session sync — v0.9.5

---

## [0.8.7] - 2026-06-17

### Appearance Preferences Persistence

Completes the Settings section with fully persisted appearance preferences.
Users can now configure timezone, date format, time format, language, and density
from the Settings > Appearance panel — choices are saved to the backend and
restored on every sign-in. The panel is wired to new `GET/PATCH /preferences/appearance`
endpoints backed by `UserAppearancePreferences` in the `user` domain. A reusable
`SearchableSelectComponent` powers the timezone picker with filter-as-you-type support.

The Dashboard Widgets section is also redesigned: widgets now split into Active
and Inactive groups with per-widget accent toggles, ↑/↓ reorder controls, and an
optimistic fire-and-forget update pattern that eliminates the double re-render
that previously occurred on toggle.

---

### Added

#### Backend — Domain

- `UserAppearancePreferences` value object on the `User` entity —
  `timezone` (IANA string), `dateFormat`, `timeFormat`, `language`, `density`
- `DEFAULT_APPEARANCE` constant extracted as a shared reference — prevents
  accidental mutation of the default object across user creation paths

#### Backend — Application

- `getAppearance(userId)` use case — returns the user's current appearance config
- `updateAppearance(userId, patch)` use case — merges partial input over existing
  config; rejects null fields; enforces `timezone` max length (50) at DTO level
- Full unit-test suite for both use cases

#### Backend — API

- `GET /api/v1/preferences/appearance` — returns `UserAppearancePreferences` for
  the authenticated user; guarded by `JwtAuthGuard`
- `PATCH /api/v1/preferences/appearance` — accepts a partial `UpdateUserAppearanceDto`;
  null fields rejected (422); timezone validated as IANA string with max length 50

#### Frontend — Shared

- `SearchableSelectComponent` — standalone Angular component with filter-as-you-type;
  used by the timezone selector in the Appearance panel; fully accessible
  (`aria-expanded`, `aria-activedescendant`, keyboard navigation)

#### Frontend — Settings

- Appearance panel wired end-to-end: `PreferencesHttpRepository`, `PreferencesService`,
  and `PreferencesComponent` updated with `getAppearance()` / `updateAppearance()` methods
- UI states: loading skeleton, idle, saving (optimistic), success toast, error fallback
- Timezone picker uses `SearchableSelectComponent` with IANA timezone list
- Date format, time format, language, and density exposed as labeled selects
- Dashboard Widgets redesigned with Active / Inactive split sections, per-widget
  accent color toggles, and ↑/↓ accessible reorder controls

### Fixed

- `UpdateUserAppearanceDto` — null fields now rejected at DTO validation level;
  timezone capped at 50 chars (IANA ID constraint)
- Feature and widget config toggles apply fire-and-forget optimistic update —
  eliminates double re-render that occurred when a toggle triggered two sequential
  signal writes
- Appearance a11y: timezone IANA ID used as option value; widget reorder buttons
  expose `aria-label`; `DEFAULT_APPEARANCE` shared reference prevents mutation
  in parallel user-creation paths

### Docs

- ADR-0021 added: Learning Paths — domain model, sequential/graph modes, stub node
  pattern, `@swimlane/ngx-graph` adoption for graph mode and Atlas View,
  roadmap.sh import flow

---

## [0.8.6] - 2026-06-15

### Server-side Pagination, Filtering & Soft-match Search

Replaces the client-side filter endpoint with a unified, server-driven resource list.
The backend implements `findWithFiltersAndCount` via TypeORM QueryBuilder with a stable
`createdAt DESC, id ASC` sort order, and adds a `pg_trgm` GIN index that powers fuzzy
title matching. The Angular client is rewritten around a query-key cache, a new
`PaginatorComponent`, and `sessionStorage`-backed navigation state so filters survive
the back button. When a search returns zero results, the app now surfaces similar
resources as suggestions instead of an empty screen.

---

### Added

#### Backend — Infrastructure

- `pg_trgm` extension enabled and GIN index created on `learning_resources.title` —
  powers trigram similarity queries without sequential scan
- `findSimilarTitles(title, limit)` added to `ILearningResourceRepository` and
  implemented with a `pg_trgm` similarity query; result set capped at 5, ordered by
  similarity score descending
- `findWithFiltersAndCount` implemented via TypeORM QueryBuilder — accepts
  `resourceTypeId`, `topicIds`, `status`, `difficulty`, `energyLevel` as optional
  filters; separates topic-filter join from hydration join to prevent row inflation

#### Backend — Application

- `getResourcesByFilter` refactored: now accepts `page`/`pageSize` and returns
  `{ resources, total, page, pageSize }` — consumers get pagination metadata without
  coupling to the DB layer
- `getSuggestions(title)` use case added: delegates to `findSimilarTitles`, returns
  up to 5 `ResourceSuggestion` objects; fully unit-tested including the empty-result path

#### Backend — API

- `GET /api/v1/learning-resources` unified: accepts `page`, `pageSize`, `resourceTypeId`,
  `topicIds`, `status`, `difficulty`, `energyLevel` as optional query params;
  removes the stale `/filter` endpoint
- `GET /api/v1/learning-resources/suggestions?q=...` — returns fuzzy title matches;
  UUID guard on `resourceTypeId` prevents filter bypass on invalid input

#### Frontend — Domain & Application

- `PaginatedResourcesResponse` and `ResourceQueryParams` interfaces added
- `LearningResourceService` rewritten around a query-key cache keyed on filter params;
  optimistic toggle patches the correct cache entry to prevent stale-data flip after
  inline edits
- Full filter state serialized to `sessionStorage` and restored on `ngOnInit`
  after browser back — including page number, selected filters, and search term

#### Frontend — Presentation

- `PaginatorComponent` added — per-page dropdown (10/25/50), page-number display,
  prev/next controls; `[ngValue]` preserves numeric type on emit
- Empty search state shows a "Similar resources" section powered by `/suggestions`;
  a sequence counter guards against stale async responses

### Fixed

- `resourceTypeId` filter now ignored when value is not a valid UUID
- Topic filter join separated from hydration join — previously inflated rows when a
  resource had multiple topics
- `orderBy createdAt DESC, id ASC` added to guarantee stable page boundaries
- `page` and `pageSize` params guarded against `NaN` on non-numeric input
- `sessionStorage` JSON.parse wrapped in try/catch in `ngOnInit`
- Query cache keys encode special characters to prevent collisions on `+`, `&`, etc.

---

## [0.8.5] - 2026-05-13

### Danger Zone

Adds the Danger Zone panel to the Settings UI and wires the backend reset endpoint.
Users can reset all preferences to defaults or revoke all active sessions without
direct DB access. The preferences use cases gain full unit-test coverage, including
concurrent-write branch paths for session metadata.

---

### Added

#### Backend — Application

- `resetPreferences(userId)` use case: restores `featureConfig` and `widgetConfig`
  to their default values; exposed through the preferences NestJS service
- Full unit-test suite for all preferences use cases including `resetPreferences`
- Branch coverage added for session metadata writes and concurrent-access paths

#### Backend — API

- `POST /api/v1/preferences/reset` — resets all preferences to defaults for the
  authenticated user; returns 204 No Content; guarded by `JwtAuthGuard`

#### Frontend

- Danger Zone panel in Settings UI — "Reset preferences" and "Revoke all other
  sessions" actions, both with a confirmation step before firing

---

## [0.8.4] - 2026-05-13

### Settings Enhancement & Module Catalog

Overhauls the Modules section of Settings with a three-column grid, per-module
accent color toggles, and a typed `FeatureModuleCatalog` that centralises module
metadata. Introduces `StatusBadgeComponent` as a standalone display primitive.
Removes the legacy `ThemeService` and dark mode toggle from the shell layout.

---

### Added

#### Frontend — Components & Pipes

- `FeatureModuleCatalog`: typed array of module descriptors with `key`, `label`,
  `description`, and `accentColor` — single source of truth for the modules grid
- `ModuleLabelPipe`: maps a `FeatureKey` to its human-readable label; standalone, pure
- `StatusBadgeComponent`: standalone component for rendering `ResourceStatusType` as
  a styled chip; replaces ad-hoc inline badge markup
- Interactive `EnumBadge` restored in resource detail — clicks cycle through enum values

#### Frontend — Settings

- Modules settings page rewritten: three-column grid, each card shows name, description,
  and accent-coloured toggle; always-on modules render without a toggle
- Account component updated to display always-active vs user-enabled modules separately

### Removed

- `ThemeService` and dark mode toggle removed from shell layout — non-functional feature

### Dependencies

- `hono` 4.12.14 → 4.12.18 (#79), `uuid` 11.1.0 → 11.1.1 (#75),
  `fast-uri` 3.1.0 → 3.1.2 (#80)

---

## [0.8.3] - 2026-05-07

### User Settings & Preferences

Introduces the Settings section end-to-end. The backend extends session tracking
with device context and adds a Preferences API for feature and widget configuration
plus full session management. The frontend builds `SettingsLayoutComponent` with
nine sections under `/settings`, wires the shell dynamically to `AuthStore` signals,
and ships six fully functional sections alongside three "Coming soon" stubs.

---

### Added

#### Backend — Infrastructure

- `userAgent varchar(500)` and `ipAddress varchar(45)` columns added to `SessionEntity`
  with a TypeORM migration — enables the Active sessions UI to display browser/OS
  context and IP per session; `varchar(45)` accommodates IPv6

#### Backend — Application (`user` BC)

- `getFeatureConfig(userId)` / `updateFeatureConfig(userId, patch)` — typed against
  `FeatureConfig` domain type; PATCH semantics merge incoming partial over existing
  config to prevent accidental full-overwrite from a single-toggle request
- `getWidgetConfig(userId)` / `updateWidgetConfig(userId, patch)` — same pattern
  for `widgetConfig`; separate use cases to preserve ADR-0004 typed error surface
- `getActiveSessions(userId)` — returns `SessionDto[]` with `id`, `userAgent`,
  `ipAddress`, `createdAt`, `expiresAt`
- `revokeSession(userId, sessionId)` — validates ownership before deletion; typed
  error on not-found or cross-user access attempt
- `revokeAllOtherSessions(userId, currentSessionId)` — deletes all sessions except
  the active one; Danger zone invokes this without `excludeSessionId`
- All use cases fully unit-tested

#### Backend — API

- `GET /api/v1/preferences/features` / `PATCH /api/v1/preferences/features` —
  reads and patches `featureConfig`; body validated via `UpdateFeatureConfigDto`
- `GET /api/v1/preferences/widgets` / `PATCH /api/v1/preferences/widgets` —
  same for `widgetConfig`
- `GET /api/v1/auth/sessions` — returns active sessions for the current user
- `DELETE /api/v1/auth/sessions/:id` — revokes a single session, returns 204
- `DELETE /api/v1/auth/sessions` — revokes all sessions except current; accepts
  optional `{ excludeSessionId }` body
- All endpoints guarded by `JwtAuthGuard`; wired into existing `UserModule`

#### Frontend — Shell

- `ShellLayoutComponent` wired to `AuthStore.currentUser()` signals: user pill
  with first name, workspace header (`"${firstName}'s EAP"`), nav items rendered
  conditionally based on `featureConfig`

#### Frontend — Settings

- `SettingsLayoutComponent` — sidebar nav + `<router-outlet>`, child of `ShellLayout`
  under `/settings`
- 9 child routes lazy-loaded: `my-account`, `notifications`, `modules`, `dashboard`,
  `import-export`, `sessions`, `login-security`, `preferences`, `danger-zone`
- **Modules** — toggle list wired to `PATCH /preferences/features`; Resource Library
  locked with CORE badge; PLANNED modules rendered disabled; on save, response updates
  `AuthStore.setSession()` so shell nav reflects immediately
- **Dashboard widgets** — toggle list wired to `PATCH /preferences/widgets`; Angular
  CDK `DragDropModule` for drag-to-reorder with ↑/↓ accessible fallback
- **Active sessions** — table from `GET /auth/sessions` with userAgent + ipAddress;
  per-row revocation via `DELETE /auth/sessions/:id`
- **Login & security** — connected providers from `GET /auth/identities` (email,
  Google if linked); 2FA and login history rendered as stubs
- **Danger zone** — three actions with confirmation dialog: reset preferences, delete
  all sessions, delete account
- **Preferences** — appearance toggle (Light / Dark / System) wired to `ThemeService`
- **Stubs with "Coming soon" badge**: My account (name/email read-only visible),
  Notifications (all flags), Import & export

---

## [0.8.2] - 2026-05-05

### Google OAuth & Email Templates

Adds Google Sign-In as a second authentication provider and replaces the dev-only
`LoggerEmailService` with a real HBS-backed email system. The OAuth flow uses native
`fetch` — no Passport.js. Account linking handles the case where an existing
magic-link user signs in with Google using the same email.

---

### Added

#### Backend — Application (`user` BC)

- `handleGoogleOAuth` use case — exchanges authorization code at `oauth2.googleapis.com/token`,
  fetches profile from `googleapis.com/oauth2/v2/userinfo`; three code paths: known
  `providerSubject` → reuse user; known email, no Google identity → account linking;
  unknown email → create `User` + `Identity` fresh
- `GoogleOAuthError` typed error — returned as value, never thrown (ADR-0004)
- Unit tests covering all paths: token exchange, profile fetch, find-or-create,
  account linking, session creation, and error cases

#### Backend — API

- `GET /api/v1/auth/google` — builds Google authorization URL and issues 302 redirect
- `GET /api/v1/auth/google/callback` — receives code, calls use case, sets `refreshToken`
  httpOnly cookie, redirects to `${WEB_HOST}/auth/callback` with `access_token`, user
  fields, and `onboarding` flag. Failures redirect to `/auth/sign-in?error=oauth_failed`
- `EnvironmentService` gains `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

#### Backend — Email

- `EmailServiceImpl` — accepts `templateDir`, `declarations`, and resolved `SmtpConfig`
  via constructor; eagerly compiles all declared `.hbs` files at startup — throws
  `MissingTemplateError` on missing file (fail-fast)
- `UserModule` async factory: real SMTP when `SMTP_HOST` is configured; Ethereal
  auto-account otherwise — zero config for local dev, preview link logged per send
- `EAP_EMAIL_DECLARATIONS` — single registration point for templates
- `magic-link-code.hbs` and `welcome.hbs` — dark identity (slate-950 bg, violet accent)
- Welcome email sent to new users on first sign-in

#### Frontend

- `OAuthCallbackComponent` — standalone component at `/auth/callback`; reads query
  params, calls `authStore.setSession()`, navigates to `/onboarding` or `/dashboard`
- Google button in `EmailStepComponent` promoted from disabled `<button>` to
  `<a [href]="googleAuthUrl">` with absolute URL — relative href was intercepted by
  Angular's router (port 4200) before reaching NestJS (port 3000)

---

## [0.8.1] - 2026-05-01

### Authentication & Onboarding

Completes the full authentication loop end-to-end. Users can sign in via magic link,
complete a two-step onboarding flow (name + module selection), and have their session
and feature configuration persisted across logins.

---

### Added

#### Infrastructure

- `JwtServiceImpl` — real JWT sign/verify using default import (required for Node.js ESM runtime)
- `EnvironmentService` — typed wrapper over `process.env` with strict presence checks
- `onboardingCompleted` column — TypeORM migration added to `users` table
- `featureConfig` and `widgetConfig` stored as `jsonb` columns on `users` entity

#### Backend — Application (`user` BC)

- `requestSignIn` use case — generates 6-digit code, hashes it, persists `SignInChallenge`, sends magic link email
- `verifySignIn` use case — validates code + challenge state, creates user on first login, issues `accessToken` + `refreshToken`, opens `Session`; returns `featureConfig` in user payload
- `completeOnboarding` use case — sets `firstName`, `featureConfig`, `onboardingCompleted: true`
- `UserNotFoundError` typed error (`USER_NOT_FOUND_ERROR`, HTTP 404)
- Unit tests for all three use cases following inline-deps convention

#### Backend — API

- `POST /api/v1/auth/request-sign-in` and `POST /api/v1/auth/verify-sign-in`
- `PATCH /api/v1/auth/onboarding` — Bearer token extraction, delegates to `completeOnboarding`
- `CompleteOnboardingDto` — `firstName` (trimmed, min 1), `featureConfig` validated via `@IsIn(Object.values(FeatureKey), { each: true })`
- `refreshToken` set as `httpOnly` cookie (30 days, path: `/api/v1/auth`)
- `USER_NOT_FOUND_ERROR` registered in `DomainErrorMapper`
- `credentials: true` added to `enableCors()`

#### Frontend — Auth infrastructure

- `AuthStore` — `providedIn: 'root'`, signals: `currentUser`, `accessToken`, `isAuthenticated`, `setSession`, `clearSession`
- `AuthHttpService` — `requestSignIn` + `verifySignIn` with `firstValueFrom()`; maps `featureConfig`
- `OnboardingHttpService` — `completeOnboarding(firstName, featureConfig)` via `PATCH /auth/onboarding`
- `FEATURE_KEY` const object + `FeatureKey` union type in `auth.model.ts`; `featureConfig` added to `AuthUser` and `AuthUserDto`
- `authInterceptor` — `withCredentials: true` on all requests; `Authorization: Bearer` when token present
- `authGuard` — real implementation checking `AuthStore.isAuthenticated()`

#### Frontend — Sign-in UI

- `SignInComponent` — orchestrator with `signal<'email' | 'code' | 'success'>`
- `EmailStepComponent`, `CodeStepComponent` (6-digit OTP, auto-advance, paste, 30s countdown), `SuccessStepComponent`
- Routes to `/onboarding` if `onboardingCompleted === false`, else to `/dashboard`

#### Frontend — Onboarding UI

- `OnboardingComponent` — two-step orchestrator, calls API, updates `AuthStore`, navigates to `/dashboard`
- `NameStepComponent` — first name input with validation
- `ModulesStepComponent` — five modules with per-module hex color styling; toggles are `<button>` with `aria-pressed`; defaults: Learning Paths + Knowledge Graph

### Fixed

- `jwt.sign is not a function` in Node.js ESM — caused by `import * as jwt` instead of default import
- `refreshToken` cookie not stored — missing `credentials: true` in CORS config and `withCredentials` in Angular interceptor
- `featureConfig` collapsing to `[]` on subsequent logins — field was omitted from `verifySignIn` response
- `USER_NOT_FOUND_ERROR` missing from `DomainErrorMapper` — TypeScript compile error
- Module toggle rows not keyboard-operable — replaced `<div>` with `<button type="button">`
- Whitespace-only `firstName` accepted by `@MinLength(1)` — `@Transform` trims before validation

---

## [0.8.0] - 2026-04-28

### Docker + User Entity Foundation

Full-stack Docker Compose setup for local and production deployment. Introduces the `User`
entity with `featureConfig` and `widgetConfig` as first-class fields, and wires the NestJS
auth module with all required infrastructure (repositories, services, email adapter).

---

### Added

#### Infrastructure

- `docker-compose.yml` — full-stack Compose: PostgreSQL, NestJS API, nginx/Angular with health checks
- `apps/api/Dockerfile` and `apps/web/Dockerfile` — multi-stage builds
- `.env.example` — all required environment variables documented

#### Backend — `user` BC

- `User` entity with `featureConfig: FeatureKey[]` and `widgetConfig: WidgetKey[]` from day one
- `Identity`, `Session`, `SignInChallenge` domain entities and TypeORM implementations
- `TypeOrmUserRepository`, `TypeOrmIdentityRepository`, `TypeOrmSessionRepository`, `TypeOrmSignInChallengeRepository`
- `UserModule` wired in NestJS with all repositories and services registered
- Initial database migration for the `users`, `identities`, `sessions`, and `sign_in_challenges` tables

---

## [0.7.5] - 2026-04-17

### Mental State Toggle

Completes the inline toggle story by wiring `mentalState` end-to-end: a
dedicated backend use case, a new `PATCH /:id/mental-state` endpoint, and
an interactive badge in the resource detail view. As a side effect, the
`EnumBadgeComponent` now supports null values — rendering a "Set..."
placeholder that lets users assign a field from scratch without leaving
the page.

---

### Added

#### Backend — Application

- `toggleMentalState` use case
  (`learning-resource/application/src/use-cases/toggles/toggle-mental-state.ts`) —
  validates `id` (UUID) + `mentalState` (enum) via `toggleMentalStateSchema`;
  returns `InvalidDataError` on validation failure, `LearningResourceNotFoundError`
  when the resource is absent; partial `update()` on the repository
- `toggle-mental-state.spec.ts` — 8 tests: all five `MentalStateType` values,
  not-found, invalid value, invalid UUID, and field isolation
- `toggles/index.ts` and `use-case-map.ts` updated with new export

#### Backend — API

- `ToggleMentalStateDto` with `@IsEnum(MentalStateType)`
- `PATCH /api/v1/learning-resources/:id/mental-state` endpoint
- `dto/request/index.ts` updated
- 4 integration tests: success (deep_focus, light_read), 404, 400 invalid enum

#### Frontend — Shared

- `EnumBadgeComponent` — `value` changed from `@Input({ required: true }) value!: string`
  to `@Input() value: string | null = null`; added `isUnset` getter; null state renders
  a dashed-border "Set..." pill — fully interactive, opens the same dropdown
- `EnumBadgeComponent` — added `@HostListener('window:scroll')` and
  `@HostListener('window:resize')` to close the dropdown on viewport changes

#### Frontend — resource-detail

- `resource-detail.component.ts` — imports `EnumBadgeComponent`; adds option arrays
  for all four toggleable fields; adds `toggleLoadingField` signal; adds `onToggle()`
  with local optimistic update and rollback (injects `LearningResourceRepository`
  directly — the service's `optimisticToggle` is not usable in the detail view where
  `resources[]` is empty); removes dead `getDifficultyClass`, `getEnergyClass`,
  `getStatusClass` methods
- `resource-detail.component.html` — static metadata spans replaced with labeled
  `<app-enum-badge>` pill groups (`bg-slate-800/40` container + `text-slate-300` label);
  `mentalState` receives `r.mentalState ?? null` — shows "Set..." when unset; Duration
  moved to last position; duplicate "Learning Context" sidebar card removed

### Fixed

- `LearningResourceService.toggleMentalState` was calling `repository.updateResource`
  instead of the dedicated `repository.toggleMentalState` — fixed
- `@HostListener('window:scroll', ['$event'])` caused `TS2554: Expected 0 arguments,
but got 1` — fixed by removing the `['$event']` argument

---

## [0.7.4] - 2026-04-17

### Quick Toggles — Inline Badges

Introduces `EnumBadgeComponent`, a reusable Notion-style dropdown badge that
lets users toggle `difficulty`, `energyLevel`, and `status` directly from the
resource cards in the home view — no navigation required.

---

### Added

#### Frontend — Shared

- `EnumBadgeComponent` (`apps/web/src/app/shared/components/enum-badge/`) —
  standalone Angular component with Notion-style inline dropdown
- `EnumOption<T>` interface — `value`, `label`, `badgeClass`, `dotClass`
- Module-level `openBadgeId` signal — ensures only one dropdown is open at a
  time across all badge instances
- `position: fixed` dropdown via `getBoundingClientRect()` — escapes
  `overflow: hidden` on parent cards
- `@HostListener('document:click')` and `@HostListener('document:keydown.escape')`
  for outside-click and keyboard dismissal

#### Frontend — learning-resource

- `LearningResourceRepository` — added abstract `toggleStatus` and
  `toggleMentalState` methods to the frontend repository contract
- `LearningResourceHttpRepository` — implemented `toggleStatus`, `toggleMentalState`;
  fixed `toggleDifficulty` and `toggleEnergy` to apply API lowercasing
  (`toApiDifficulty`, `toApiEnergyLevel`) before sending
- `LearningResourceService` — added private `optimisticToggle` helper; added
  `toggleDifficulty`, `toggleEnergy`, `toggleStatus`, `toggleMentalState` public
  methods with optimistic update + rollback on error
- `HomeComponent` — added `difficultyOptions`, `energyOptions`, `statusOptions`,
  `mentalStateOptions` arrays; `toggleLoadingId` signal; `onToggle()` handler;
  replaced static badge spans with `<app-enum-badge>` in grid and list views;
  removed `getDifficultyClass`, `getEnergyClass`, `getStatusClass`

### Fixed

- Card navigation firing when clicking a badge — `event.stopPropagation()` added
  inside `toggle()` and `select()` in `EnumBadgeComponent`
- API toggle calls sending PascalCase values (`Medium`, `High`) instead of
  lowercase (`medium`, `high`) — applied `toApiDifficulty()` / `toApiEnergyLevel()`
  in the HTTP repository toggle methods
- `currentOption` re-evaluated as a getter instead of `computed()` — `computed()`
  only tracks signal dependencies; plain `@Input()` properties require a getter
  for correct change detection

---

## [0.7.3] - 2026-04-16

### Edit Resource

Adds `EditResourceComponent` at `/resources/:id/edit`, allowing users to update
all resource fields inline without recreating the resource.

### Added

- `EditResourceComponent` — standalone page at `/resources/:id/edit`; pre-fills
  all existing fields on load via `getById`; supports partial updates (`PATCH`)
  for title, URL, imageUrl, resource type, topics, difficulty, energy, status,
  duration, notes, and mentalState
- Redirect to `/resources/:id` (detail view) on successful update
- Cancel button returns to detail view without saving
- Toast notifications on success and error

---

## [0.7.2] - 2026-04-15

### Delete Resource

Adds destructive action support to the detail view with a confirmation dialog
and clean redirect flow.

### Added

- Delete button in `ResourceDetailComponent` — opens a `ConfirmDialogService`
  modal before calling `DELETE /api/v1/learning-resources/:id`
- Redirect to `/resources` on successful deletion
- Toast on success and on error

---

## [0.7.1] - 2026-04-15

### Resource Detail View

Adds `ResourceDetailComponent` — a full standalone page for each learning
resource, reachable at `/resources/:id`.

### Added

- `ResourceDetailComponent` at `/resources/:id` — displays all resource fields:
  title, URL, imageUrl, difficulty, energy, status, duration, mentalState, topics,
  notes, and timestamps
- Hero image when `imageUrl` is present; markdown rendering for notes via
  `MarkdownPipe`
- Navigation from every card in `HomeComponent` (grid and list views) via
  `onCardClick()` with `ResourceLibraryService.trackRecent()`
- Back button returning to `/resources`
- Edit and Delete action buttons (Delete implemented in v0.7.2,
  Edit implemented in v0.7.3)

---

## [0.7.0] - 2026-04-14

### Voice Capture & File Import

This release completes the v0.7.0 roadmap with two major smart capture methods:
**Voice Capture** (hands‑free entry via browser speech recognition) and
**File Import** (bulk addition from CSV/JSON files). Both features are
purely frontend, client‑side only – no new backend endpoints were required.

---

### Added

#### Voice Capture – PR 1 & 2 (`feature/voice-recording-ui`, `feature/voice-field-mapping`)

- `VoiceCaptureComponent` with four‑state UI (`idle`, `recording`, `done`, `unsupported`)
  and granular error states (`permission-denied`, `device-error`).
- **Web Speech API** integration with `continuous: true`, `interimResults: true`,
  live transcript area, and red pulsing indicator.
- `parseTranscript()` pure function – rule‑based field mapping:
  - URL detection → `url` field
  - Keyword matching (EN/ES: `libro`, `book`, `video`, `artículo`, `course`, etc.) → `resourceTypeCode` hint
  - Remaining text → `title` field
- Confirmation screen (no redirect to Guided Form):
  - Editable transcript text area, pre‑filled title, URL, resource type selector,
    notes field, and mandatory topic chip selector.
  - Save via `LearningResourceService.addResource()` with defaults
    (`difficulty: Medium`, `energyLevel: Medium`, `estimatedDurationMinutes: 30`).
  - Save errors shown inline without leaving the confirmation state.
  - Redirect to `/resources` on success.
- `OnDestroy` cleanup for recognition instance and microphone permission stream.
- **Accessibility**: full typing for `SpeechRecognition` API (no `any`), `aria‑label`
  and `aria-pressed` on interactive elements.

#### File Import – PR 3, 4 & 5 (`feature/file-import-dropzone`, `feature/file-import-preview-table`, `feature/file-import-batch-import`)

- **Drag & drop zone** + click‑to‑browse, client‑side parsing only (`FileReader`).
- CSV parsing via `papaparse`, JSON parsing with array validation.
- `normalizeRow()` maps case‑insensitive columns and handles alternate keys
  (`topicnames` / `topic_names` / `topics`, `energylevel` / `energy_level`,
  `estimateddurationminutes` / `duration`).
- **Preview table** with inline validation per row:
  - Blocking errors: missing `title`, invalid `difficulty`/`energyLevel`/`status`,
    invalid URL format, zero topics resolved.
  - Warnings: missing optional fields (defaults applied).
  - **Per‑row topic selector** (chips) – manual selection, file’s `topicNames` used
    only as pre‑selection hint.
  - Checkbox only enabled when row has at least one topic and no blocking errors.
  - “Select all valid” / “Deselect all” respect the same eligibility rules.
- **Batch import** – sequential `POST` calls via `LearningResourceRepository.addResourceLearning()`
  (no per‑row `loadAll` spam). Progress bar + counter, summary screen with success
  count and failure list.
- **Expected format section** with CSV / JSON tabs, copy‑to‑clipboard examples,
  and field reference.
- `ngOnDestroy` cleans up clipboard timeout and object URLs.

---

### Fixed

- `urlField` in `domain-lib` now correctly handles empty strings when `allowEmpty: true`
  (used by `PATCH` to clear URL fields).
- `PreviewUrlDto` – added `@IsString()` and `@Transform` for whitespace trimming
  before `@IsUrl()` validation.
- `toggleAll(true)` in File Import no longer selects rows without topics.
- Invalid `difficulty` / `energyLevel` / `status` values now produce **blocking**
  errors instead of silent defaults.
- Duration validation: `0` minutes is now a blocking error (must be positive);
  missing duration shows a non‑blocking warning and defaults to 30.
- JSON parsing preserves `topicNames` as an array (no unintended comma‑splitting).
- `toggleAll` and `toggleRowSelection` now respect the “at least one topic” rule.
- `ngOnInit` in `FileImportComponent` awaits `loadAll()` for `resourceTypes` and
  `topics` before enabling the “Review & Import” button.
- Added `aria‑label` to row checkboxes and `aria‑pressed` to topic chips for
  screen‑reader accessibility.
- `copyExample()` clipboard promise now sets `copied` only on success (no false
  positive flash).

---

### Architecture Notes

- **Voice**: Firefox fallback (Transformers.js + MediaRecorder) is explicitly **out
  of scope** for v0.7.0 – tracked for a future isolated PR.
- **File Import** uses the repository directly (`addResourceLearning`) to avoid
  unnecessary `GET` requests after each POST during batch import.
- Both features follow the same product pattern as URL Import: **capture → preview
  (editable) → save**. No redirect to Guided Form, no extra navigation steps.
- All validation rules are pure functions, easily unit‑testable without Angular
  TestBed.

---

### How to Test

```bash
# Backend (if needed for reference data)
yarn workspace api start:dev

# Frontend
cd apps/web && npm run start
```

**Voice Capture:** `/add` → Voice Capture (Chrome/Edge required)
**File Import:** `/add` → Import Externals

---

### Known Limitations (intentional)

- Voice Capture does not work in Firefox (browser limitation). A Transformers.js
  fallback is planned for a later version.
- Very large CSV/JSON files (>1000 rows) may cause UI slowness – row virtualization
  is not implemented for v0.7.0.
- The rule‑based voice parser may mis‑map edge cases; the confirmation screen
  is the safety net.

## [0.6.0] - 2026-04-09

### URL Import — Backend & Frontend

This release introduces URL Import, the first smart capture method in EAP.
Users paste a URL and the system automatically extracts title, description,
thumbnail and resource type before saving — eliminating manual data entry
for the common case.

### Added

#### Backend — URL Metadata Extraction (PR #52)

- `IUrlMetadataService` port in `learning-resource/application/src/ports/`
  defining the `extract(url): Promise<UrlMetadata>` contract
- `previewUrl` use case — validates the URL, delegates extraction to
  `IUrlMetadataService`, resolves `resourceTypeId` when the inferred
  `resourceTypeCode` matches an existing type
- `mockUrlMetadataService` with `setResponse`, `setError`, and `clear`
  for isolated unit testing (12 unit tests)
- `UrlMetadataService` in `learning-resource/infrastructure/` implementing
  a three-tier extraction pipeline:
  - **Tier 1 — oEmbed**: structured JSON from YouTube and Vimeo endpoints
  - **Tier 2 — Open Graph**: server-side Cheerio scraping for `og:title`,
    `og:description`, `og:image`, `og:site_name`, `og:type`; resource type
    inferred from URL patterns when `og:type` is absent
  - **Tier 3 — Graceful degradation**: returns empty `UrlMetadata` when
    both tiers fail; feature never throws to the caller
- `POST /api/v1/learning-resources/preview` endpoint returning `200`
- `PreviewUrlDto` and `PreviewUrlResponseDto`
- SSRF mitigation: private IP ranges and localhost blocked before fetch
- ADR-0011 documenting the three-tier extraction strategy
- ADR-0012 documenting the modular dashboard widget configuration system
  (deferred — planned post-MVP)

#### Frontend — URL Import UI (PR #53)

- `UrlPreviewService` — signals-based service calling `/preview`, managing
  `previewData`, `loading`, and `error` state; uses `API_CONFIG.baseUrl`
- `UrlImportComponent` with four view states:
  - **idle**: URL input with supported domains list
  - **loading**: spinner with simulated progress bar (clamped at 95%)
  - **error**: retry input + "Complete Manually" fallback to `/add/guided`
  - **success**: editable preview card — title field, resource type select,
    topic chip selector (mandatory), image header when `imageUrl` present
- Save errors shown inline without leaving the preview state
- Redirect to `/resources` on successful save
- URL Scrape method enabled in `AddResourceHubComponent`
- `OnDestroy` implemented — both `setInterval` instances torn down on
  component destruction

### Fixed

- `urlField` in `domain-lib` now accepts empty strings when `required: false`,
  allowing `PATCH /learning-resources/:id` to clear the `url` field
- `UpdateResourceDto` — `url` and `imageUrl` use `@ValidateIf` to allow
  empty strings, mirroring the domain-lib fix
- `UrlPreviewService` — `baseUrl` aligned to `API_CONFIG.baseUrl` instead
  of hardcoded `localhost`

---

## [0.5.1] - 2026-04

### User Module Foundation (PR #43)

Backend-only. Structural setup for the user module following Clean Architecture.
Not yet wired to the frontend or authentication system.

### Added

- `user/` module with Clean Architecture layers: `domain/`, `application/`,
  `infrastructure/`
- `User` entity with `id`, `email`, `name`, `status`, `createdAt`, `updatedAt`,
  and email verification token fields
- `IUserRepository` abstract class with CRUD contracts
- `registerUser` use case with email validation, password hashing, token
  generation, and email verification workflow
- `EmailAlreadyExistsError` domain error
- `EmailService` interface and `EmailServiceImpl` via nodemailer (SMTP)
- Email templates for registration and verification
- `MockedEmailService` and `MockUserRepository` for isolated unit testing
- ADR-0010 documenting auth integration within the user module
- Workspace and TypeScript path alias integration (`@user/domain`,
  `@user/application`)

## [0.5.0] - 2026-04-06

### Added

#### Backend — Mental State & Image URL (PR #44)

- `MentalStateType` domain concept with five values: `deep_focus`, `light_read`,
  `creative`, `quick_op`, `review`
- `imageUrl?: string` and `mentalState?: MentalStateType` optional fields on
  `LearningResource` entity
- `findByMentalState()` method added to `ILearningResourceRepository`
- `mentalState` filter support in `getResourcesByFilter` use case with AND logic
- TypeORM entity columns: `imageUrl varchar(2048)` and `mentalState varchar(20)`
  (nullable, no default)
- Database migration `Migration1774968984426`
- `AddResourceDto`, `UpdateResourceDto`, `GetResourcesFilterDto` updated with
  optional `imageUrl` and `mentalState` fields
- Seed script updated with random `imageUrl` and `mentalState` data

#### Backend — User Module Foundation (PR #43)

- `user/` module with Clean Architecture layers: `domain/`, `application/`,
  `infrastructure/`
- `User` entity with `id`, `email`, `name`, `status`, `createdAt`, `updatedAt`,
  and email verification token fields
- `IUserRepository` abstract class with CRUD contracts
- `registerUser` use case with email validation, password hashing, token
  generation, and email verification workflow
- `EmailAlreadyExistsError` domain error
- `EmailService` interface and `EmailServiceImpl` via nodemailer (SMTP)
- Email templates for registration and verification
- `MockedEmailService` and `MockUserRepository` for isolated unit testing
- ADR-0010 documenting auth integration within the user module
- Workspace and TypeScript path alias integration (`@user/domain`,
  `@user/application`)

#### Frontend — Dashboard & Shell Layout (PR #45)

- `ShellLayoutComponent` in `core/layout/` — responsive header and sidebar
  (desktop collapsible, mobile slide-in drawer with backdrop), theme toggle,
  `isPlatformBrowser` guard for SSR safety
- `DashboardComponent` — orchestrator with `selectedEnergy` and
  `selectedMentalState` signals, generation-counter guard to prevent stale
  filter responses
- `SystemCheckComponent` — energy selector (Low / Med / High) with battery
  SVG icons and mental state chip selector; `duration-300` transitions
- `IdealMatchComponent` — displays first matching resource from API with
  hardcoded fallback map per energy level
- `FocusPulseComponent` — weekly efficiency bar chart and energy flow bar
  (hardcoded — pending session tracking)
- `PendingTasksComponent` — task list with icon variants (hardcoded — pending
  task module)
- `ResourceLibraryService` — `providedIn: 'root'` service persisting
  `savedIds` (Set) and `recentIds` (last 10) in `localStorage` with
  `isPlatformBrowser` SSR guard
- Resource Library (HomeComponent) — thumbnail cards with `imageUrl` support
  and type-based SVG placeholder icons, ALL / SAVED / RECENT tabs,
  client-side search bar, mental state filter, Architect's Pulse stats widget
- `imageUrl` field added to guided form step 1
- `mentalState` chip selector added to guided form step 2 (deselectable)
- `MentalStateType` union type and `imageUrl` / `mentalState` fields added to
  `LearningResource` frontend model and `LearningResourceFilter`
- `learning-resource.dto.ts` extended with `imageUrl` and `mentalState` fields
- `LearningResourceHttpRepository` sends `mentalState` query param and maps
  both new fields in `toDomain` with type-safe `parseMentalState` guard

### Changed

- Dashboard is now the default route (`/` redirects to `/dashboard`)
- `HomeComponent` accessible at `/resources` (previously `/`)
- Add resource pages (`/add`, `/add/guided`, etc.) outside the shell layout
- All add-resource pages aligned to dark palette (`slate-950`)
- `AddResourceHubComponent` redesigned as "Creation Hub" with SVG icons per
  method variant and "Initialize →" pill CTA
- `GuidedFormComponent` redirect on success changed from `/` to `/dashboard`
- `UrlImportComponent` renamed to "URL Scrape"
- `FileImportComponent` renamed to "Import Externals"

### Fixed

- `ShellLayoutComponent`: `window.innerWidth` access deferred to `ngOnInit`
  with `isPlatformBrowser` guard — prevents `ReferenceError` in non-browser
  contexts (PR #45)
- `DashboardComponent`: generation-counter pattern prevents stale filter
  responses from overwriting newer selections (PR #45)
- `ResourceLibraryService`: `localStorage` access guarded with
  `isPlatformBrowser` (PR #45)
- `mock-user-repository.ts`: `findIndex` predicate self-comparison bug fixed;
  `reset`/`clear` now mutate the same array reference (PR #43)
- `register.spec.ts`: import path changed from `dist/` artifact to source
  module (PR #43)
- `EmailServiceImpl`: `verificationLink` field name aligned between template
  and use case payload (PR #43)
- nodemailer updated to v8.0.4 (PR #43)

## [0.4.0] - 2026-03-29

### Angular Frontend Foundation

This release introduces the first usable UI for managing learning resources
from the browser, built with Angular 21, standalone components, Signals,
and Tailwind CSS v4.

### Added

#### Frontend Application (`apps/web`)

- Angular 21 project setup inside `apps/web/` with Clean Architecture structure
- Tailwind CSS v4 with custom design tokens (`--color-accent`, `--color-ink`,
  `--color-ink-muted`, `--color-accent-soft`)
- Inter font with antialiasing
- Dark mode via native Tailwind v4 `dark:` prefixes and `@custom-variant`
- `ThemeService` with system preference detection and `localStorage` persistence,
  guarded against non-browser environments
- `ToastService` and `ToastComponent` with accessible live region and dismiss button
- `ApiConfig` centralized in `core/config`
- Path aliases (`@core/*`, `@shared/*`, `@features/*`) in `tsconfig.json`

#### Feature: Learning Resource

**Domain:**

- `LearningResource` model with `DifficultyLevel`, `EnergyLevel`, `ResourceStatus`
- `LearningResourceFilter` interface
- `LearningResourceRepository` abstract class (injectable token)
- `Topic` and `ResourceType` domain models and repository contracts

**Infrastructure:**

- `LearningResourceHttpRepository` — GET all, GET by filter, GET by id, POST
- `TopicHttpRepository` — GET all topics
- `ResourceTypeHttpRepository` — GET all resource types
- DTOs and mappers with strict enum validation before domain cast
- Filter values mapped to API enum format before sending
- Date parsing with fail-fast validation

**Application:**

- `LearningResourceService` — signals-based state, `loadAll`, `loadByFilter`,
  `addResource`
- `TopicService` — signals-based state, `loadAll`
- `ResourceTypeService` — signals-based state, `loadAll`

**Presentation:**

- Lazy loaded routing per feature with subroutes for each creation method
- `HomeComponent` — resource list with grid/list toggle, filters by difficulty,
  energy and status, dark mode, empty state with CTA, Notion-style colored badges
- `AddResourceHubComponent` — entry point at `/add` with method selector
- `GuidedFormComponent` — 2-step wizard at `/add/guided` with topic pills,
  visual difficulty/energy selector cards, skeleton loading, toast on success
- Placeholder pages for `/add/url`, `/add/voice`, `/add/import` (coming soon)

#### Backend additions

- `TopicController` — `GET /api/v1/topics`
- `ResourceTypeController` — `GET /api/v1/resource-types`
- `getTopics` use case with full test coverage
- `getResourceTypes` use case with full test coverage
- CORS origin configurable via `CORS_ORIGIN` environment variable

### Changed

- `getResourcesByFilter` now applies AND logic when combining multiple filters,
  loading all resources and filtering in-memory
- `getResourcesByFilter` returns empty array instead of all resources when
  filter validation fails
- URL validation in `AddResourceDto` relaxed to accept standard `http/https` URLs
- Empty string `url` normalized to `undefined` before `@IsUrl` validation

### Fixed

- `topicIds` sent as repeated query params instead of comma-separated string
- `resourceTypeId` used correctly instead of `typeId` in filter requests
- `clearFilters` now awaits `loadAll()` to prevent race conditions
- Stray `>` character removed from resource URL link in home template
- `rel="noopener noreferrer"` added to all external links
- View toggle buttons now expose `aria-label` and `aria-pressed` state
- Toast dismiss button labeled with `aria-label` for screen readers
- Toast container exposes `role="status"` and `aria-live="polite"`
- Unavailable method cards in hub disabled at control level with `aria-disabled`
- `estimatedDuration` aligned as required in DTO matching domain contract
- Date parsing in `toDomain` mapper fails fast on invalid date strings
- `app.spec.ts` updated to match router-outlet based template

## [0.3.0] - 2026-03-18

### Database & Infrastructure Release

This release migrates the persistence layer from the temporary JSON-based storage
to a production-grade PostgreSQL database using TypeORM, and introduces the Docker
infrastructure for local development.

### Added

#### Database Infrastructure

- `docker-compose.yml` with PostgreSQL service configuration
- `apps/api/.env.example` with all required environment variables
- `AppDataSource` configuration (`data-source.ts`) for TypeORM CLI migrations,
  independent from the NestJS module
- `DatabaseModule` — global NestJS module encapsulating the TypeORM connection
- Initial schema migration covering all entities
  (`1773704888428-migration.ts`)

#### TypeORM Entities (`learning-resource/infrastructure`)

- `LearningResourceEntity` — ORM mapping for `LearningResource`
- `ResourceTypeEntity` — ORM mapping for `ResourceType`
- `TopicEntity` — ORM mapping for `Topic`

#### TypeORM Repositories (`learning-resource/infrastructure`)

- `TypeOrmLearningResourceRepository` — production implementation of
  `ILearningResourceRepository`
- `TypeOrmResourceTypeRepository` — production implementation of
  `IResourceTypeRepository`
- `TypeOrmTopicRepository` — production implementation of `ITopicRepository`

### Changed

- `LearningResourceModule` now injects TypeORM repositories via DI
- `AppModule` imports `DatabaseModule`
- `seed` script updated to execute from TypeScript source
- `@nestjs/config` moved from `devDependencies` to `dependencies`

### Removed

- `JsonLearningResourceRepository` and all JSON-based storage adapters
- `JsonStorage<T>` file-based storage utility
- All JSON data files used for temporary persistence

### Fixed

- `resourceTypeId` column type aligned with migration (`uuid` instead of default `varchar`)
- `logger-middleware` now logs `req.path` instead of `req.originalUrl` to avoid
  leaking query parameters (tokens, emails) into logs
- `TypeOrmLearningResourceRepository.update()` guards against empty `updateData`
  to prevent invalid SQL when patch only carries `topicIds`
- `TypeOrmLearningResourceRepository.update()` explicitly maps `url`/`notes`
  `undefined` values to `NULL` so optional fields can be cleared in the database
- `TypeOrmTopicRepository` — removed unused `findByIds` method that was missing
  from the `ITopicRepository` contract
- `DatabaseModule` uses `getOrThrow()` and explicit `parseInt` for `DB_PORT`
  to fail fast on missing or non-numeric environment variables

---

## [0.2.0] - 2026-03-13

### 🚀 API Foundation Release

This release introduces the NestJS REST API layer with JSON-based storage,
full error handling infrastructure, and integration-tested endpoints for
the Learning Resource module.

### Added

#### 🌐 REST API (NestJS)

- `LearningResourceController` with 9 endpoints:
  - `POST /api/v1/learning-resources`
  - `GET /api/v1/learning-resources`
  - `GET /api/v1/learning-resources/filter`
  - `GET /api/v1/learning-resources/:id`
  - `PATCH /api/v1/learning-resources/:id`
  - `DELETE /api/v1/learning-resources/:id`
  - `PATCH /api/v1/learning-resources/:id/difficulty`
  - `PATCH /api/v1/learning-resources/:id/energy`
  - `PATCH /api/v1/learning-resources/:id/status`
- `ValidationPipe` with whitelist and transform
- `GlobalExceptionFilter` for unhandled errors
- API versioning via `/api/v1/` prefix

#### 🗄️ Infrastructure Layer

- `JsonStorage<T>` generic file-based storage adapter
- `JsonLearningResourceRepository`
- `JsonResourceTypeRepository`
- `JsonTopicRepository`
- Seed script (`yarn seed`) with sample data

#### 🛡️ Error Handling

- `toHttpException()` maps domain errors to HTTP status codes
- `GlobalExceptionFilter` catches all unhandled exceptions
- Domain error → HTTP response flow fully integrated

#### 🧪 Tests

- 31 integration tests for `LearningResourceController`
- 2 tests for `GlobalExceptionFilter`
- Full test setup with `overrideProvider`, `ValidationPipe`, and filter

#### 📖 ADRs

- ADR-0001 through ADR-0009 documenting architectural decisions
  made across v0.1.0 and v0.2.0 development

### Fixed

- `tsconfig` dual-path strategy for monorepo type-checking
- `tsx` runtime for ESM path alias resolution

---

## [0.1.0] - 2025-01-22

### 🎉 Foundation Release - Core Architecture Complete

This release establishes the complete architectural foundation of EAP-Ecosystem, implementing Clean Architecture, Hexagonal Architecture, and Module-Based Architecture principles with a fully functional domain and application layer.

### Added

#### 📦 Project Infrastructure

- Yarn 4.9.2 workspaces monorepo setup
- TypeScript 5.9.3 strict configuration
- Vitest 4.0 testing framework with >90% coverage
- ESM module system throughout
- Comprehensive tsconfig.json with path mappings
- Pre-PR validation script (`yarn pre-pr`)

#### 🏗️ Shared Libraries

**domain-lib** - Core Domain Utilities:

- **Entities**:
  - Base `Entity` interface with UUID type
  - `TimestampedEntity` interface for audit fields
  - `Person` entity interface for user data
- **Types**:
  - `UUID` branded type for type safety
  - `Result<T, E>` type for error handling
  - Generic validation types

- **Errors**:
  - `BaseError` abstract class with status codes
  - `InvalidDataError` (400) for validation failures
  - `NotFoundError` (404) for missing resources
  - `UnauthorizedError` (401) for auth failures
  - `UnexpectedError` (500) for system errors
  - Error type guards (`isError`, `isErrorResult`)

- **Services**:
  - `CryptoService` interface (Port) for hashing and UUID generation
  - Mock implementations for testing

- **Validation System** (Complete):
  - **Field Validators**:
    - `stringField` / `optionalString`: String validation with trim, length, pattern
    - `numberField` / `optionalNumber`: Number validation with range, integer, positive
    - `booleanField` / `optionalBoolean`: Boolean type validation
    - `dateField` / `optionalDate`: Date validation with range, parsing
    - `enumField` / `optionalEnum`: Enum validation with normalization
    - `arrayField` / `optionalArray`: Array validation with item validators
    - `objectField` / `optionalObject`: Nested object validation
    - `uuidField` / `optionalUUID`: UUID format validation
    - `urlField`: URL format validation
    - `emailField`: Email validation with normalization
  - **Schema Creation**:
    - `createValidationSchema<T>`: Type-safe schema builder
    - `ValidationSchemaMap<T>`: Field validator mapping
    - `FieldValidationResult<T>`: Validation result type
  - **Error Handling**:
    - `ValidationError`: Detailed field-level errors
    - Composable validators for complex types

- **Utilities**:
  - `ms()`: Promise-based delay utility
  - `sanitizeString()`: String normalization

**infrastructure-lib** - Shared Implementations:

- `CryptoServiceImpl`: Production-ready crypto service
  - bcrypt password hashing (10 rounds)
  - UUID v4 generation
  - Secure random token generation (32 bytes hex)

#### 📚 Learning Resource Module

**Domain Layer** (`learning-resource/domain`) - ✅ Complete:

- **Entities**:
  - `LearningResource`: Rich learning content entity
    - Core fields: title, URL, notes
    - Categorization: topics, resource type
    - Difficulty levels: Low, Medium, High
    - Energy levels: Low, Medium, High
    - Status: Pending, In Progress, Completed
    - Duration tracking with estimation flag
    - Last viewed timestamp
    - Audit timestamps (created/updated)
  - `ResourceType`: Content type categorization
    - Code and display name
    - Active/inactive flag
  - `Topic`: Subject categorization
    - Name and color for UI

- **Repository Ports** (Hexagonal Architecture):
  - `ILearningResourceRepository`:
    - CRUD operations (save, update, delete, findById, findAll)
    - Advanced queries:
      - `findByTopicIds`: OR logic for multiple topics
      - `findByDifficulty`: Filter by difficulty level
      - `findByEnergyLevel`: Filter by required energy
      - `findByStatus`: Filter by completion status
      - `findByResourceTypeId`: Filter by content type
  - `IResourceTypeRepository`: Type management
  - `ITopicRepository`: Topic management

**Application Layer** (`learning-resource/application`) - ✅ Complete:

- **Use Cases** - All fully tested:
  1. **Resource Management**:
     - `addResource`: Create with validation and auto-suggest
       - Validates all fields using validation schema
       - Auto-suggests energy level (difficulty + duration heuristic)
       - Ensures topics and resource types exist
       - Trims string inputs automatically
       - Marks duration as estimated by default
     - `updateResource`: Partial updates with validation
       - Validates only provided fields
       - Supports updating: title, URL, typeId, topicIds, duration, notes
       - Validates entity references exist
       - Updates timestamp automatically
       - Allows clearing optional fields (URL, notes)
     - `deleteResource`: Safe deletion with checks
       - Validates UUID format
       - Checks resource exists before deletion
     - `getResourceById`: Single resource retrieval
       - Returns formatted response model
       - 404 if not found
     - `getResourcesByFilter`: Advanced filtering
       - Supports multiple filter combinations:
         - Topics (OR logic)
         - Difficulty level
         - Energy level
         - Status
         - Resource type
       - Returns all resources if no filters
       - Graceful handling of invalid filters
     - `listFormattedResourcesLearning`: Get formatted list
       - Returns essential fields only
       - Optimized for UI display

  2. **Toggle Operations** (Quick Updates):
     - `toggleResourceDifficulty`: Change difficulty
     - `toggleResourceEnergy`: Change energy level
     - `toggleResourceStatus`: Update status
     - All validate enum values
     - All update timestamps

- **Validation Schemas**:
  - `addResourceSchema`: Complete validation for creation
    - Required: title, resourceTypeId, topicIds (min 1), difficulty, estimatedDurationMinutes
    - Optional: url, energyLevel, status, notes
    - Constraints: title ≤500 chars, notes ≤5000 chars, URL format, positive duration
  - `updateResourceSchema`: Flexible partial updates
  - `deleteResourceSchema`: UUID validation
  - `getResourceByIdSchema`: UUID validation
  - `getResourcesSchema`: Filter validation with nested object
  - Toggle schemas: ID + enum validation

- **Utilities**:
  - `calculateEnergyLevel(difficulty, duration)`: Smart energy suggestion
    - HIGH: difficulty=HIGH OR duration>120min
    - MEDIUM: difficulty=MEDIUM OR duration>60min
    - LOW: otherwise

- **Errors**:
  - `LearningResourceNotFoundError`: 404 status code

- **Testing Mocks** - Complete test infrastructure:
  - `mockLearningResourceRepository`: Full in-memory implementation
    - All repository operations
    - Reset/clear utilities
    - Count helper
  - `mockResourceTypeRepository`: In-memory type storage
  - `mockTopicRepository`: In-memory topic storage

#### 🧪 Comprehensive Testing

**Test Coverage Statistics**:

- Domain lib: >85% coverage
- Application layer: >95% coverage
- Total test suites: 15+
- Total tests: 150+

**Test Categories**:

1. **Unit Tests** - Use case logic:
   - Happy path scenarios
   - Error scenarios
   - Edge cases (empty, whitespace, boundaries)
   - Validation failures
   - Entity existence checks
   - Auto-suggest logic
   - Timestamp updates
   - Field trimming and normalization

2. **Validation Tests** - Field validators:
   - Required/optional behavior
   - Type checking
   - Length constraints
   - Pattern matching
   - Range validation
   - Enum validation
   - Nested object validation
   - Array validation with item validators
   - Edge cases (empty arrays, null values, special chars)

3. **Integration Tests** - Cross-layer:
   - Use case + repository interaction
   - Validation + use case flow
   - Error propagation

**Test Quality**:

- Arrange-Act-Assert pattern
- Descriptive test names
- beforeEach setup for isolation
- No test interdependencies
- Fast execution (<5s total)

#### 📖 Documentation

- **README.md**:
  - Complete project overview
  - Problem statement and solution
  - Architecture principles
  - Getting started guide
  - Technology stack
  - Detailed roadmap

- **ARCHITECTURE.md**:
  - Architectural principles (SOLID, Clean Code, DDD)
  - Pattern explanations (Clean, Hexagonal, Module-Based)
  - Layer responsibilities
  - Module organization
  - Dependency rules
  - Design decisions with rationale
  - Code examples

- **CHANGELOG.md**:
  - Detailed version history
  - Feature documentation
  - Future roadmap

### Architecture Highlights

**Key Decisions**:

1. **Functional Use Cases**: Functions over classes
   - Simpler testing
   - Explicit dependencies
   - No hidden state
   - Easier composition
   - Better tree-shaking

2. **Errors as Values**: Return errors, don't throw
   - Explicit error handling
   - Type-safe error handling
   - No hidden control flow
   - Clear error paths

3. **Dependency Injection**: Explicit dependencies
   - High testability
   - Easy to swap implementations
   - Clear contracts
   - No magic

4. **Hexagonal Architecture**: Domain isolation
   - Technology-independent core
   - Ports (interfaces) define contracts
   - Adapters (implementations) can be swapped
   - Clear boundaries

5. **Module-Based Organization**: Each module is a hexagon
   - High cohesion within modules
   - Low coupling between modules
   - Independent evolution
   - Future microservices ready

**Project Structure**:

```

EAP-Ecosystem/
├── shared/
│ ├── domain-lib/ ✅ Complete (v0.1.0)
│ │ ├── entities/
│ │ ├── errors/
│ │ ├── services/
│ │ ├── types/
│ │ ├── utils/
│ │ └── validations/ ✅ Comprehensive
│ └── infrastructure-lib/ ✅ Complete (v0.1.0)
│ └── services/
├── learning-resource/
│ ├── domain/ ✅ Complete (v0.1.0)
│ │ ├── entities/
│ │ └── repositories/
│ ├── application/ ✅ Complete (v0.1.0)
│ │ ├── use-cases/
│ │ ├── errors/
│ │ ├── mocks/
│ │ └── utils/
│ └── infrastructure/ 📅 Planned (v0.2.0)
├── user/ 📅 Planned (v0.5.0)
├── recommendation/ 📅 Planned (v0.5.0)
└── api/ 📅 Planned (v0.2.0)

```

### Development Experience

- **Type Safety**: 100% TypeScript with strict mode enabled
- **Fast Tests**: Vitest with instant feedback (<5s)
- **Monorepo Benefits**: Easy code sharing across modules
- **Clean Imports**: Path mappings (@learning-resource/\*, domain-lib)
- **Modern Stack**: ESM, latest TypeScript features
- **DX Tools**:
  - `yarn test`: Run all tests
  - `yarn build`: Build all packages
  - `yarn pre-pr`: Full validation before PR

### Performance

- Test execution: <5 seconds for 150+ tests
- Build time: <10 seconds for all packages
- Type checking: <3 seconds

### Known Limitations (by design for v0.1.0)

- ✅ No persistence layer (in-memory repositories only)
- ✅ No API layer (pure domain + application)
- ✅ No authentication (not needed yet)
- ✅ No frontend (backend-first approach)
- ✅ No external integrations (core first)

These are intentional omissions for v0.1.0 to focus on solid foundations.

### Migration Notes

This release is the foundation. No migrations needed.

### Contributors

- Thiago Delgado (@ThiagoDelgado-D) - Architecture, Implementation, Documentation

---

```

```
