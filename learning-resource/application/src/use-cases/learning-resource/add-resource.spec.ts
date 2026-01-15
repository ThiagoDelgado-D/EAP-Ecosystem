import {
  InvalidDataError,
  mockCryptoService,
  NotFoundError,
  type UUID,
} from "domain-lib";
import { describe, test, expect, beforeEach } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import { mockResourceTypeRepository } from "../../mocks/mock-resource-type-repository.js";
import { mockTopicRepository } from "../../mocks/mock-topic-repository.js";
import { addResource, type AddResourceRequestModel } from "./add-resource.js";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
  type ResourceType,
  type Topic,
} from "@learning-resource/domain";

describe("addResource", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceTypeRepository: ReturnType<typeof mockResourceTypeRepository>;
  let topicRepository: ReturnType<typeof mockTopicRepository>;

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
  });

  test("With valid data, should add resource successfully", async () => {
    const request: AddResourceRequestModel = {
      title: "Learning Typescript",
      url: "https://www.youtube.com/watch?v=example",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      energyLevel: EnergyLevelType.MEDIUM,
      estimatedDurationMinutes: 10,
      notes: "Important video for learning TS",
      status: ResourceStatusType.PENDING,
    };

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];

    expect(result).toBeUndefined();

    expect(stored.title).toBe("Learning Typescript");
    expect(stored.topicIds.includes(topicId)).toBe(true);
    expect(stored.typeId).toBe(resourceTypeId);
  });
  test("With invalid data, should return invalid data error ", async () => {
    const request = {
      title: "",
      url: "not-a-url",
      resourceTypeId: null,
      topicIds: [],
      difficulty: "INVALID" as any,
      energyLevel: EnergyLevelType.MEDIUM,
      notes: "x",
      status: ResourceStatusType.PENDING,
    } as unknown as AddResourceRequestModel;

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    expect(result).toBeInstanceOf(InvalidDataError);
  });
  test("Should auto-suggest HIGH energy level for difficult + long content", async () => {
    const request: AddResourceRequestModel = {
      title: "Advanced System Design",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.HIGH,
      estimatedDurationMinutes: 240,
      status: ResourceStatusType.PENDING,
    };

    await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];

    expect(stored.energyLevel).toBe(EnergyLevelType.HIGH);
  });
  test("Should return NotFoundError when resourceType does not exist", async () => {
    const invalidTypeId = await cryptoService.generateUUID();

    const request: AddResourceRequestModel = {
      title: "Learning TypeScript",
      resourceTypeId: invalidTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 60,
    };

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    expect(result).toBeInstanceOf(NotFoundError);
    expect((result as NotFoundError).context).toEqual({
      resource: "ResourceType",
      id: invalidTypeId,
    });
    expect(learningResourceRepository.learningResources).toHaveLength(0);
  });
  test("Should return NotFoundError when topic does not exist", async () => {
    const invalidTopicId = await cryptoService.generateUUID();

    const request: AddResourceRequestModel = {
      title: "Learning TypeScript",
      resourceTypeId,
      topicIds: [invalidTopicId],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 60,
    };

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    expect(result).toBeInstanceOf(NotFoundError);
    expect((result as NotFoundError).context).toEqual({
      resource: "Topic",
      id: invalidTopicId,
    });
    expect(learningResourceRepository.learningResources).toHaveLength(0);
  });
  test("Should fail on first invalid topic when multiple topics provided", async () => {
    const validTopicId = topicId;
    const invalidTopicId = await cryptoService.generateUUID();

    const request: AddResourceRequestModel = {
      title: "Learning TypeScript",
      resourceTypeId,
      topicIds: [validTopicId, invalidTopicId],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 60,
    };

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    expect(result).toBeInstanceOf(NotFoundError);
    expect((result as NotFoundError).context).toEqual({
      resource: "Topic",
      id: invalidTopicId,
    });
    expect(learningResourceRepository.learningResources).toHaveLength(0);
  });
  test("Should auto-suggest MEDIUM energy level + moderate duration", async () => {
    const request: AddResourceRequestModel = {
      title: "Intermediate TypeScript Concepts",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 75,
    };

    await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];
    expect(stored.energyLevel).toBe(EnergyLevelType.MEDIUM);
  });
  test("Should auto-suggest LOW energy level for easy + short content", async () => {
    const request: AddResourceRequestModel = {
      title: "5-minute CSS Tip",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.LOW,
      estimatedDurationMinutes: 5,
    };

    await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];
    expect(stored.energyLevel).toBe(EnergyLevelType.LOW);
  });
  test("Should respect user override of auto-suggest energy level", async () => {
    const request: AddResourceRequestModel = {
      title: "Complex Algorithms",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.HIGH,
      estimatedDurationMinutes: 180,
      energyLevel: EnergyLevelType.LOW,
    };

    await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];
    expect(stored.energyLevel).toBe(EnergyLevelType.LOW);
  });
  test("Should trim whitespaces from title, url, and notes", async () => {
    const request: AddResourceRequestModel = {
      title: "  Learning TypeScript  ",
      url: "  https://example.com  ",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 60,
      notes: "  Important notes  ",
    };

    await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];
    expect(stored.title).toBe("Learning TypeScript");
    expect(stored.url).toBe("https://example.com");
    expect(stored.notes).toBe("Important notes");
  });
  test("Should set lastViewed to undefined on creation", async () => {
    const request: AddResourceRequestModel = {
      title: "New Resource",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.LOW,
      estimatedDurationMinutes: 30,
    };

    await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];
    expect(stored.lastViewed).toBeUndefined();
  });

  test("Should mark duration as estimated", async () => {
    const request: AddResourceRequestModel = {
      title: "New Resource",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 45,
    };

    await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    const stored = learningResourceRepository.learningResources[0];
    expect(stored.estimatedDuration.isEstimated).toBe(true);
    expect(stored.estimatedDuration.value).toBe(45);
  });

  test("Should fail when title is too long", async () => {
    const request: AddResourceRequestModel = {
      title: "A".repeat(501),
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 60,
    };

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );
    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toHaveProperty("title");
  });

  test("Should fail with invalid difficulty value", async () => {
    const request = {
      title: "Test",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: "INVALID_DIFFICULTY",
      estimatedDurationMinutes: 60,
    } as any;

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );
    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should fail with invalid status value", async () => {
    const request = {
      title: "Test",
      resourceTypeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 60,
      status: "INVALID_STATUS",
    } as any;

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );
    expect(result).toBeInstanceOf(InvalidDataError);
  });
  test("Should fail when topicIds is empty array", async () => {
    const request: AddResourceRequestModel = {
      title: "Test",
      resourceTypeId,
      topicIds: [],
      difficulty: DifficultyType.MEDIUM,
      estimatedDurationMinutes: 60,
    };

    const result = await addResource(
      {
        cryptoService,
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      request
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toHaveProperty("topicIds");
  });
});
