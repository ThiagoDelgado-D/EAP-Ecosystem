import { beforeEach, describe, expect, test } from "vitest";
import {
  mockValidator,
  mockTopicRepository,
  mockResourceTypeRepository,
  mockLearningResourceRepository,
} from "../../mocks";
import {
  InvalidDataError,
  mockCryptoService,
  NotFoundError,
  type UUID,
} from "domain-lib";
import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  ResourceStatusType,
  type ResourceType,
  type Topic,
} from "@learning-resource/domain";
import { updateResource } from "./edit-resource";
import { LearningResourceNotFoundError } from "../../errors";

describe("updateResource", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let resourceTypeRepository: ReturnType<typeof mockResourceTypeRepository>;
  let topicRepository: ReturnType<typeof mockTopicRepository>;

  let resourceId: UUID;
  let typeId: UUID;
  let newTypeId: UUID;
  let topicId: UUID;
  let newTopicId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();

    resourceId = await cryptoService.generateUUID();
    typeId = await cryptoService.generateUUID();
    newTypeId = await cryptoService.generateUUID();
    topicId = await cryptoService.generateUUID();
    newTopicId = await cryptoService.generateUUID();

    const existingResource: LearningResource = {
      id: resourceId,
      title: "Original Title",
      url: "https://original-url.com",
      typeId,
      topicIds: [topicId],
      difficulty: DifficultyType.MEDIUM,
      energyLevel: EnergyLevelType.MEDIUM,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 60, isEstimated: true },
      notes: "Original notes",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const resourceType: ResourceType = {
      id: typeId,
      code: "video",
      displayName: "Video",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newResourceType: ResourceType = {
      id: newTypeId,
      code: "article",
      displayName: "Article",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const topic: Topic = {
      id: topicId,
      name: "Programming",
      color: "#FF5733",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newTopic: Topic = {
      id: newTopicId,
      name: "Design",
      color: "#3357FF",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    learningResourceRepository = mockLearningResourceRepository([
      existingResource,
    ]);
    resourceTypeRepository = mockResourceTypeRepository([
      resourceType,
      newResourceType,
    ]);
    topicRepository = mockTopicRepository([topic, newTopic]);
  });

  test("Should update only title", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        title: "Updated Title",
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.title).toBe("Updated Title");
    expect(updated?.url).toBe("https://original-url.com");
    expect(updated?.notes).toBe("Original notes");
  });

  test("Should update only URL", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        url: "https://new-url.com",
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.url).toBe("https://new-url.com");
    expect(updated?.title).toBe("Original Title");
  });

  test("Should update only typeId", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        typeId: newTypeId,
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.typeId).toBe(newTypeId);
  });

  test("Should update only topicIds", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        topicIds: [newTopicId],
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.topicIds).toEqual([newTopicId]);
  });

  test("Should update only estimatedDuration", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        estimatedDurationMinutes: 120,
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.estimatedDuration.value).toBe(120);
    expect(updated?.estimatedDuration.isEstimated).toBe(true);
  });

  test("Should update only notes", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        notes: "Updated notes",
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.notes).toBe("Updated notes");
  });

  test("Should update title and URL together", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        title: "New Title",
        url: "https://new-url.com",
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.title).toBe("New Title");
    expect(updated?.url).toBe("https://new-url.com");
  });

  test("Should update all fields at once", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        title: "Completely Updated",
        url: "https://totally-new.com",
        typeId: newTypeId,
        topicIds: [newTopicId],
        estimatedDurationMinutes: 90,
        notes: "Brand new notes",
      }
    );

    expect(result).toBeUndefined();

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.title).toBe("Completely Updated");
    expect(updated?.url).toBe("https://totally-new.com");
    expect(updated?.typeId).toBe(newTypeId);
    expect(updated?.topicIds).toEqual([newTopicId]);
    expect(updated?.estimatedDuration.value).toBe(90);
    expect(updated?.notes).toBe("Brand new notes");
  });

  test("Should return InvalidDataError when no fields provided", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
      }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      general: "At least one field must be provided for update",
    });
  });

  test("Should return InvalidDataError when validation fails", async () => {
    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        title: "x".repeat(501),
      }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toEqual({
      title: "Title must be at most 250 characters",
    });
  });

  test("Should return LearningResourceNotFoundError when resource does not exist", async () => {
    const nonExistentId = await cryptoService.generateUUID();

    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: nonExistentId,
        title: "New Title",
      }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return NotFoundError when new typeId does not exist", async () => {
    const nonExistentTypeId = await cryptoService.generateUUID();

    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        typeId: nonExistentTypeId,
      }
    );

    expect(result).toBeInstanceOf(NotFoundError);
    expect((result as NotFoundError).context).toEqual({
      resource: "ResourceType",
      id: nonExistentTypeId,
    });
  });

  test("Should return NotFoundError when new topic does not exist", async () => {
    const nonExistentTopicId = await cryptoService.generateUUID();

    const result = await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        topicIds: [nonExistentTopicId],
      }
    );

    expect(result).toBeInstanceOf(NotFoundError);
    expect((result as NotFoundError).context).toEqual({
      resource: "Topic",
      id: nonExistentTopicId,
    });
  });

  test("Should trim whitespace from title", async () => {
    await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        title: "  Trimmed Title  ",
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.title).toBe("Trimmed Title");
  });

  test("Should trim whitespace from URL and notes", async () => {
    await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        url: "  https://example.com  ",
        notes: "  Some notes  ",
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.url).toBe("https://example.com");
    expect(updated?.notes).toBe("Some notes");
  });
  test("Should update updatedAt timestamp", async () => {
    const before = new Date();

    await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        title: "New Title",
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    );
  });
  test("Should set URL to undefined when empty string is provided", async () => {
    await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        url: "",
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.url).toBeUndefined();
  });

  test("Should set notes to undefined when empty string is provided", async () => {
    await updateResource(
      {
        learningResourceRepository,
        resourceTypeRepository,
        topicRepository,
      },
      {
        id: resourceId,
        notes: "",
      }
    );

    const updated = await learningResourceRepository.findById(resourceId);
    expect(updated?.notes).toBeUndefined();
  });
});
