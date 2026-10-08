import {
  InvalidDataError,
  mockCryptoService,
  mockCurrentUser,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  MentalStateType,
  ResourceSortField,
  ResourceStatusType,
  SortDirection,
} from "@learning-resource/domain";
import {
  getResourcesByFilter,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_TOPIC_IDS,
  type GetResourcesWithPaginationRequestModel,
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
  let currentUser: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();

    typeVideoId = await cryptoService.generateUUID();
    typeArticleId = await cryptoService.generateUUID();
    topicProgrammingId = await cryptoService.generateUUID();
    topicDesignId = await cryptoService.generateUUID();
    topicScienceId = await cryptoService.generateUUID();
    currentUser = await mockCurrentUser(cryptoService);

    const seedResources: LearningResource[] = [
      {
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
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
        userId: currentUser.id,
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
        userId: currentUser.id,
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
        userId: currentUser.id,
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
        userId: currentUser.id,
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
        userId: currentUser.id,
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

  const listResources = async (
    request: GetResourcesWithPaginationRequestModel = {},
  ) => {
    const result = await getResourcesByFilter(
      { learningResourceRepository, currentUser },
      request,
    );
    if (result instanceof Error) throw result;
    return result;
  };

  test("Should return paginated shape with all resources when no filters provided", async () => {
    const result = await listResources({});

    expect(result.resources).toHaveLength(6);
    expect(result.total).toBe(6);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(result.totalPages).toBe(1);
  });

  test("Should return paginated shape when filters object is empty", async () => {
    const result = await listResources({ filters: {} });

    expect(result.total).toBe(6);
    expect(result.resources).toHaveLength(6);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  test("Should handle empty repository", async () => {
    learningResourceRepository.clear();

    const result = await listResources({});

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });

  test("Should paginate correctly with pageSize=2 and return page 1", async () => {
    const result = await listResources({ page: 1, pageSize: 2 });

    expect(result.resources).toHaveLength(2);
    expect(result.total).toBe(6);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  test("Should paginate correctly and return page 2", async () => {
    const result = await listResources({ page: 2, pageSize: 2 });

    expect(result.resources).toHaveLength(2);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  test("Should clamp page to 1 when page < 1", async () => {
    const result = await listResources({ page: -5 });

    expect(result.page).toBe(1);
  });

  test("Should clamp pageSize to MAX_PAGE_SIZE when pageSize exceeds limit", async () => {
    const result = await listResources({ pageSize: 999 });

    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
  });

  test("Should clamp pageSize to 1 when pageSize < 1", async () => {
    const result = await listResources({ pageSize: 0 });

    expect(result.pageSize).toBe(1);
    expect(result.totalPages).toBe(6);
  });

  test("Should return resources with LOW difficulty", async () => {
    const result = await listResources({ filters: { difficulty: DifficultyType.LOW } });

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.LOW),
    ).toBe(true);
  });

  test("Should return resources with MEDIUM difficulty", async () => {
    const result = await listResources({ filters: { difficulty: DifficultyType.MEDIUM } });

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.MEDIUM),
    ).toBe(true);
  });

  test("Should return resources with HIGH difficulty", async () => {
    const result = await listResources({ filters: { difficulty: DifficultyType.HIGH } });

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.difficulty === DifficultyType.HIGH),
    ).toBe(true);
  });

  test("Should return resources with LOW energy level", async () => {
    const result = await listResources({ filters: { energyLevel: EnergyLevelType.LOW } });

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.energyLevel === EnergyLevelType.LOW),
    ).toBe(true);
  });

  test("Should return resources with HIGH energy level", async () => {
    const result = await listResources({ filters: { energyLevel: EnergyLevelType.HIGH } });

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.energyLevel === EnergyLevelType.HIGH),
    ).toBe(true);
  });

  test("Should return PENDING resources", async () => {
    const result = await listResources({ filters: { status: ResourceStatusType.PENDING } });

    expect(result.total).toBe(3);
    expect(
      result.resources.every((r) => r.status === ResourceStatusType.PENDING),
    ).toBe(true);
  });

  test("Should return IN_PROGRESS resources", async () => {
    const result = await listResources({ filters: { status: ResourceStatusType.IN_PROGRESS } });

    expect(result.total).toBe(1);
    expect(result.resources[0].title).toBe("Design Systems");
  });

  test("Should return COMPLETED resources", async () => {
    const result = await listResources({ filters: { status: ResourceStatusType.COMPLETED } });

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) => r.status === ResourceStatusType.COMPLETED),
    ).toBe(true);
  });

  test("Should return resources filtered by article type", async () => {
    const result = await listResources({ filters: { resourceTypeId: typeArticleId } });

    expect(result.total).toBe(3);
    expect(result.resources.every((r) => r.typeId === typeArticleId)).toBe(
      true,
    );
  });

  test("Should return empty when no resources match resourceTypeId", async () => {
    const nonExistentTypeId = await cryptoService.generateUUID();

    const result = await listResources({ filters: { resourceTypeId: nonExistentTypeId } });

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should return resources filtered by single topic", async () => {
    const result = await listResources({ filters: { topicIds: [topicProgrammingId] } });

    expect(result.total).toBe(4);
    expect(
      result.resources.every((r) => r.topicIds.includes(topicProgrammingId)),
    ).toBe(true);
  });

  test("Should return resources filtered by multiple topics (OR logic)", async () => {
    const result = await listResources({ filters: { topicIds: [topicDesignId, topicScienceId] } });

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

    const result = await listResources({ filters: { topicIds: [nonExistentTopicId] } });

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should return resources matching search query (case-insensitive)", async () => {
    const result = await listResources({ filters: { q: "typescript" } });

    expect(result.total).toBe(2);
    expect(
      result.resources.every((r) =>
        r.title.toLowerCase().includes("typescript"),
      ),
    ).toBe(true);
  });

  test("Should return empty when search query matches nothing", async () => {
    const result = await listResources({ filters: { q: "nonexistentxyz" } });

    expect(result.total).toBe(0);
    expect(result.resources).toHaveLength(0);
  });

  test("Should ignore empty q string and return all results", async () => {
    const result = await listResources({ filters: { q: "" } });

    expect(result.total).toBe(6);
  });

  test("Should return resources filtered by mental state DEEP_FOCUS", async () => {
    const deepFocusId = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: deepFocusId,
      userId: currentUser.id,
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

    const result = await listResources({ filters: { mentalState: MentalStateType.DEEP_FOCUS } });

    expect(result.total).toBe(1);
    expect(result.resources[0].title).toBe("Deep Work");
    expect(result.resources[0].mentalState).toBe(MentalStateType.DEEP_FOCUS);
  });

  test("Should apply difficulty + mentalState combined (AND logic)", async () => {
    const id1 = await cryptoService.generateUUID();
    const id2 = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: id1,
      userId: currentUser.id,
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
      userId: currentUser.id,
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

    const result = await listResources({
      filters: {
        mentalState: MentalStateType.DEEP_FOCUS,
        difficulty: DifficultyType.HIGH,
      },
    });

    expect(result.total).toBe(1);
    expect(result.resources[0].title).toBe("Deep Focus High");
  });

  test("Should apply filters combined with pagination", async () => {
    const result = await listResources({ filters: { difficulty: DifficultyType.LOW }, page: 1, pageSize: 1 });

    expect(result.total).toBe(2);
    expect(result.resources).toHaveLength(1);
    expect(result.totalPages).toBe(2);
    expect(result.resources[0].difficulty).toBe(DifficultyType.LOW);
  });

  test("Should return all resources when all filter values are undefined", async () => {
    const result = await listResources({
      filters: {
        topicIds: undefined,
        difficulty: undefined,
        energyLevel: undefined,
        status: undefined,
        resourceTypeId: undefined,
      },
    });

    expect(result.total).toBe(6);
    expect(result.resources).toHaveLength(6);
  });

  test("Should not return resources belonging to another user", async () => {
    const otherUserId = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: await cryptoService.generateUUID(),
      userId: otherUserId,
      title: "Someone Else's Resource",
      typeId: typeVideoId,
      topicIds: [],
      difficulty: DifficultyType.LOW,
      energyLevel: EnergyLevelType.LOW,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 15, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await listResources({});

    expect(result.total).toBe(6);
    expect(result.resources.some((r) => r.title === "Someone Else's Resource")).toBe(false);
  });

  test("Should report the response shape with resourceId and flat estimatedDurationMinutes, matching getResourceById", async () => {
    const result = await listResources({ filters: { q: "typescript basics" } });

    expect(result.resources).toHaveLength(1);
    const [resource] = result.resources;
    expect(resource).not.toHaveProperty("id");
    expect(resource).not.toHaveProperty("userId");
    expect(resource).not.toHaveProperty("estimatedDuration");
    expect(resource.resourceId).toBeDefined();
    expect(resource.estimatedDurationMinutes).toBe(30);
  });

  describe("sorting", () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const NEWEST_TITLE = "Rust Ownership Deep Dive";
    const OLDEST_TITLE = "Intro to Git";
    const ENERGY_ORDER: string[] = Object.values(EnergyLevelType);

    const saveDatedResource = async (title: string, createdAt: Date) =>
      learningResourceRepository.save({
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
        title,
        typeId: typeArticleId,
        topicIds: [],
        difficulty: DifficultyType.MEDIUM,
        energyLevel: EnergyLevelType.MEDIUM,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 40, isEstimated: true },
        createdAt,
        updatedAt: createdAt,
      });

    test("Should list the most recently created resource first by default", async () => {
      await saveDatedResource(NEWEST_TITLE, new Date(Date.now() + ONE_DAY_MS));
      await saveDatedResource(OLDEST_TITLE, new Date(Date.now() - ONE_DAY_MS));

      const result = await listResources();

      expect(result.resources[0].title).toBe(NEWEST_TITLE);
      expect(result.resources.at(-1)?.title).toBe(OLDEST_TITLE);
    });

    test("Should list the oldest resource first when sorting by creation date ascending", async () => {
      await saveDatedResource(NEWEST_TITLE, new Date(Date.now() + ONE_DAY_MS));
      await saveDatedResource(OLDEST_TITLE, new Date(Date.now() - ONE_DAY_MS));

      const result = await listResources({
        sort: {
          field: ResourceSortField.CREATED_AT,
          direction: SortDirection.ASC,
        },
      });

      expect(result.resources[0].title).toBe(OLDEST_TITLE);
    });

    test("Should sort titles alphabetically ignoring case", async () => {
      const result = await listResources({
        sort: { field: ResourceSortField.TITLE, direction: SortDirection.ASC },
      });

      const titles = result.resources.map((r) => r.title);
      expect(titles).toEqual(
        [...titles].sort((a, b) =>
          a.toLowerCase().localeCompare(b.toLowerCase()),
        ),
      );
    });

    test("Should sort energy levels by the domain order, not alphabetically", async () => {
      const result = await listResources({
        sort: {
          field: ResourceSortField.ENERGY_LEVEL,
          direction: SortDirection.DESC,
        },
      });

      const energyRanks = result.resources.map((r) =>
        ENERGY_ORDER.indexOf(r.energyLevel),
      );
      expect(energyRanks).toEqual([...energyRanks].sort((a, b) => b - a));
      expect(result.resources[0].energyLevel).toBe(EnergyLevelType.HIGH);
    });

    test("Should sort by estimated duration, shortest first", async () => {
      const result = await listResources({
        sort: {
          field: ResourceSortField.ESTIMATED_DURATION_MINUTES,
          direction: SortDirection.ASC,
        },
      });

      const durations = result.resources.map((r) => r.estimatedDurationMinutes);
      expect(durations).toEqual([...durations].sort((a, b) => a - b));
    });

    test("Should apply the sort before paginating", async () => {
      const firstPage = await listResources({
        sort: {
          field: ResourceSortField.ESTIMATED_DURATION_MINUTES,
          direction: SortDirection.DESC,
        },
        pageSize: 1,
      });
      const everything = await listResources({
        sort: {
          field: ResourceSortField.ESTIMATED_DURATION_MINUTES,
          direction: SortDirection.DESC,
        },
      });

      expect(firstPage.resources[0].resourceId).toBe(
        everything.resources[0].resourceId,
      );
    });
  });

  describe("query validation", () => {
    const UNKNOWN_SORT_FIELD = "popularity";
    const MALFORMED_TOPIC_ID = "not-a-uuid";

    test("Should reject an unknown sort field", async () => {
      const result = await getResourcesByFilter(
        { learningResourceRepository, currentUser },
        {
          sort: {
            field: UNKNOWN_SORT_FIELD as ResourceSortField,
            direction: SortDirection.ASC,
          },
        },
      );

      expect(result).toBeInstanceOf(InvalidDataError);
    });

    test("Should reject a topic id that is not a UUID", async () => {
      const result = await getResourcesByFilter(
        { learningResourceRepository, currentUser },
        { filters: { topicIds: [MALFORMED_TOPIC_ID as UUID] } },
      );

      expect(result).toBeInstanceOf(InvalidDataError);
    });

    test("Should reject more topic ids than the maximum", async () => {
      const tooManyTopicIds = await Promise.all(
        Array.from({ length: MAX_TOPIC_IDS + 1 }, () =>
          cryptoService.generateUUID(),
        ),
      );

      const result = await getResourcesByFilter(
        { learningResourceRepository, currentUser },
        { filters: { topicIds: tooManyTopicIds } },
      );

      expect(result).toBeInstanceOf(InvalidDataError);
    });
  });
});
