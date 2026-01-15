import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import { mockCryptoService, type UUID, InvalidDataError } from "domain-lib";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import { deleteResource } from "./delete-resource.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";

describe("deleteResource", () => {
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

  test("With valid id, should delete the resource", async () => {
    const resourceId = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: resourceId,
      title: "Typescript Advanced",
      url: "https://www.typescriptlang.org/docs/handbook/advanced-types.html",
      difficulty: DifficultyType.HIGH,
      energyLevel: EnergyLevelType.LOW,
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

    await deleteResource({ learningResourceRepository }, { id: resourceId });

    const foundResource = await learningResourceRepository.findById(resourceId);

    expect(foundResource).toBeNull();
  });
  test("With invalid id, should return LearningResourceNotFoundError", async () => {
    const resourceId = await cryptoService.generateUUID();

    const result = await deleteResource(
      { learningResourceRepository },
      { id: resourceId }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });
  test("With invalid UUID format, should return InvalidDataError", async () => {
    const result = await deleteResource(
      { learningResourceRepository },
      { id: "not-a-valid-uuid" as UUID }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toHaveProperty("id");
  });
});
