import { mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { beforeEach, describe, expect, test } from "vitest";
import { generateLearningResource } from "../../mocks/factories.js";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository.js";
import {
  DifficultyType,
  EnergyLevelType,
  type LearningResource,
} from "@learning-resource/domain";
import { getSuggestions } from "./get-suggestions.js";

describe("getSuggestions", () => {
  let learningResourceRepository: ReturnType<typeof mockLearningResourceRepository>;
  let currentUser: CurrentUser;

  beforeEach(async () => {
    const cryptoService = mockCryptoService();
    currentUser = await mockCurrentUser(cryptoService);

    const resourceSeeds: Array<
      Pick<LearningResource, "title" | "difficulty" | "energyLevel" | "estimatedDuration">
    > = [
      { title: "TypeScript Basics", difficulty: DifficultyType.LOW, energyLevel: EnergyLevelType.LOW, estimatedDuration: { value: 30, isEstimated: true } },
      { title: "Advanced TypeScript Patterns", difficulty: DifficultyType.HIGH, energyLevel: EnergyLevelType.HIGH, estimatedDuration: { value: 120, isEstimated: true } },
      { title: "React Hooks Deep Dive", difficulty: DifficultyType.MEDIUM, energyLevel: EnergyLevelType.MEDIUM, estimatedDuration: { value: 60, isEstimated: true } },
      { title: "CSS Grid Fundamentals", difficulty: DifficultyType.LOW, energyLevel: EnergyLevelType.LOW, estimatedDuration: { value: 20, isEstimated: true } },
    ];

    const seedResources: LearningResource[] = [];
    for (const seed of resourceSeeds) {
      seedResources.push(
        generateLearningResource({
          id: await cryptoService.generateUUID(),
          userId: currentUser.id,
          typeId: await cryptoService.generateUUID(),
          ...seed,
        }),
      );
    }

    learningResourceRepository = mockLearningResourceRepository(seedResources);
  });

  test("Should return suggestions matching the query", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser }, "TypeScript");

    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestions).toContain("TypeScript Basics");
    expect(result.suggestions).toContain("Advanced TypeScript Patterns");
  });

  test("Should return empty array when q is empty string", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser }, "");

    expect(result.suggestions).toHaveLength(0);
  });

  test("Should return empty array when q is a single character", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser }, "T");

    expect(result.suggestions).toHaveLength(0);
  });

  test("Should return empty array when q is whitespace only", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser }, "   ");

    expect(result.suggestions).toHaveLength(0);
  });

  test("Should return empty array when no titles match", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser }, "Python");

    expect(result.suggestions).toHaveLength(0);
  });

  test("Should be case-insensitive", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser }, "typescript");

    expect(result.suggestions).toHaveLength(2);
  });

  test("Should respect the default limit of 5", async () => {
    const cryptoService = mockCryptoService();
    const extraTitles = [
      "TypeScript Design Patterns",
      "TypeScript with React",
      "TypeScript Compiler Internals",
      "Functional Programming in TypeScript",
      "TypeScript Monorepos with Nx",
    ];

    for (const title of extraTitles) {
      await learningResourceRepository.save(
        generateLearningResource({
          id: await cryptoService.generateUUID(),
          userId: currentUser.id,
          typeId: await cryptoService.generateUUID(),
          title,
        }),
      );
    }

    const result = await getSuggestions({ learningResourceRepository, currentUser }, "TypeScript");

    expect(result.suggestions).toHaveLength(5);
  });

  test("Should trim whitespace from query before searching", async () => {
    const result = await getSuggestions({ learningResourceRepository, currentUser }, "  TypeScript  ");

    expect(result.suggestions).toHaveLength(2);
  });

  test("Should not return suggestions from another user's resources", async () => {
    const cryptoService = mockCryptoService();
    const otherUserId = await cryptoService.generateUUID();

    await learningResourceRepository.save(
      generateLearningResource({
        id: await cryptoService.generateUUID(),
        userId: otherUserId,
        typeId: await cryptoService.generateUUID(),
        title: "TypeScript for Beginners",
      }),
    );

    const result = await getSuggestions({ learningResourceRepository, currentUser }, "TypeScript");

    expect(result.suggestions).not.toContain("TypeScript for Beginners");
    expect(result.suggestions).toHaveLength(2);
  });
});
