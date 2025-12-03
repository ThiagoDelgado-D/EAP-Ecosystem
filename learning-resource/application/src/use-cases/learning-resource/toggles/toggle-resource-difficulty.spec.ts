import {
  DifficultyType,
  EnergyLevelType,
  LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { UUID } from "crypto";
import { InvalidDataError, mockCryptoService } from "domain-lib";
import { mockLearningResourceRepository } from "../../../mocks";
import { beforeEach, describe, expect, test } from "vitest";
import { toggleResourceDifficulty } from "./toggle-resource-difficulty";
import { mockValidator } from "../../../mocks";
import { LearningResourceNotFoundError } from "../../../errors";

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
        validator: mockValidator(),
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
        validator: mockValidator(),
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
        validator: mockValidator(),
      },
      {
        id: nonExistentId,
        difficulty: DifficultyType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return InvalidDataError when validation fails", async () => {
    const result = await toggleResourceDifficulty(
      {
        learningResourceRepository,
        validator: mockValidator({
          isDifficultyToggleValid: false,
          difficultyToggleErrors: { difficulty: "Invalid difficulty" },
        }),
      },
      {
        id: resourceId,
        difficulty: DifficultyType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      difficulty: "Invalid difficulty",
    });
  });

  test("Should not modify other fields when toggling difficulty", async () => {
    const originalResource = await learningResourceRepository.findById(
      resourceId
    );

    await toggleResourceDifficulty(
      {
        learningResourceRepository,
        validator: mockValidator(),
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
