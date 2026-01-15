import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import type { UUID } from "crypto";
import { ValidationError, mockCryptoService } from "domain-lib";
import { mockLearningResourceRepository } from "../../mocks/index.js";
import { beforeEach, describe, expect, test } from "vitest";
import { toggleResourceDifficulty } from "./toggle-resource-difficulty.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";

describe("toggleDifficulty", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceId: UUID;
  let typeId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    resourceId = await cryptoService.generateUUID();
    typeId = await cryptoService.generateUUID();

    const resource: LearningResource = {
      id: resourceId,
      title: "TypeScript Advanced",
      typeId,
      topicIds: [],
      difficulty: DifficultyType.MEDIUM,
      energyLevel: EnergyLevelType.MEDIUM,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 120, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    learningResourceRepository = mockLearningResourceRepository([resource]);
  });

  test("Should toggle difficulty successfully", async () => {
    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
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
      },
      {
        id: nonExistentId,
        difficulty: DifficultyType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return ValidationError when difficulty is invalid", async () => {
    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
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
