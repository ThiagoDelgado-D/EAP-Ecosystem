import { mockCryptoService, UUID } from "domain-lib";
import { describe, test, expect, beforeEach } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository";
import { mockResourceTypeRepository } from "../../mocks/mock-resource-type-repository";
import { mockTopicRepository } from "../../mocks/mock-topic-repository";
import { addResource, AddResourceRequestModel } from "./add-resource";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
  ResourceType,
  Topic,
} from "@learning-resource/domain";
import { mockValidator } from "../../mocks/validators/mock-learning-resource-validator";

describe("addResource", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceTypeRepository: ReturnType<typeof mockResourceTypeRepository>;
  let topicRepository: ReturnType<typeof mockTopicRepository>;
  let validator: ReturnType<typeof mockValidator>;

  let topicId: UUID;
  let resourceTypeId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();

    topicId = await cryptoService.generateUUID();
    resourceTypeId = await cryptoService.generateUUID();

    const topic: Topic = {
      id: topicId,
      name: "Programming",
      color: "Red",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const resourceType: ResourceType = {
      id: resourceTypeId,
      displayName: "Video",
      code: "123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    learningResourceRepository = mockLearningResourceRepository([]);
    topicRepository = mockTopicRepository([topic]);
    resourceTypeRepository = mockResourceTypeRepository([resourceType]);
    validator = mockValidator(true);
  });

  test("With valid data, should add resource successfully", async () => {
    const request: AddResourceRequestModel = {
      title: "Learning Typescript",
      url: "https://www.youtube.com/watch?v=example",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      energyLevel: EnergyLevelType.MEDIUM,
      notes: "Important video for learning TS",
      status: ResourceStatusType.PENDING,
    };

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
        validator,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];

    expect(result).toBeUndefined();

    expect(stored.title).toBe("Learning Typescript");
    expect(stored.topicIds.includes(topicId)).toBe(true);
    expect(stored.typeId).toBe(resourceTypeId);
  });
});
