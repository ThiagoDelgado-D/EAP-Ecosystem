import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import { mockCryptoService, mockCurrentUser, type CurrentUser, type UUID, InvalidDataError } from "domain-lib";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import { deleteResource } from "./delete-resource.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";
import { LearningResourceForbiddenError } from "../../errors/learning-resource-forbidden.js";

describe("deleteResource", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceTypeId: UUID;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    learningResourceRepository = mockLearningResourceRepository([]);
    resourceTypeId = await cryptoService.generateUUID();
    currentUser = await mockCurrentUser(cryptoService);
  });

  test("With valid id, should delete the resource", async () => {
    const resourceId = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: resourceId,
      userId: currentUser.id,
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

    await deleteResource({ learningResourceRepository, currentUser }, { id: resourceId });

    const foundResource = await learningResourceRepository.findById(resourceId);

    expect(foundResource).toBeNull();
  });
  test("With invalid id, should return LearningResourceNotFoundError", async () => {
    const resourceId = await cryptoService.generateUUID();

    const result = await deleteResource(
      { learningResourceRepository, currentUser },
      { id: resourceId }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });
  test("With invalid UUID format, should return InvalidDataError", async () => {
    const result = await deleteResource(
      { learningResourceRepository, currentUser },
      { id: "not-a-valid-uuid" as UUID }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toHaveProperty("id");
  });
  test("Should return LearningResourceForbiddenError when resource belongs to another user", async () => {
    const resourceId = await cryptoService.generateUUID();
    const otherUserId = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: resourceId,
      userId: otherUserId,
      title: "Typescript Advanced",
      difficulty: DifficultyType.HIGH,
      energyLevel: EnergyLevelType.LOW,
      status: ResourceStatusType.PENDING,
      topicIds: [],
      typeId: resourceTypeId,
      estimatedDuration: { isEstimated: true, value: 120 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await deleteResource(
      { learningResourceRepository, currentUser },
      { id: resourceId },
    );

    expect(result).toBeInstanceOf(LearningResourceForbiddenError);
    expect(await learningResourceRepository.findById(resourceId)).not.toBeNull();
  });
});
