## [Unreleased]

### Planned for v0.3.0

- PostgreSQL migration replacing JSON storage
- Angular frontend (Phase 3)
- User module foundation

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
