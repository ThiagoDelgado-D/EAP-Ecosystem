import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository";
import { mockCryptoService, UUID } from "domain-lib";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import { listFormattedResourcesLearning } from "./list-resource";

describe("listFormattedResourcesLearning", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceTypeId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    learningResourceRepository = mockLearningResourceRepository([]);
    resourceTypeId = await cryptoService.generateUUID();
  });

  test("Should return an empty array when no resources exist", async () => {
    const result = await listFormattedResourcesLearning({
      learningResourceRepository,
    });

    expect(result.resources).toEqual([]);
  });

  test("Should successfully return the formatted resource list", async () => {
    const resourceId1 = await cryptoService.generateUUID();
    const resourceId2 = await cryptoService.generateUUID();
    const resourceId3 = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: resourceId1,
      title: "Clean Architecture Course",
      url: "https://example.com/clean-arch",
      difficulty: DifficultyType.MEDIUM,
      energyLevel: EnergyLevelType.MEDIUM,
      status: ResourceStatusType.IN_PROGRESS,
      topicIds: [],
      typeId: resourceTypeId,
      estimatedDuration: {
        isEstimated: true,
        value: 90,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await learningResourceRepository.save({
      id: resourceId2,
      title: "Advanced TypeScript",
      url: "https://example.com/ts-advanced",
      difficulty: DifficultyType.HIGH,
      energyLevel: EnergyLevelType.HIGH,
      status: ResourceStatusType.PENDING,
      topicIds: [],
      typeId: resourceTypeId,
      estimatedDuration: {
        isEstimated: true,
        value: 120,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await learningResourceRepository.save({
      id: resourceId3,
      title: "Intro to Testing",
      url: "https://example.com/testing",
      difficulty: DifficultyType.LOW,
      energyLevel: EnergyLevelType.LOW,
      status: ResourceStatusType.COMPLETED,
      topicIds: [],
      typeId: resourceTypeId,
      estimatedDuration: {
        isEstimated: false,
        value: 120,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await listFormattedResourcesLearning({
      learningResourceRepository,
    });

    expect(result.resources.length).toBe(3);

    expect(result.resources).toMatchObject([
      {
        id: resourceId1,
        title: "Clean Architecture Course",
        difficulty: DifficultyType.MEDIUM,
        energyLevel: EnergyLevelType.MEDIUM,
        status: ResourceStatusType.IN_PROGRESS,
        typeId: resourceTypeId,
        topicIds: [],
      },
      {
        id: resourceId2,
        title: "Advanced TypeScript",
        difficulty: DifficultyType.HIGH,
        energyLevel: EnergyLevelType.HIGH,
        status: ResourceStatusType.PENDING,
        typeId: resourceTypeId,
        topicIds: [],
      },
      {
        id: resourceId3,
        title: "Intro to Testing",
        difficulty: DifficultyType.LOW,
        energyLevel: EnergyLevelType.LOW,
        status: ResourceStatusType.COMPLETED,
        typeId: resourceTypeId,
        topicIds: [],
      },
    ]);
  });
});
