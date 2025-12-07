import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { mockLearningResourceRepository, mockValidator } from "../../../mocks";
import { beforeEach, describe, expect, test } from "vitest";
import { toggleStatus } from "./toggle-resource-status";
import { LearningResourceNotFoundError } from "../../../errors";

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
        validator: mockValidator(),
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
        validator: mockValidator(),
      },
      {
        id: resourceId,
        status: ResourceStatusType.IN_PROGRESS,
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
        validator: mockValidator(),
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
        validator: mockValidator({
          isStatusToggleValid: false,
          statusToggleErrors: { status: "Invalid status" },
        }),
      },
      {
        id: resourceId,
        status: ResourceStatusType.PENDING,
      }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      status: "Invalid status",
    });
  });

  test("Should not modify other fields when toggling status", async () => {
    const originalResource = await learningResourceRepository.findById(
      resourceId
    );

    await toggleStatus(
      {
        learningResourceRepository,
        validator: mockValidator(),
      },
      {
        id: resourceId,
        status: ResourceStatusType.IN_PROGRESS,
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
