import {
  DifficultyType,
  EnergyLevelType,
} from "@learning-resource/domain";
import { InvalidDataError, mockCryptoService, mockCurrentUser, type CurrentUser, type UUID } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { seedOwnedLearningResource } from "../../mocks/factories.js";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import { toggleResourceEnergy } from "./toggle-resource-energy.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";
import { LearningResourceForbiddenError } from "../../errors/learning-resource-forbidden.js";

describe("toggleResourceEnergy", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceId: UUID;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    ({ resourceId, currentUser, learningResourceRepository } = await seedOwnedLearningResource(cryptoService, {
      title: "Advanced Algorithms",
      difficulty: DifficultyType.HIGH,
      energyLevel: EnergyLevelType.MEDIUM,
      estimatedDuration: { value: 180, isEstimated: true },
    }));
  });

  test("Should toggle energy level to HIGH successfully", async () => {
    const result = await toggleResourceEnergy(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
        energyLevel: EnergyLevelType.HIGH,
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.energyLevel).toBe(EnergyLevelType.HIGH);
  });

  test("Should toggle energy level to LOW successfully", async () => {
    const result = await toggleResourceEnergy(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
        energyLevel: EnergyLevelType.LOW,
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.energyLevel).toBe(EnergyLevelType.LOW);
  });

  test("Should return LearningResourceNotFoundError when resource does not exist", async () => {
    const nonExistentId = await cryptoService.generateUUID();

    const result = await toggleResourceEnergy(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: nonExistentId,
        energyLevel: EnergyLevelType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return LearningResourceForbiddenError when resource belongs to another user", async () => {
    const otherUser = await mockCurrentUser(cryptoService);

    const result = await toggleResourceEnergy(
      {
        learningResourceRepository,
        currentUser: otherUser,
      },
      {
        id: resourceId,
        energyLevel: EnergyLevelType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceForbiddenError);
  });

  test("Should return InvalidDataError when validation fails", async () => {
    const result = await toggleResourceEnergy(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
        energyLevel: "INVALID_ENERGY_LEVEL" as any,
      }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      energyLevel: "EnergyLevel must be one of: low, medium, high",
    });
  });

  test("Should not modify other fields when toggling energy level", async () => {
    const originalResource = await learningResourceRepository.findById(
      resourceId
    );

    await toggleResourceEnergy(
      {
        learningResourceRepository,
        currentUser,
      },
      {
        id: resourceId,
        energyLevel: EnergyLevelType.LOW,
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.title).toBe(originalResource?.title);
    expect(updated?.difficulty).toBe(originalResource?.difficulty);
    expect(updated?.status).toBe(originalResource?.status);
    expect(updated?.estimatedDuration.value).toBe(
      originalResource?.estimatedDuration.value
    );
  });
});
