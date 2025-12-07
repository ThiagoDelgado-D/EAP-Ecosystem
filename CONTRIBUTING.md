# Contributing to EAP-Ecosystem

First off, thank you for considering contributing to EAP-Ecosystem! This project is primarily a personal learning laboratory, but contributions, suggestions, and feedback are always welcome.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Architectural Guidelines](#architectural-guidelines)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

---

## Code of Conduct

This project adheres to principles of respect, collaboration, and continuous learning. Please:

- Be respectful and constructive in discussions
- Focus on the problem, not the person
- Welcome different perspectives and approaches
- Help others learn and grow

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating a bug report:

1. Check if the bug has already been reported in Issues
2. Verify you're using the latest version
3. Collect information about the bug

Include in your bug report:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: How to trigger the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Node version, TypeScript version
- **Code Sample**: Minimal reproducible example

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **Consider how it fits with the project's architecture**

### 📝 Contributing Code

1. **Pick an Issue**: Look for issues labeled `good-first-issue` or `help-wanted`
2. **Discuss First**: Comment on the issue to discuss your approach
3. **Fork & Branch**: Create a feature branch from `develop`
4. **Code**: Write your code following our guidelines
5. **Test**: Ensure all tests pass and add new tests
6. **Document**: Update documentation if needed
7. **Submit PR**: Create a pull request with a clear description

---

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- Yarn = 4.9.2
- Git

### Setup Steps

```bash
# 1. Fork and clone the repository
git clone https://github.com/ThiagoDelgado-D/EAP-Ecosystem
cd EAP-Ecosystem

# 2. Install dependencies
yarn install

# 3. Verify setup
yarn build
yarn test

# 4. Create a feature branch
git checkout -b feature/my-feature develop
```

### Project Structure

```
EAP-Ecosystem/
├── shared/                    # Cross-cutting concerns
│   ├── domain-lib/           # Shared domain utilities
│   └── infrastructure-lib/    # Shared infrastructure
├── learning-resource/         # Learning Resource module
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── user/                     # User module (planned)
└── recommendation/           # Recommendation module (planned)
```

---

## Architectural Guidelines

### The Golden Rules

1. **Respect the Dependency Rule**: Dependencies point inward only
2. **One Module = One Hexagon**: Each module applies Hexagonal Architecture
3. **Shared for Duplication**: Move to `shared/` only when used by 2+ modules
4. **Domain Purity**: Domain layer has no external dependencies
5. **Test Everything**: All use cases must have comprehensive tests

### Where to Put Your Code

#### Decision Tree

```
Is it business logic?
├─ YES → Which module does it belong to?
│        ├─ learning-resource/ → Place in appropriate layer
│        ├─ user/ → Place in appropriate layer
│        └─ recommendation/ → Place in appropriate layer
│
└─ NO  → Is it used by multiple modules?
          ├─ YES → shared/
          └─ NO  → Keep in specific module
```

#### Layer Decision

```
What type of code is it?

Business Entity/Rule → domain/entities/ or domain/value-objects/
Business Workflow    → application/use-cases/
Interface Definition → domain/repositories/ (Port)
Database Code        → infrastructure/repositories/ (Adapter)
External Service     → infrastructure/adapters/
Input Validation     → application/validators/
Error Type          → application/errors/ or shared/domain-lib/errors/
```

### Module Organization

Each module follows this structure:

```
module-name/
├── domain/                  # Business logic (no dependencies)
│   ├── entities/           # Core business objects
│   ├── value-objects/      # Immutable values
│   └── repositories/       # Port interfaces
│
├── application/            # Use cases and orchestration
│   ├── use-cases/         # Business workflows
│   ├── validators/        # Input validation
│   ├── errors/            # Module-specific errors
│   └── mocks/             # Testing utilities
│
└── infrastructure/         # Technical implementations
    ├── repositories/      # Secondary adapters (DB)
    ├── adapters/         # Other external services
    └── config/           # Configuration
```

---

## Coding Standards

### TypeScript

- **Strict Mode**: Always use strict TypeScript settings
- **No `any`**: Avoid `any` type; use `unknown` if needed
- **Explicit Types**: Define return types explicitly
- **Interface over Type**: Prefer `interface` for object shapes

```typescript
// ✅ Good
interface User {
  id: UUID;
  name: string;
}

async function getUser(id: UUID): Promise<User | null> {
  // implementation
}

// ❌ Bad
type User = {
  // Should be interface
  id: any; // Should be UUID
  name: string;
};

async function getUser(id) {
  // Missing types
  // implementation
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `add-resource.ts`)
- **Interfaces**: `PascalCase` with `I` prefix for ports (e.g., `ILearningResourceRepository`)
- **Classes**: `PascalCase` (e.g., `PostgresRepository`)
- **Functions**: `camelCase` (e.g., `addResource`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Types**: `PascalCase` (e.g., `AddResourceRequestModel`)

### Code Style

```typescript
// ✅ Use functional style for use cases
export const addResource = async (
  deps: AddResourceDependencies,
  request: AddResourceRequestModel
): Promise<void | Error> => {
  // implementation
};

// ✅ Use explicit error returns instead of throwing
if (!validation.isValid) {
  return new InvalidDataError(validation.errors);
}

// ✅ Use dependency injection
interface Dependencies {
  repository: IRepository;
  validator: IValidator;
}

// ✅ Use immutable data structures
const updatedResource = {
  ...resource,
  title: newTitle,
  updatedAt: new Date(),
};

// ❌ Avoid mutating
resource.title = newTitle; // Don't do this
```

### Error Handling

```typescript
// ✅ Return errors as values
const result = await addResource(deps, request);
if (result instanceof InvalidDataError) {
  // Handle error
}

// ✅ Use specific error types
return new InvalidDataError(validation.errors);
return new NotFoundError({ resource: "User", id });

// ❌ Don't throw in use cases
throw new Error("Invalid data"); // Don't do this
```

---

## Testing Requirements

### Testing Philosophy

- **Tests are Documentation**: Tests show how to use the code
- **Test Behavior, Not Implementation**: Focus on what, not how
- **AAA Pattern**: Arrange, Act, Assert

### Requirements

1. **All use cases must have tests**
2. **Minimum 90% coverage** for new code
3. **Test both happy and error paths**
4. **Use descriptive test names**

### Test Structure

```typescript
describe("addResource", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let repository: ReturnType<typeof mockLearningResourceRepository>;
  let validator: ReturnType<typeof mockValidator>;

  beforeEach(() => {
    // Arrange: Setup mocks
    cryptoService = mockCryptoService();
    repository = mockLearningResourceRepository([]);
    validator = mockValidator();
  });

  test("With valid data, should add resource successfully", async () => {
    // Arrange
    const request: AddResourceRequestModel = {
      title: "TypeScript Advanced",
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 120,
      // ...
    };

    // Act
    const result = await addResource(
      { repository, validator, cryptoService },
      request
    );

    // Assert
    expect(result).toBeUndefined(); // Success = no error
    expect(repository.count()).toBe(1);
    expect(repository.learningResources[0].title).toBe("TypeScript Advanced");
  });

  test("With invalid data, should return InvalidDataError", async () => {
    // Arrange
    const invalidValidator = mockValidator({
      isPayloadValid: false,
      payloadErrors: { title: "Title is required" },
    });

    const request: AddResourceRequestModel = {
      title: "", // Invalid
      // ...
    };

    // Act
    const result = await addResource(
      { repository, validator: invalidValidator, cryptoService },
      request
    );

    // Assert
    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      title: "Title is required",
    });
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests for specific workspace
cd learning-resource/application
yarn test

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test:watch

# Pre-PR check (runs all tests)
yarn pre-pr
```

---

## Pull Request Process

### Before Submitting

1. **Run pre-PR checks**: `yarn pre-pr`
2. **Update documentation**: If you changed behavior
3. **Add tests**: For all new functionality
4. **Update CHANGELOG**: If applicable

### PR Title

Use conventional commit format:

```
feat(learning-resource): add energy level calculation
fix(domain): correct UUID type definition
docs(readme): update installation instructions
test(application): add missing test cases
```

### PR Description Template

```markdown
## Description

Brief description of what this PR does

## Motivation and Context

Why is this change needed? What problem does it solve?

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update

## How Has This Been Tested?

Describe the tests you ran and how to reproduce them

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have updated the documentation accordingly
- [ ] I have added tests that prove my fix/feature works
- [ ] All tests pass locally
- [ ] My changes generate no new warnings
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainer
3. **Discussion** of any concerns
4. **Approval** and merge

---

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semi-colons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

### Scope

- `learning-resource`
- `user`
- `recommendation`
- `domain`
- `application`
- `infrastructure`
- `shared`

### Examples

```bash
feat(learning-resource): add energy level auto-calculation

Add automatic energy level suggestion based on difficulty and duration.
High difficulty or long duration suggests high energy level.

Closes #42

---

fix(domain): correct UUID type validation

UUID type was accepting invalid formats. Now enforces strict UUID v4 format.

---

docs(architecture): add module-based architecture section

Explain how modules are organized and how hexagonal architecture
applies to each module.
```

---

## Questions?

If you have questions:

1. Check existing [Issues](https://github.com/ThiagoDelgado-D/EAP-Ecosystem/issues)
2. Read the [Architecture Documentation](ARCHITECTURE.md)
3. Create a new issue with the `question` label

---

## Recognition

Contributors will be recognized in:

- README.md contributors section
- CHANGELOG.md for significant contributions

---

Thank you for contributing to EAP-Ecosystem! 🎉
