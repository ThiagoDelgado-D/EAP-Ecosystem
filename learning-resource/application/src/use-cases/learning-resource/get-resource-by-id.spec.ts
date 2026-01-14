import { beforeEach, describe, expect, test } from "vitest";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
  type LearningResource,
} from "@learning-resource/domain";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import { GetResourceById } from "./get-resource-by-id.js";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";
import { InvalidDataError, mockCryptoService } from "domain-lib";

describe("GetResourceById", () => {
  let crypto: ReturnType<typeof mockCryptoService>;
  let repository: ReturnType<typeof mockLearningResourceRepository>;

  beforeEach(() => {
    crypto = mockCryptoService();
    repository = mockLearningResourceRepository([]);
  });

  test("Should return LearningResourceNotFoundError when resource does not exist", async () => {
    const id = await crypto.generateUUID();

    const result = await GetResourceById(
      { learningResourceRepository: repository },
      { resourceId: id }
    );

    expect(result).toBeInstanceOf(LearningResourceNotFoundError);
  });

  test("Should return the resource when it exists", async () => {
    const id = await crypto.generateUUID();
    const typeId = await crypto.generateUUID();
    const topicId = await crypto.generateUUID();

    const resource: LearningResource = {
      id,
      title: "Resource Title",
      url: "https://example.com",
      topicIds: [topicId],
      difficulty: DifficultyType.HIGH,
      estimatedDuration: {
        isEstimated: true,
        value: 120,
      },
      energyLevel: EnergyLevelType.HIGH,
      status: ResourceStatusType.COMPLETED,
      notes: "Some notes",
      typeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await repository.save(resource);

    const result = await GetResourceById(
      { learningResourceRepository: repository },
      { resourceId: id }
    );

    if (result instanceof LearningResourceNotFoundError) {
      return result;
    }

    if (result instanceof InvalidDataError) {
      return result;
    }

    expect(result).not.toBeInstanceOf(LearningResourceNotFoundError);
    expect(result.resourceId).toBe(id);
    expect(result.title).toBe("Resource Title");
    expect(result.url).toBe("https://example.com");
    expect(result.topicIds).toEqual([topicId]);
    expect(result.difficulty).toBe(DifficultyType.HIGH);
    expect(result.estimatedDurationMinutes).toBe(120);
    expect(result.energyLevel).toBe(EnergyLevelType.HIGH);
    expect(result.status).toBe(ResourceStatusType.COMPLETED);
    expect(result.notes).toBe("Some notes");
  });

  test("Should return InvalidDataError when resourceId is not a valid UUID", async () => {
    const result = await GetResourceById(
      { learningResourceRepository: repository },
      { resourceId: "not-a-valid-uuid" as any }
    );

    expect(result).toBeInstanceOf(InvalidDataError);
    expect((result as InvalidDataError).context).toHaveProperty("resourceId");
  });
});
