import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import { InvalidDataError, mockCryptoService, mockCurrentUser, type CurrentUser, type UUID } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { seedOwnedLearningResource } from "../../mocks/factories.js";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";
import { LearningResourceForbiddenError } from "../../errors/learning-resource-forbidden.js";
import { toggleStatus } from "./toggle-resource-status.js";

describe("toggleStatus", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceId: UUID;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    ({ resourceId, currentUser, learningResourceRepository } = await seedOwnedLearningResource(cryptoService, {
      title: "Domain-Driven Design Fundamentals",
      difficulty: DifficultyType.MEDIUM,
      energyLevel: EnergyLevelType.HIGH,
      estimatedDuration: { value: 200, isEstimated: true },
    }));
  });

  test("Should toggle status successfully", async () => {
    const result = await toggleStatus(
      {
        learningResourceRepository,
        currentUser,
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
        currentUser,
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
        currentUser,
      },
      {
        id: nonExistentId,
        status: ResourceStatusType.COMPLETED,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return LearningResourceForbiddenError when resource belongs to another user", async () => {
    const otherUser = await mockCurrentUser(cryptoService);

    const result = await toggleStatus(
      {
        learningResourceRepository,
        currentUser: otherUser,
      },
      {
        id: resourceId,
        status: ResourceStatusType.COMPLETED,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceForbiddenError);
  });

  test("Should return InvalidDataError when validation fails", async () => {
    const result = await toggleStatus(
      {
        learningResourceRepository,
        currentUser,
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
        currentUser,
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
