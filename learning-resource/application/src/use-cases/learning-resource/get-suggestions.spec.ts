import { mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { getSuggestions } from "./get-suggestions.js";

describe("getSuggestions", () => {
  let learningResourceRepository: ReturnType<typeof mockLearningResourceRepository>;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    const cryptoService = mockCryptoService();
    currentUser = await mockCurrentUser(cryptoService);

    const seedResources: LearningResource[] = [
      {
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
        title: "TypeScript Basics",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
        difficulty: DifficultyType.LOW,
        energyLevel: EnergyLevelType.LOW,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 30, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
        title: "Advanced TypeScript Patterns",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
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
        title: "React Hooks Deep Dive",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
        difficulty: DifficultyType.MEDIUM,
        energyLevel: EnergyLevelType.MEDIUM,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 60, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
        title: "CSS Grid Fundamentals",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
        difficulty: DifficultyType.LOW,
        energyLevel: EnergyLevelType.LOW,
        status: ResourceStatusType.COMPLETED,
        estimatedDuration: { value: 20, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    learningResourceRepository = mockLearningResourceRepository(seedResources);
  });

  test("Should return suggestions matching the query", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser },"TypeScript");

    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestions).toContain("TypeScript Basics");
    expect(result.suggestions).toContain("Advanced TypeScript Patterns");
  });

  test("Should return empty array when q is empty string", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser },"");

    expect(result.suggestions).toHaveLength(0);
  });

  test("Should return empty array when q is a single character", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser },"T");

    expect(result.suggestions).toHaveLength(0);
  });

  test("Should return empty array when q is whitespace only", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser },"   ");

    expect(result.suggestions).toHaveLength(0);
  });

  test("Should return empty array when no titles match", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser },"Python");

    expect(result.suggestions).toHaveLength(0);
  });

  test("Should be case-insensitive", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser },"typescript");

    expect(result.suggestions).toHaveLength(2);
  });

  test("Should respect the default limit of 5", async () => {
    const cryptoService = mockCryptoService();
    const extraResources: LearningResource[] = [
      {
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
        title: "TypeScript Design Patterns",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
        difficulty: DifficultyType.HIGH,
        energyLevel: EnergyLevelType.HIGH,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 90, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
        title: "TypeScript with React",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
        difficulty: DifficultyType.MEDIUM,
        energyLevel: EnergyLevelType.MEDIUM,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 75, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
        title: "TypeScript Compiler Internals",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
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
        title: "Functional Programming in TypeScript",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
        difficulty: DifficultyType.HIGH,
        energyLevel: EnergyLevelType.MEDIUM,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 120, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: await cryptoService.generateUUID(),
        userId: currentUser.id,
        title: "TypeScript Monorepos with Nx",
        typeId: await cryptoService.generateUUID(),
        topicIds: [],
        difficulty: DifficultyType.MEDIUM,
        energyLevel: EnergyLevelType.LOW,
        status: ResourceStatusType.PENDING,
        estimatedDuration: { value: 60, isEstimated: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    for (const r of extraResources) {
      await learningResourceRepository.save(r);
    }

    const result = await getSuggestions({ learningResourceRepository, currentUser },"TypeScript");

    expect(result.suggestions).toHaveLength(5);
  });

  test("Should trim whitespace from query before searching", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser },"  TypeScript  ");

    expect(result.suggestions).toHaveLength(2);
  });

  test("Should not return suggestions from another user's resources", async () => {
    const cryptoService = mockCryptoService();
    const otherUserId = await cryptoService.generateUUID();

    await learningResourceRepository.save({
      id: await cryptoService.generateUUID(),
      userId: otherUserId,
      title: "TypeScript for Beginners",
      typeId: await cryptoService.generateUUID(),
      topicIds: [],
      difficulty: DifficultyType.LOW,
      energyLevel: EnergyLevelType.LOW,
      status: ResourceStatusType.PENDING,
      estimatedDuration: { value: 30, isEstimated: true },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getSuggestions({ learningResourceRepository, currentUser },"TypeScript");

    expect(result.suggestions).not.toContain("TypeScript for Beginners");
    expect(result.suggestions).toHaveLength(2);
  });
});
