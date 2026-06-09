import { mockCryptoService, type UUID } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  MentalStateType,
  ResourceStatusType,
} from "@learning-resource/domain";
import {
  getResourcesByFilter,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./get-resources-by-filter.js";

describe("getResourcesByFilter", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let learningResourceRepository: ReturnType<
    typeof mockLearningResourceRepository
  >;

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
  });

  test("Should return paginated shape with all resources when no filters provided", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {},
    );

    expect(result.resources).toHaveLength(6);
    expect(result.total).toBe(6);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(result.totalPages).toBe(1);
  });

  test("Should return paginated shape when filters object is empty", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: {} },
    );

    expect(result.total).toBe(6);
    expect(result.resources).toHaveLength(6);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  test("Should handle empty repository", async () => {
    learningResourceRepository.clear();

    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {},
    );

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });

  test("Should paginate correctly with pageSize=2 and return page 1", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { page: 1, pageSize: 2 },
    );

    expect(result.resources).toHaveLength(2);
    expect(result.total).toBe(6);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  test("Should paginate correctly and return page 2", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { page: 2, pageSize: 2 },
    );

    expect(result.resources).toHaveLength(2);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  test("Should clamp page to 1 when page < 1", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { page: -5 },
    );

    expect(result.page).toBe(1);
  });

  test("Should clamp pageSize to MAX_PAGE_SIZE when pageSize exceeds limit", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { pageSize: 999 },
    );

    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
  });

  test("Should clamp pageSize to 1 when pageSize < 1", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { pageSize: 0 },
    );

    expect(result.pageSize).toBe(1);
    expect(result.totalPages).toBe(6);
  });

  test("Should return resources with LOW difficulty", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { difficulty: DifficultyType.LOW } },
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.LOW),
    ).toBe(true);
  });

  test("Should return resources with MEDIUM difficulty", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { difficulty: DifficultyType.MEDIUM } },
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.MEDIUM),
    ).toBe(true);
  });

  test("Should return resources with HIGH difficulty", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { difficulty: DifficultyType.HIGH } },
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.HIGH),
    ).toBe(true);
  });

  test("Should return resources with LOW energy level", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { energyLevel: EnergyLevelType.LOW } },
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.energyLevel === EnergyLevelType.LOW),
    ).toBe(true);
  });

  test("Should return resources with HIGH energy level", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { energyLevel: EnergyLevelType.HIGH } },
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.energyLevel === EnergyLevelType.HIGH),
    ).toBe(true);
  });

  test("Should return PENDING resources", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { status: ResourceStatusType.PENDING } },
    );

    expect(result.total).toBe(3);
    expect(
      result.resources.every((r) => r.status === ResourceStatusType.PENDING),
    ).toBe(true);
  });

  test("Should return IN_PROGRESS resources", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { status: ResourceStatusType.IN_PROGRESS } },
    );

    expect(result.total).toBe(1);
    expect(result.resources[0].title).toBe("Design Systems");
  });

  test("Should return COMPLETED resources", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { status: ResourceStatusType.COMPLETED } },
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.status === ResourceStatusType.COMPLETED),
    ).toBe(true);
  });

  test("Should return resources filtered by article type", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { resourceTypeId: typeArticleId } },
    );

    expect(result.total).toBe(3);
    expect(result.resources.every((r) => r.typeId === typeArticleId)).toBe(
      true,
    );
  });

  test("Should return empty when no resources match resourceTypeId", async () => {
    const nonExistentTypeId = await cryptoService.generateUUID();

    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { resourceTypeId: nonExistentTypeId } },
    );

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should return resources filtered by single topic", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { topicIds: [topicProgrammingId] } },
    );

    expect(result.total).toBe(4);
    expect(
      result.resources.every((r) => r.topicIds.includes(topicProgrammingId)),
    ).toBe(true);
  });

  test("Should return resources filtered by multiple topics (OR logic)", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { topicIds: [topicDesignId, topicScienceId] } },
    );

    expect(result.total).toBe(3);
    expect(
      result.resources.every(
        (r) =>
          r.topicIds.includes(topicDesignId) ||
          r.topicIds.includes(topicScienceId),
      ),
    ).toBe(true);
  });

  test("Should return empty when no resources match the topic filter", async () => {
    const nonExistentTopicId = await cryptoService.generateUUID();

    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { topicIds: [nonExistentTopicId] } },
    );

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should return resources matching search query (case-insensitive)", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { q: "typescript" } },
    );

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) =>
        r.title.toLowerCase().includes("typescript"),
      ),
    ).toBe(true);
  });

  test("Should return empty when search query matches nothing", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { q: "nonexistentxyz" } },
    );

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should ignore empty q string and return all results", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { q: "" } },
    );

    expect(result.total).toBe(6);
  });

  test("Should return resources filtered by mental state DEEP_FOCUS", async () => {
    const deepFocusId = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: deepFocusId,
      title: "Deep Work",
      typeId: typeVideoId,
      topicIds: [topicProgrammingId],
      difficulty: DifficultyType.HIGH,
      energyLevel: EnergyLevelType.HIGH,
      mentalState: MentalStateType.DEEP_FOCUS,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 90, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { mentalState: MentalStateType.DEEP_FOCUS } },
    );

    expect(result.total).toBe(1);
    expect(result.resources[0].title).toBe("Deep Work");
    expect(result.resources[0].mentalState).toBe(MentalStateType.DEEP_FOCUS);
  });

  test("Should apply difficulty + mentalState combined (AND logic)", async () => {
    const id1 = await cryptoService.generateUUID();
    const id2 = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: id1,
      title: "Deep Focus High",
      typeId: typeVideoId,
      topicIds: [topicProgrammingId],
      difficulty: DifficultyType.HIGH,
      energyLevel: EnergyLevelType.HIGH,
      mentalState: MentalStateType.DEEP_FOCUS,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 90, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await learningResourceRepository.save({
      id: id2,
      title: "Deep Focus Low",
      typeId: typeArticleId,
      topicIds: [topicDesignId],
      difficulty: DifficultyType.LOW,
      energyLevel: EnergyLevelType.LOW,
      mentalState: MentalStateType.DEEP_FOCUS,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 30, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getResourcesByFilter(
      { learningResourceRepository },
      {
        filters: {
          mentalState: MentalStateType.DEEP_FOCUS,
          difficulty: DifficultyType.HIGH,
        },
      },
    );

    expect(result.total).toBe(1);
    expect(result.resources[0].title).toBe("Deep Focus High");
  });

  test("Should apply filters combined with pagination", async () => {
    const result = await getResourcesByFilter(
      { learningResourceRepository },
      { filters: { difficulty: DifficultyType.LOW }, page: 1, pageSize: 1 },
    );

    expect(result.total).toBe(2);
    expect(result.resources).toHaveLength(1);
    expect(result.totalPages).toBe(2);
    expect(result.resources[0].difficulty).toBe(DifficultyType.LOW);
  });

  test("Should return all resources when all filter values are undefined", async () => {
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
      },
    );

    expect(result.total).toBe(6);
    expect(result.resources).toHaveLength(6);
  });
});
