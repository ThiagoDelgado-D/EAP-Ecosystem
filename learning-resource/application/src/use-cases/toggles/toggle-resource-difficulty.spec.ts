import {
  DifficultyType,
  EnergyLevelType,
} from "@learning-resource/domain";
import { ValidationError, mockCryptoService, mockCurrentUser, type CurrentUser, type UUID } from "domain-lib";
import { seedOwnedLearningResource, mockLearningResourceRepository } from "../../mocks/index.js";
import { beforeEach, describe, expect, test } from "vitest";
import { toggleResourceDifficulty } from "./toggle-resource-difficulty.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";
import { LearningResourceForbiddenError } from "../../errors/learning-resource-forbidden.js";

describe("toggleDifficulty", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceId: UUID;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    ({ resourceId, currentUser, learningResourceRepository } = await seedOwnedLearningResource(cryptoService, {
      title: "TypeScript Advanced",
      difficulty: DifficultyType.MEDIUM,
      energyLevel: EnergyLevelType.MEDIUM,
      estimatedDuration: { value: 120, isEstimated: true },
    }));
  });

  test("Should toggle difficulty successfully", async () => {
    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
        difficulty: DifficultyType.HIGH,
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.difficulty).toBe(DifficultyType.HIGH);
  });

  test("Should update updatedAt timestamp", async () => {
    const beforeUpdate = new Date();

    await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
        difficulty: DifficultyType.LOW,
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeUpdate.getTime()
    );
  });

  test("Should return LearningResourceNotFoundError when resource does not exist", async () => {
    const nonExistentId = await cryptoService.generateUUID();

    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: nonExistentId,
        difficulty: DifficultyType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return LearningResourceForbiddenError when resource belongs to another user", async () => {
    const otherUser = await mockCurrentUser(cryptoService);

    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser: otherUser,
      },
      {
        id: resourceId,
        difficulty: DifficultyType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceForbiddenError);
  });

  test("Should return ValidationError when difficulty is invalid", async () => {
    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
        difficulty: "INVALID_DIFFICULTY" as DifficultyType,
      }
    );

    expect(result).toBeInstanceOf(ValidationError);
  });

  test("Should return ValidationError when id is invalid", async () => {
    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: "invalid-uuid" as UUID,
        difficulty: DifficultyType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(ValidationError);
  });

  test("Should return ValidationError when id is missing", async () => {
    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        difficulty: DifficultyType.HIGH,
      } as any
    );

    expect(result).toBeInstanceOf(ValidationError);
  });

  test("Should return ValidationError when difficulty is missing", async () => {
    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
      } as any
    );

    expect(result).toBeInstanceOf(ValidationError);
    expect((result as ValidationError).errors).toEqual({
      difficulty: expect.any(String),
    });
  });

  test("Should not modify other fields when toggling difficulty", async () => {
    const originalResource = await learningResourceRepository.findById(
      resourceId
    );

    await toggleResourceDifficulty(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
        difficulty: DifficultyType.LOW,
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.title).toBe(originalResource?.title);
    expect(updated?.energyLevel).toBe(originalResource?.energyLevel);
    expect(updated?.status).toBe(originalResource?.status);
  });
});
