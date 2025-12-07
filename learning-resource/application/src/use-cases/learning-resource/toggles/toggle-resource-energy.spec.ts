import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { mockLearningResourceRepository, mockValidator } from "../../../mocks";
import { beforeEach, describe, expect, test } from "vitest";
import { toggleResourceEnergy } from "./toggle-resource-energy";
import { LearningResourceNotFoundError } from "../../../errors";

describe("toggleResourceEnergy", () => {
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
      title: "Advanced Algorithms",
      typeId,
      topicIds: [],
      difficulty: DifficultyType.HIGH,
      energyLevel: EnergyLevelType.MEDIUM,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 180, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    learningResourceRepository = mockLearningResourceRepository([resource]);
  });

  test("Should toggle energy level to HIGH successfully", async () => {
    const result = await toggleResourceEnergy(
      {
        learningResourceRepository,
        validator: mockValidator(),
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
        validator: mockValidator(),
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
        validator: mockValidator(),
      },
      {
        id: nonExistentId,
        energyLevel: EnergyLevelType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return InvalidDataError when validation fails", async () => {
    const result = await toggleResourceEnergy(
      {
        learningResourceRepository,
        validator: mockValidator({
          isEnergyLevelToggleValid: false,
          energyLevelToggleErrors: { energyLevel: "Invalid energy level" },
        }),
      },
      {
        id: resourceId,
        energyLevel: EnergyLevelType.HIGH,
      }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      energyLevel: "Invalid energy level",
    });
  });

  test("Should not modify other fields when toggling energy level", async () => {
    const originalResource = await learningResourceRepository.findById(
      resourceId
    );

    await toggleResourceEnergy(
      {
        learningResourceRepository,
        validator: mockValidator(),
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
