## [Unreleased] — v0.6.0 URL Import

### Planned

- Backend metadata scraping endpoint for learning resources
- Title, description and resource type auto-detection via Open Graph / oEmbed
- Supported sites: YouTube, Medium, Dev.to, GitHub, any Open Graph site
- Angular frontend: URL input with live preview before saving
- Auto-populate title, notes and typeId from scraped metadata
- Fallback to manual entry when scraping fails or site is unsupported

---

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
│   ├── domain-lib/              ✅ Complete (v0.1.0)
│   │   ├── entities/
│   │   ├── errors/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── validations/        ✅ Comprehensive
│   └── infrastructure-lib/      ✅ Complete (v0.1.0)
│       └── services/
├── learning-resource/
│   ├── domain/                  ✅ Complete (v0.1.0)
│   │   ├── entities/
│   │   └── repositories/
│   ├── application/             ✅ Complete (v0.1.0)
│   │   ├── use-cases/
│   │   ├── errors/
│   │   ├── mocks/
│   │   └── utils/
│   └── infrastructure/          📅 Planned (v0.2.0)
├── user/                        📅 Planned (v0.5.0)
├── recommendation/              📅 Planned (v0.5.0)
└── api/                         📅 Planned (v0.2.0)
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
