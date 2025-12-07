import { mockCryptoService, type UUID } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository";
import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  ResourceStatusType,
  type Topic,
} from "@learning-resource/domain";
import { mockTopicRepository } from "../../mocks/mock-topic-repository";
import { getResourcesByFilter } from "./get-resources-by-filter";

describe("getResourcesByFilter", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;
  let topicRepository: ReturnType<typeof mockTopicRepository>;

  let typeVideoId: UUID;
  let typeArticleId: UUID;
  let topicProgrammingId: UUID;
  let topicDesignId: UUID;
  let topicScienceId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();

    typeVideoId = await cryptoService.generateUUID();
    typeArticleId = await cryptoService.generateUUID();
    topicProgrammingId = await cryptoService.generateUUID();
    topicDesignId = await cryptoService.generateUUID();
    topicScienceId = await cryptoService.generateUUID();

    const topicVideo: Topic = {
      id: typeVideoId,
      name: "Video",
      color: "#9B59B6",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const topicArticle: Topic = {
      id: typeArticleId,
      name: "Article",
      color: "#F1C40F",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const topicProgramming = {
      id: topicProgrammingId,
      name: "Programming",
      color: "#FF5733",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const topicDesign = {
      id: topicDesignId,
      name: "Design",
      color: "#1E90FF",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const topicScience = {
      id: topicScienceId,
      name: "Science",
      color: "#2ECC71",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const seedResources: LearningResource[] = [
      {
        id: await cryptoService.generateUUID(),
        title: "TypeScript Basics",
        typeId: typeVideoId,
        topicIds: [topicProgrammingId],
        difficulty: DifficultyType.LOW,
        energyLevel: EnergyLevelType.LOW,
        status: ResourceStatusType.COMPLETED,
        estimatedDuration: { value: 30, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        title: "Advanced TypeScript",
        typeId: typeVideoId,
        topicIds: [topicProgrammingId],
        difficulty: DifficultyType.HIGH,
        energyLevel: EnergyLevelType.HIGH,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 180, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        title: "Design Systems",
        typeId: typeArticleId,
        topicIds: [topicDesignId],
        difficulty: DifficultyType.MEDIUM,
        energyLevel: EnergyLevelType.MEDIUM,
        status: ResourceStatusType.IN_PROGRESS,
        estimatedDuration: { value: 60, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        title: "Figma Tutorial",
        typeId: typeVideoId,
        topicIds: [topicDesignId, topicProgrammingId],
        difficulty: DifficultyType.LOW,
        energyLevel: EnergyLevelType.LOW,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 45, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        title: "Quantum Physics Introduction",
        typeId: typeArticleId,
        topicIds: [topicScienceId],
        difficulty: DifficultyType.HIGH,
        energyLevel: EnergyLevelType.HIGH,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 120, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        title: "CSS Grid Basics",
        typeId: typeArticleId,
        topicIds: [topicProgrammingId],
        difficulty: DifficultyType.MEDIUM,
        energyLevel: EnergyLevelType.MEDIUM,
        status: ResourceStatusType.COMPLETED,
        estimatedDuration: { value: 20, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    learningResourceRepository = mockLearningResourceRepository(seedResources);
    topicRepository = mockTopicRepository([
      topicArticle,
      topicVideo,
      topicProgramming,
      topicDesign,
      topicScience,
    ]);
  });

  test("Should return all resources when no filters are provided", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {}
    );

    expect(result.total).toBe(6);
    expect(result.resources).toHaveLength(6);
  });

  test("Should return all resources when no filters are provided", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: {} }
    );

    expect(result.total).toBe(6);
    expect(result.resources).toHaveLength(6);
  });

  test("Should handle empty repository", async () => {
    learningResourceRepository.clear();

    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {}
    );

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should return resources filtered by single topic", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: {
          topicIds: [topicProgrammingId],
        },
      }
    );

    expect(result.total).toBe(4);
    expect(
      result.resources.every((r) => r.topicIds.includes(topicProgrammingId))
    ).toBe(true);
  });

  test("Should return resources filtered by multiple topics (OR logic)", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: {
          topicIds: [topicDesignId, topicScienceId],
        },
      }
    );

    expect(result.total).toBe(3);
    expect(
      result.resources.every(
        (r) =>
          r.topicIds.includes(topicDesignId) ||
          r.topicIds.includes(topicScienceId)
      )
    ).toBe(true);
  });

  test("Should return empty array when no resources match the topic filter", async () => {
    const nonExistentTopicId = await cryptoService.generateUUID();

    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { topicIds: [nonExistentTopicId] },
      }
    );

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should return resources with LOW difficulty", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { difficulty: DifficultyType.LOW },
      }
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.LOW)
    ).toBe(true);
  });

  test("Should return resources with MEDIUM difficulty", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { difficulty: DifficultyType.MEDIUM },
      }
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.MEDIUM)
    ).toBe(true);
  });

  test("Should return resources with HIGH difficulty", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { difficulty: DifficultyType.HIGH },
      }
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.HIGH)
    ).toBe(true);
  });

  test("Should return resources with LOW energy level", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { energyLevel: EnergyLevelType.LOW },
      }
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.energyLevel === EnergyLevelType.LOW)
    ).toBe(true);
  });

  test("Should return resources with MEDIUM energy level", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { energyLevel: EnergyLevelType.MEDIUM },
      }
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.energyLevel === EnergyLevelType.MEDIUM)
    ).toBe(true);
  });

  test("Should return resources with HIGH energy level", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { energyLevel: EnergyLevelType.HIGH },
      }
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.energyLevel === EnergyLevelType.HIGH)
    ).toBe(true);
  });

  test("Should return PENDING resources", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { status: ResourceStatusType.PENDING },
      }
    );

    expect(result.total).toBe(3);
    expect(
      result.resources.every((r) => r.status === ResourceStatusType.PENDING)
    ).toBe(true);
  });

  test("Should return IN_PROGRESS resources", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { status: ResourceStatusType.IN_PROGRESS },
      }
    );

    expect(result.total).toBe(1);
    expect(result.resources[0].title).toBe("Design Systems");
  });

  test("Should return COMPLETED resources", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { status: ResourceStatusType.COMPLETED },
      }
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.status === ResourceStatusType.COMPLETED)
    ).toBe(true);
  });

  test("Should return resources filtered by article type", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { resourceTypeId: typeArticleId },
      }
    );

    expect(result.total).toBe(3);
    expect(result.resources.every((r) => r.typeId === typeArticleId)).toBe(
      true
    );
  });

  test("Should return empty when no resources match the filters", async () => {
    const nonExistentTypeId = await cryptoService.generateUUID();

    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: { resourceTypeId: nonExistentTypeId },
      }
    );

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should return all resources when filter values are undefined", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: {
          topicIds: undefined,
          difficulty: undefined,
          energyLevel: undefined,
          status: undefined,
          resourceTypeId: undefined,
        },
      }
    );

    expect(result.total).toBe(6);
    expect(result.resources).toHaveLength(6);
  });
});
