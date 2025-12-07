# Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [Architectural Principles](#architectural-principles)
- [Architectural Patterns](#architectural-patterns)
- [Layer Responsibilities](#layer-responsibilities)
- [Module Organization](#module-organization)
- [Data Flow](#data-flow)
- [Dependency Rules](#dependency-rules)
- [Design Decisions](#design-decisions)
- [Future Considerations](#future-considerations)

---

## Overview

EAP-Ecosystem implements a **multi-layered architecture** combining Clean Architecture, Hexagonal Architecture (Ports & Adapters), and Module-Based Architecture principles. The system is designed to be:

- **Testable**: Every layer can be tested independently
- **Maintainable**: Clear separation of concerns
- **Flexible**: Easy to swap implementations
- **Scalable**: Ready for horizontal and vertical scaling

---

## Architectural Principles

### 1. SOLID Principles

#### Single Responsibility Principle (SRP)

Each class, function, or module has one reason to change.

**Example**:

```typescript
// ❌ Violates SRP - handles validation AND persistence
class ResourceService {
  validate(data: any) {
    /* ... */
  }
  save(data: any) {
    /* ... */
  }
}

// ✅ Follows SRP - separated concerns
class ResourceValidator {
  validate(data: any) {
    /* ... */
  }
}
class ResourceRepository {
  save(data: any) {
    /* ... */
  }
}
```

#### Open/Closed Principle (OCP)

Open for extension, closed for modification.

**Implementation**:

```typescript
// Base interface - closed for modification
interface ILearningResourceRepository {
  save(resource: LearningResource): Promise<void>;
  findById(id: UUID): Promise<LearningResource | null>;
}

// Extensions - open for new implementations
class PostgresResourceRepository implements ILearningResourceRepository {}
class MongoResourceRepository implements ILearningResourceRepository {}
class InMemoryResourceRepository implements ILearningResourceRepository {}
```

#### Liskov Substitution Principle (LSP)

Derived classes must be substitutable for their base classes.

**Implementation**:

```typescript
// Any repository implementation can replace another
function useRepository(repo: ILearningResourceRepository) {
  // Works with ANY implementation
}

useRepository(new PostgresResourceRepository());
useRepository(new InMemoryResourceRepository());
```

#### Interface Segregation Principle (ISP)

Clients shouldn't depend on interfaces they don't use.

**Example**:

```typescript
// ❌ Fat interface
interface IRepository {
  save(): void;
  update(): void;
  delete(): void;
  findById(): void;
  findByTopic(): void;
  findByDifficulty(): void;
  // ... 10 more methods
}

// ✅ Segregated interfaces
interface IWriteRepository {
  save(): void;
  update(): void;
  delete(): void;
}

interface IReadRepository {
  findById(): void;
  findByTopic(): void;
}
```

#### Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions.

**Implementation**:

```typescript
// ❌ Depends on concrete implementation
class AddResourceUseCase {
  private repo = new PostgresResourceRepository(); // Direct dependency
}

// ✅ Depends on abstraction
class AddResourceUseCase {
  constructor(private repo: ILearningResourceRepository) {} // Abstraction
}
```

### 2. Clean Code Principles

- **Meaningful Names**: `addResource` not `doStuff`
- **Small Functions**: Each function does one thing
- **Single Level of Abstraction**: Don't mix high and low level code
- **No Side Effects**: Pure functions when possible
- **Error Handling**: Clear error types and messages

### 3. Domain-Driven Design (DDD)

- **Ubiquitous Language**: Code reflects business terminology
- **Bounded Contexts**: Clear module boundaries
- **Entities**: Objects with identity (`LearningResource`)
- **Value Objects**: Immutable objects (`Duration`, `UUID`)
- **Aggregates**: Consistency boundaries

---

## Architectural Patterns

### Module-Based Architecture

EAP-Ecosystem applies **Module-Based Architecture** as the top-level organizational pattern. The system is divided into **bounded contexts** (from Domain-Driven Design), where each module represents a cohesive area of the business domain.

#### Why Module-Based Architecture?

Traditional layered architectures organize code by technical concerns:

```
❌ Traditional Layers (Technical Separation)
src/
├── controllers/    # All controllers
├── services/       # All services
├── repositories/   # All repositories
└── entities/       # All entities
```

Module-Based Architecture organizes by **business domains**:

```
✅ Module-Based (Domain Separation)
src/
├── learning-resource/   # Everything related to learning resources
├── user/               # Everything related to users
└── recommendation/     # Everything related to recommendations
```

**Benefits**:

- **Bounded Contexts**: Clear domain boundaries
- **Independent Development**: Teams can work on different modules
- **Scalability**: Modules can become microservices later
- **Maintainability**: Find all related code in one place
- **Testability**: Test entire domains in isolation

### Hexagonal Architecture Applied to Each Module

While **Module-Based Architecture** defines the **horizontal** organization (separation by domain), **Hexagonal Architecture** defines the **vertical** organization within each module (separation by layer).

#### The Hexagon Within Each Module

```
                Module: learning-resource
        ┌─────────────────────────────────────┐
        │                                     │
        │    ┌─────────────────────┐          │
        │    │  Primary Adapters   │          │
        │    │   (API, CLI, UI)    │          │
        │    └──────────┬──────────┘          │
        │               │                     │
        │    ┌──────────▼──────────┐          │
        │    │   Primary Ports     │          │
        │    │  (Use Case Input)   │          │
        │    └──────────┬──────────┘          │
        │               │                     │
        │    ┌──────────▼──────────┐          │
        │    │    Application      │          │
        │    │    (Use Cases)      │          │
        │    └──────────┬──────────┘          │
        │               │                     │
        │    ┌──────────▼──────────┐          │
        │    │      Domain         │          │
        │    │  (Business Logic)   │          │
        │    └──────────┬──────────┘          │
        │               │                     │
        │    ┌──────────▼──────────┐          │
        │    │  Secondary Ports    │          │
        │    │    (Interfaces)     │          │
        │    └──────────┬──────────┘          │
        │               │                     │
        │    ┌──────────▼──────────┐          │
        │    │ Secondary Adapters  │          │
        │    │  (DB, Cache, API)   │          │
        │    └─────────────────────┘          │
        │                                     │
        └─────────────────────────────────────┘
```

**Each module is a self-contained hexagon:**

1. **Domain (Center)**: Pure business logic, entities, business rules
2. **Application**: Use cases that orchestrate domain objects
3. **Ports**: Interfaces (contracts) that define how to interact with the module
4. **Adapters**: Implementations of ports (concrete technology choices)

#### Port Types in Each Module

**Primary Ports (Driving/Inbound)**:

- Define what the application **offers** to the outside world
- Examples: Use case interfaces, command handlers

```typescript
// Primary Port - What the module offers
export const addResource = async (
  deps: AddResourceDependencies, // Dependencies injected
  request: AddResourceRequestModel // Input
): Promise<void | Error> => {
  // Use case implementation
};
```

**Secondary Ports (Driven/Outbound)**:

- Define what the application **requires** from external systems
- Examples: Repository interfaces, external service interfaces

```typescript
// Secondary Port - What the module requires
export interface ILearningResourceRepository {
  save(resource: LearningResource): Promise<void>;
  findById(id: UUID): Promise<LearningResource | null>;
  // ...
}
```

#### Complete Module Hexagon Example

```typescript
// ============================================
// DOMAIN LAYER (Center of Hexagon)
// ============================================
// learning-resource/domain/entities/learning-resource.ts
export interface LearningResource extends Entity {
  title: string;
  difficulty: DifficultyType;
  energyLevel: EnergyLevelType;
  // Pure business entity - no dependencies
}

// ============================================
// SECONDARY PORTS (Required Interfaces)
// ============================================
// learning-resource/domain/repositories/ILearning-resource-repository.ts
export interface ILearningResourceRepository {
  save(resource: LearningResource): Promise<void>;
  findById(id: UUID): Promise<LearningResource | null>;
}

// ============================================
// APPLICATION LAYER (Use Cases)
// ============================================
// learning-resource/application/use-cases/add-resource.ts
export interface AddResourceDependencies {
  learningResourceRepository: ILearningResourceRepository; // Secondary Port
  validator: LearningResourceValidator;
  cryptoService: CryptoService;
}

// PRIMARY PORT (Exposed Use Case)
export const addResource = async (
  deps: AddResourceDependencies,
  request: AddResourceRequestModel
): Promise<void | InvalidDataError> => {
  // 1. Validate input
  const validation = await deps.validator.isValidAddPayload(request);
  if (!validation.isValid) {
    return new InvalidDataError(validation.errors);
  }

  // 2. Create domain entity
  const resource: LearningResource = {
    id: await deps.cryptoService.generateUUID(),
    title: request.title,
    difficulty: request.difficulty,
    // ...
  };

  // 3. Use secondary port (repository)
  await deps.learningResourceRepository.save(resource);
};

// ============================================
// INFRASTRUCTURE LAYER (Adapters)
// ============================================
// learning-resource/infrastructure/repositories/postgres-repository.ts
export class PostgresLearningResourceRepository
  implements ILearningResourceRepository {  // SECONDARY ADAPTER

  constructor(private db: Database) {}

  async save(resource: LearningResource): Promise<void> {
    // Concrete implementation using PostgreSQL
    await this.db.query('INSERT INTO learning_resources ...', [...]);
  }

  async findById(id: UUID): Promise<LearningResource | null> {
    const row = await this.db.query('SELECT * FROM ...', [id]);
    return row ? this.mapToDomain(row) : null;
  }
}

// ============================================
// PRESENTATION LAYER (Primary Adapter)
// ============================================
// api/controllers/learning-resource.controller.ts
@Controller('learning-resources')
export class LearningResourceController {  // PRIMARY ADAPTER
  constructor(
    private readonly repository: ILearningResourceRepository,
    private readonly validator: LearningResourceValidator,
    private readonly cryptoService: CryptoService
  ) {}

  @Post()
  async create(@Body() dto: CreateResourceDto) {
    // Call the PRIMARY PORT (use case)
    const result = await addResource(
      {
        learningResourceRepository: this.repository,
        validator: this.validator,
        cryptoService: this.cryptoService
      },
      dto
    );

    if (result instanceof InvalidDataError) {
      throw new BadRequestException(result.context);
    }

    return { message: 'Resource created' };
  }
}
```

### How Modules Communicate

Modules should be as independent as possible but sometimes need to communicate:

#### 1. Through Shared Abstractions (Preferred)

```typescript
// Both modules depend on shared/domain-lib
import { UUID, Entity } from "domain-lib";

// learning-resource module
export interface LearningResource extends Entity {}

// user module
export interface User extends Entity {}
```

#### 2. Through Events (Future - Async Communication)

Event-driven communication will be implemented in future phases to enable loose coupling between modules. This will allow modules to react to changes in other modules without direct dependencies.

For example, when a learning resource is completed, it could publish an event that recommendation modules listen to for updating user preferences.

#### 3. Through Application Services (Sync Communication)

```typescript
// recommendation module needs user data
class RecommendationService {
  constructor(
    private userService: IUserService // Port defined by recommendation module
  ) {}
}

// Infrastructure provides adapter
class UserServiceAdapter implements IUserService {
  // Calls user module's use cases
  async getUserPreferences(userId: UUID) {
    return await getUserPreferences({ userRepository }, { userId });
  }
}
```

### Combining Module-Based + Hexagonal Architecture

```
System Level: Module-Based Architecture
├── Module: learning-resource/
│   └── Internal: Hexagonal Architecture
│       ├── Domain (Center)
│       ├── Application (Use Cases)
│       ├── Ports (Interfaces)
│       └── Adapters (Implementations)
│
├── Module: user/
│   └── Internal: Hexagonal Architecture
│       └── ...
│
└── Module: recommendation/
    └── Internal: Hexagonal Architecture
        └── ...
```

**Key Insight**:

> Each **module** is a hexagon. The **system** is a collection of hexagons organized by domain.

### Clean Architecture

```
                    ┌─────────────────────────┐
                    │    External World       │
                    │  (Frameworks, Devices)  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Interface Adapters    │
                    │  (Controllers, Gateways)│
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Application Business  │
                    │      Rules (Use Cases)  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │    Enterprise Business  │
                    │     Rules (Entities)    │
                    └─────────────────────────┘
```

**Key Rules**:

1. **Dependency Rule**: Source code dependencies point inward
2. **Data Flow**: Can cross boundaries in any direction
3. **Isolation**: Inner circles don't know about outer circles

### Hexagonal Architecture (Ports & Adapters)

```
                    ┌─────────────────────────┐
                    │    Primary Adapters     │
                    │   (Driving/Input)       │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │   REST API      │    │
                    │  │   (NestJS)      │    │
                    │  └────────┬────────┘    │
                    └───────────┼─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │      Primary Ports      │
                    │    (Use Case Input)     │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        │              ┌────────▼────────┐              │
        │              │                 │              │
        │              │   Application   │              │
        │              │    (Use Cases)  │              │
        │              │                 │              │
        │              └────────┬────────┘              │
        │                       │                       │
        │              ┌────────▼────────┐              │
        │              │                 │              │
        │              │     Domain      │              │
        │              │   (Core Logic)  │              │
        │              │                 │              │
        │              └────────┬────────┘              │
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │    Secondary Ports      │
                    │  (Repository Interface) │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Secondary Adapters    │
                    │   (Driven/Output)       │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │   PostgreSQL    │    │
                    │  └─────────────────┘    │
                    │  ┌─────────────────┐    │
                    │  │     Redis       │    │
                    │  └─────────────────┘    │
                    └─────────────────────────┘
```

**Ports**:

- **Primary Ports**: Interfaces exposed by application (use case interfaces)
- **Secondary Ports**: Interfaces required by application (repository interfaces)

**Adapters**:

- **Primary Adapters**: Implement driving (API controllers, CLI)
- **Secondary Adapters**: Implement driven (database repositories, external services)

---

## Layer Responsibilities

### 1. Domain Layer (Core)

**Location**: `*/domain/`

**Responsibilities**:

- Define core business entities
- Define repository interfaces (Ports)
- Business logic and rules
- Value objects
- Domain events (future)

**Rules**:

- ✅ Pure business logic
- ✅ No dependencies on outer layers
- ✅ Framework-agnostic
- ❌ No database code
- ❌ No HTTP code
- ❌ No external library dependencies

**Example**:

```typescript
// learning-resource/domain/src/entities/learning-resource.ts
export interface LearningResource extends Entity, TimestampedEntity {
  title: string;
  url?: string;
  typeId: UUID;
  topicIds: UUID[];
  difficulty: DifficultyType;
  estimatedDuration: Duration;
  energyLevel: EnergyLevelType;
  status: ResourceStatusType;
}

// learning-resource/domain/src/repositories/ILearning-resource-repository.ts
export interface ILearningResourceRepository {
  save(resource: LearningResource): Promise<void>;
  findById(id: UUID): Promise<LearningResource | null>;
  // ... other methods
}
```

### 2. Application Layer (Use Cases)

**Location**: `*/application/`

**Responsibilities**:

- Orchestrate business operations
- Implement use cases
- Validate input data
- Coordinate between domain and infrastructure
- Transform data (DTOs)

**Rules**:

- ✅ Can depend on Domain layer
- ✅ Defines abstract dependencies (interfaces)
- ✅ Contains business workflows
- ❌ No direct framework dependencies
- ❌ No direct database code

**Example**:

```typescript
// learning-resource/application/src/use-cases/add-resource.ts
export interface AddResourceDependencies {
  learningResourceRepository: ILearningResourceRepository; // Port
  validator: LearningResourceValidator;
  cryptoService: CryptoService;
}

export const addResource = async (
  deps: AddResourceDependencies,
  request: AddResourceRequestModel
): Promise<void | InvalidDataError | NotFoundError> => {
  // 1. Validate input
  const validation = await deps.validator.isValidAddPayload(request);
  if (!validation.isValid) {
    return new InvalidDataError(validation.errors);
  }

  // 2. Business logic
  const energyLevel = calculateEnergyLevel(
    request.difficulty,
    request.estimatedDurationMinutes
  );

  // 3. Create entity
  const resource: LearningResource = {
    id: await deps.cryptoService.generateUUID(),
    title: request.title.trim(),
    // ... other fields
  };

  // 4. Persist
  await deps.learningResourceRepository.save(resource);
};
```

### 3. Infrastructure Layer (Adapters)

**Location**: `*/infrastructure/`

**Responsibilities**:

- Implement repository interfaces
- Database access
- External service integration
- Framework-specific code
- Cache implementation

**Rules**:

- ✅ Implements domain interfaces
- ✅ Contains all framework code
- ✅ Handles technical concerns
- ❌ No business logic

**Example (Future)**:

```typescript
// learning-resource/infrastructure/src/repositories/postgres-learning-resource-repository.ts
export class PostgresLearningResourceRepository
  implements ILearningResourceRepository {

  constructor(private db: Database) {}

  async save(resource: LearningResource): Promise<void> {
    await this.db.query(
      'INSERT INTO learning_resources ...',
      [resource.id, resource.title, ...]
    );
  }

  async findById(id: UUID): Promise<LearningResource | null> {
    const row = await this.db.query(
      'SELECT * FROM learning_resources WHERE id = $1',
      [id]
    );
    return row ? this.mapToDomain(row) : null;
  }
}
```

### 4. Presentation Layer (Future - API)

**Location**: API project (NestJS)

**Responsibilities**:

- HTTP request/response handling
- Input validation (format)
- Authentication/Authorization
- API documentation
- Error transformation to HTTP

**Example (Planned)**:

```typescript
// api/src/controllers/learning-resource.controller.ts
@Controller("learning-resources")
export class LearningResourceController {
  constructor(private readonly addResourceUseCase: AddResourceUseCase) {}

  @Post()
  async create(@Body() dto: CreateResourceDto) {
    const result = await this.addResourceUseCase.execute(dto);

    if (result instanceof InvalidDataError) {
      throw new BadRequestException(result.context);
    }

    return { message: "Resource created successfully" };
  }
}
```

---

## Module Organization

### Module-Based Architecture

The EAP-Ecosystem implements a **Module-Based Architecture** where the system is divided into independent, self-contained modules (bounded contexts). Each module represents a specific area of the business domain and applies **Hexagonal Architecture** internally.

#### Core Principles

1. **High Cohesion**: Related functionality stays together within a module
2. **Low Coupling**: Modules communicate through well-defined interfaces
3. **Clear Boundaries**: Each module has explicit inputs and outputs
4. **Independent Evolution**: Modules can evolve independently without breaking others

#### Module Structure

Each bounded context follows this structure:

```
learning-resource/           # Bounded Context: Learning Resource Management
│
├── domain/                 # Core business logic (Inner hexagon)
│   ├── entities/          # Business entities
│   │   ├── learning-resource.ts
│   │   ├── resource-type.ts
│   │   └── topic.ts
│   │
│   └── repositories/      # Port interfaces (Required by domain)
│       ├── ILearning-resource-repository.ts
│       ├── IResource-type-repository.ts
│       └── ITopic-repository.ts
│
├── application/           # Use cases and orchestration (Application hexagon)
│   ├── use-cases/        # Business workflows
│   │   ├── learning-resource/
│   │   │   ├── add-resource.ts
│   │   │   ├── update-resource.ts
│   │   │   ├── delete-resource.ts
│   │   │   ├── get-resource-by-id.ts
│   │   │   └── get-resources-by-filter.ts
│   │   └── toggles/
│   │       ├── toggle-resource-difficulty.ts
│   │       ├── toggle-resource-energy.ts
│   │       └── toggle-resource-status.ts
│   │
│   ├── validators/       # Input validation (Ports)
│   │   └── learning-resource-validator.ts
│   │
│   ├── errors/           # Application-specific errors
│   │   └── learning-resource-not-found.ts
│   │
│   └── mocks/            # Testing utilities
│       ├── mock-learning-resource-repository.ts
│       ├── mock-resource-type-repository.ts
│       ├── mock-topic-repository.ts
│       └── validators/
│           └── mock-learning-resource-validator.ts
│
└── infrastructure/        # Technical implementations (Outer hexagon - Adapters)
    ├── repositories/     # Database implementations (Secondary Adapters)
    │   ├── postgres-learning-resource-repository.ts (Planned)
    │   ├── postgres-resource-type-repository.ts (Planned)
    │   └── postgres-topic-repository.ts (Planned)
    │
    ├── validators/       # Concrete validator implementations
    │   └── learning-resource-validator-impl.ts (Planned)
    │
    ├── adapters/        # External service adapters
    │   ├── notion-adapter.ts (Planned)
    │   └── cache-adapter.ts (Planned)
    │
    └── config/          # Configuration
        └── database-config.ts (Planned)
```

#### Current Modules

**1. learning-resource/** - Learning Resource Management

- **Purpose**: Manage the user's library of learning content
- **Entities**: LearningResource, ResourceType, Topic
- **Status**: ✅ Domain and Application layers complete

**2. user/** - User Management

- **Purpose**: Manage user profiles, preferences, and authentication
- **Entities**: User
- **Status**: 📅 Planned

**3. recommendation/** - Smart Recommendations

- **Purpose**: Provide intelligent content suggestions based on energy, context, and history
- **Entities**: Recommendation, UserSession, EnergyProfile
- **Status**: 📅 Planned

### The `shared/` Philosophy

The `shared/` directory is the **cross-cutting concern layer** that contains code used across multiple modules.

#### Philosophy

> **"If code is repeated in multiple places, adapt it into `shared/` to simplify flows and avoid duplication"**

#### What Lives in `shared/`

```
shared/
│
├── domain-lib/              # Common domain utilities
│   │
│   ├── entities/           # Base entity types
│   │   ├── entity.ts                    # Base Entity interface
│   │   ├── timestamped-entity.ts        # Timestamps mixin
│   │   └── person.ts                    # Person entity (for User)
│   │
│   ├── types/              # Shared types
│   │   └── uuid.ts                      # UUID type definition
│   │
│   ├── errors/             # Common error types
│   │   ├── base-error.ts                # Base error class
│   │   └── generic-errors/
│   │       ├── invalid-data-error.ts    # 400 errors
│   │       ├── not-found-error.ts       # 404 errors
│   │       ├── unauthorized-error.ts    # 401 errors
│   │       └── unexpected-error.ts      # 500 errors
│   │
│   ├── services/           # Service interfaces (Ports)
│   │   └── crypto-service.ts            # Password hashing, UUID generation
│   │
│   ├── validations/        # Validation framework (In Progress)
│   │   └── validation.ts                # ValidationResult type
│   │
│   └── utils/              # Shared utilities
│       └── ms.ts                        # Time utilities
│
└── infrastructure-lib/     # Common infrastructure implementations
    │
    └── services/           # Service implementations (Adapters)
        └── crypto-service-impl.ts       # bcrypt implementation
```

#### Decision Criteria: "Should This Go in `shared/`?"

Use this decision tree:

```
Is the code used by 2+ modules?
├─ NO  → Keep it in the specific module
└─ YES → Is it domain-specific business logic?
          ├─ YES → Keep it in the specific module (avoid generic abstractions)
          └─ NO  → Is it a technical concern (types, errors, services)?
                   ├─ YES → Move to shared/
                   └─ NO  → Evaluate case-by-case
```

**Examples**:

✅ **Should be in `shared/`**:

- `UUID` type - used everywhere
- `Entity` interface - base for all entities
- `InvalidDataError` - common error across modules
- `CryptoService` - technical utility

❌ **Should NOT be in `shared/`**:

- `LearningResource` entity - specific to learning-resource module
- `addResource` use case - specific business logic
- `ILearningResourceRepository` - specific port

#### Benefits of `shared/`

1. **DRY Principle**: Don't Repeat Yourself across modules
2. **Consistency**: Shared types ensure consistency (e.g., all UUIDs are the same type)
3. **Single Source of Truth**: Error types defined once
4. **Simplified Testing**: Shared mocks for common services
5. **Reduced Coupling**: Modules depend on abstractions, not implementations

#### Evolution of `shared/`

As the project grows, code moves into `shared/` when:

```
Phase 1: Code exists in Module A
         ↓
Phase 2: Need same code in Module B
         ↓
Phase 3: Extract to shared/ as abstraction
         ↓
Phase 4: Both modules depend on shared/
```

**Example Evolution**:

```typescript
// Initially in learning-resource/domain
interface Entity {
  id: UUID;
}

// Later, user/ module needs the same
// → Extract to shared/domain-lib/entities/entity.ts

// Now both modules use it
import { Entity } from "domain-lib";
```

---

## Data Flow

### Command Flow (Write Operations)

```
1. API Request (REST/GraphQL)
          ↓
2. Controller validates format
          ↓
3. Use Case receives request
          ↓
4. Use Case validates business rules
          ↓
5. Use Case creates/modifies Entity
          ↓
6. Use Case calls Repository (Port)
          ↓
7. Repository Adapter persists to DB
          ↓
8. Response flows back up
```

**Example**: Adding a Learning Resource

```typescript
// 1. API receives POST /learning-resources
// 2. Controller validates DTO format
// 3. Controller calls Use Case
const result = await addResource(deps, {
  title: "TypeScript Advanced",
  difficulty: "high",
  // ...
});

// 4. Use Case validates business rules
const validation = await validator.isValidAddPayload(request);

// 5. Use Case creates Entity
const resource: LearningResource = { /* ... */ };

// 6. Use Case calls Repository
await repository.save(resource);

// 7. Repository persists
INSERT INTO learning_resources ...

// 8. Response
return { id: resource.id };
```

### Query Flow (Read Operations - Future CQRS)

```
1. API Request (GET)
          ↓
2. Query Handler (bypasses Use Cases)
          ↓
3. Read Model (denormalized)
          ↓
4. Cache Check (Redis)
          ↓
5. Database Query (if cache miss)
          ↓
6. Response
```

---

## Dependency Rules

### The Dependency Rule

> **Source code dependencies must point inward only**

```
External Layer (Frameworks, Devices)
        ↓ depends on
Interface Adapters (Controllers, Presenters)
        ↓ depends on
Application Business Rules (Use Cases)
        ↓ depends on
Enterprise Business Rules (Entities)
```

### What Each Layer Can Depend On

| Layer              | Can Depend On                 |
| ------------------ | ----------------------------- |
| **Domain**         | Nothing (pure business logic) |
| **Application**    | Domain only                   |
| **Infrastructure** | Domain, Application           |
| **Presentation**   | Domain, Application           |

### Dependency Injection Pattern

```typescript
// ❌ Bad: Direct dependency
class AddResourceUseCase {
  private repo = new PostgresRepository(); // Concrete class
}

// ✅ Good: Injected abstraction
class AddResourceUseCase {
  constructor(
    private repo: ILearningResourceRepository // Interface (Port)
  ) {}
}

// Composition root (Infrastructure layer)
const useCase = new AddResourceUseCase(
  new PostgresRepository(db) // Concrete implementation (Adapter)
);
```

---

## Design Decisions

### 1. Why Functional Use Cases Instead of Classes?

**Decision**: Use cases are implemented as pure functions

**Rationale**:

- ✅ Simpler to test
- ✅ Explicit dependencies (no hidden state)
- ✅ Easier to compose
- ✅ No inheritance complexity
- ✅ Immutability by default

```typescript
// ✅ Functional approach
export const addResource = async (
  deps: AddResourceDependencies,
  request: AddResourceRequestModel
): Promise<Result> => {
  /* ... */
};

// ❌ Class-based approach (more boilerplate)
export class AddResourceUseCase {
  constructor(private deps: Dependencies) {}
  async execute(request: Request): Promise<Result> {
    /* ... */
  }
}
```

### 2. Why Return Errors Instead of Throwing?

**Decision**: Use cases return errors as values

**Rationale**:

- ✅ Explicit error handling
- ✅ Type-safe error handling
- ✅ No hidden control flow
- ✅ Easier to test

```typescript
// ✅ Error as return value
const result = await addResource(deps, request);
if (result instanceof InvalidDataError) {
  // Handle error
}

// ❌ Exception throwing
try {
  await addResource(deps, request);
} catch (error) {
  // Implicit control flow
}
```

### 3. Why Monorepo with Yarn Workspaces?

**Decision**: Single repository with multiple packages

**Rationale**:

- ✅ Shared dependencies
- ✅ Atomic commits across modules
- ✅ Easier refactoring
- ✅ Single CI/CD pipeline
- ✅ Better developer experience

### 4. Why TypeScript 5.9?

**Decision**: Latest stable TypeScript version

**Rationale**:

- ✅ Better type inference
- ✅ Improved performance
- ✅ New features (const type parameters, etc.)
- ✅ Better error messages

### 5. Why Vitest Over Jest?

**Decision**: Use Vitest for testing

**Rationale**:

- ✅ Faster (Vite-powered)
- ✅ Better ESM support
- ✅ Compatible API with Jest
- ✅ Better TypeScript integration
- ✅ Built-in coverage

---

## Future Considerations

### 1. CQRS Implementation

**Command Side** (Write):

```
API → Command Handler → Use Case → Write Repository → PostgreSQL
```

**Query Side** (Read):

```
API → Query Handler → Read Model → Redis/Denormalized View
```

**Event Flow**:

```
Write Model → Domain Event → Event Handler → Update Read Model
```

### 2. Event Sourcing (Optional)

Store all changes as events:

```typescript
interface ResourceCreatedEvent {
  eventId: UUID;
  aggregateId: UUID;
  timestamp: Date;
  data: {
    title: string;
    // ...
  };
}
```

### 3. Caching Strategy

**Multi-layer cache**:

```
1. Application Cache (in-memory)
2. Redis Cache (distributed)
3. Database
```

**Cache invalidation**:

- Write-through: Update cache on write
- Cache-aside: Lazy load on read
- Event-based: Invalidate on domain events

### 4. API Gateway Pattern

```
Client → API Gateway → Microservices
              ↓
         [Auth, Rate Limit, Logging]
```

### 5. Observability

**Planned**:

- Structured logging
- Distributed tracing (OpenTelemetry)
- Metrics (Prometheus)
- Error tracking (Sentry)

---

## Architecture Evolution

### Current State (v0.1)

```
✅ Domain Layer: Complete
✅ Application Layer: Complete
✅ Testing Infrastructure: Complete
🚧 Validation System: Consolidating
📅 Infrastructure Layer: Planned
📅 API Layer: Design phase
📅 Frontend: Planned
```

### Target State (v1.0)

```
┌─────────────────────────────────────────┐
│            Frontend (Angular)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          API Gateway (NestJS)           │
│     [Auth, Rate Limit, Validation]      │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌───────────────┐  ┌───────────────┐
│  Application  │  │  Application  │
│  (Use Cases)  │  │  (Use Cases)  │
└───────┬───────┘  └───────┬───────┘
        │                  │
        ▼                  ▼
┌───────────────┐  ┌───────────────┐
│    Domain     │  │    Domain     │
└───────┬───────┘  └───────┬───────┘
        │                  │
        └────────┬─────────┘
                 ▼
        ┌─────────────────┐
        │  Infrastructure │
        │  ┌──────────┐   │
        │  │PostgreSQL│   │
        │  └──────────┘   │
        │  ┌──────────┐   │
        │  │  Redis   │   │
        │  └──────────┘   │
        └─────────────────┘
```

---

## Conclusion

This architecture provides:

1. **Separation of Concerns**: Each layer has a clear purpose
2. **Testability**: Easy to test in isolation
3. **Flexibility**: Easy to swap implementations
4. **Maintainability**: Clear structure and dependencies
5. **Scalability**: Ready for growth
6. **Developer Experience**: Clear guidelines and patterns

The architecture is designed to evolve with the project while maintaining its core principles.
