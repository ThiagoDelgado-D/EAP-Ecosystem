import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";
import { toggleStatus } from "./toggle-resource-status.js";

describe("toggleStatus", () => {
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
      title: "Domain-Driven Design Fundamentals",
      typeId,
      topicIds: [],
      difficulty: DifficultyType.MEDIUM,
      energyLevel: EnergyLevelType.HIGH,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 200, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    learningResourceRepository = mockLearningResourceRepository([resource]);
  });

  test("Should toggle status successfully", async () => {
    const result = await toggleStatus(
      {
        learningResourceRepository,
      },
      {
        id: resourceId,
        status: ResourceStatusType.COMPLETED,
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.status).toBe(ResourceStatusType.COMPLETED);
  });

  test("Should update updatedAt timestamp", async () => {
    const beforeUpdate = new Date();

    await toggleStatus(
      {
        learningResourceRepository,
      },
      {
        id: resourceId,
        status: ResourceStatusType.PENDING,
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      beforeUpdate.getTime()
    );
  });

  test("Should return LearningResourceNotFoundError when resource does not exist", async () => {
    const nonExistentId = await cryptoService.generateUUID();

    const result = await toggleStatus(
      {
        learningResourceRepository,
      },
      {
        id: nonExistentId,
        status: ResourceStatusType.COMPLETED,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return InvalidDataError when validation fails", async () => {
    const result = await toggleStatus(
      {
        learningResourceRepository,
      },
      {
        id: resourceId,
        status: "INVALID_STATUS" as any,
      }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    const statusValues = Object.values(ResourceStatusType);
    expect((result as InvalidDataError).context).toEqual({
      status: `Status must be one of: ${statusValues.join(", ")}`,
    });
  });

  test("Should not modify other fields when toggling status", async () => {
    const originalResource = await learningResourceRepository.findById(
      resourceId
    );

    await toggleStatus(
      {
        learningResourceRepository,
      },
      {
        id: resourceId,
        status: ResourceStatusType.COMPLETED,
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.title).toBe(originalResource?.title);
    expect(updated?.difficulty).toBe(originalResource?.difficulty);
    expect(updated?.energyLevel).toBe(originalResource?.energyLevel);
    expect(updated?.estimatedDuration.value).toBe(
      originalResource?.estimatedDuration.value
    );
  });
});
