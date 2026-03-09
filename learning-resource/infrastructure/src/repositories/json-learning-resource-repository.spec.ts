import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { JsonStorage } from "infrastructure-lib";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
  type LearningResource,
} from "@learning-resource/domain";
import type { UUID } from "domain-lib";
import { JsonLearningResourceRepository } from "./json-learning-resource-repository.js";
import { generateLearningResource } from "../mocks/factories.js";

describe("JsonLearningResourceRepository", () => {
  let tempDir: string;
  let repository: JsonLearningResourceRepository;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "json-learning-resource-test-"));
    const storage = new JsonStorage<LearningResource>(
      join(tempDir, "learning-resources.json"),
    );
    repository = new JsonLearningResourceRepository(storage);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("save", () => {
    test("persists a new resource", async () => {
      const resource = generateLearningResource();
      await repository.save(resource);
      const result = await repository.findById(resource.id);
      expect(result?.id).toBe(resource.id);
    });
  });
  describe("update", () => {
    test("updates only the provided fields", async () => {
      const resource = generateLearningResource();
      await repository.save(resource);
      await repository.update(resource.id, { title: "Updated Title" });
      const result = await repository.findById(resource.id);
      expect(result?.title).toBe("Updated Title");
      expect(result?.url).toBe(resource.url);
    });

    test("does nothing when id does not exist", async () => {
      await expect(
        repository.update(crypto.randomUUID(), { title: "Ghost" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("delete", () => {
    test("removes the correct resource", async () => {
      const resource = generateLearningResource();
      await repository.save(resource);
      await repository.delete(resource.id);
      const result = await repository.findById(resource.id);
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    test("returns all persisted resources", async () => {
      await repository.save(generateLearningResource());
      await repository.save(generateLearningResource());
      const result = await repository.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe("findById", () => {
    test("returns the correct resource", async () => {
      const resource = generateLearningResource();
      await repository.save(resource);
      const result = await repository.findById(resource.id);
      expect(result?.id).toBe(resource.id);
    });

    test("returns null when not found", async () => {
      const result = await repository.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });
  });

  describe("findByTopicIds", () => {
    test("returns resources that have at least one matching topicId", async () => {
      const topicId = crypto.randomUUID() as UUID;
      const match = generateLearningResource({ topicIds: [topicId] });
      const noMatch = generateLearningResource({
        topicIds: [crypto.randomUUID()],
      });
      await repository.save(match);
      await repository.save(noMatch);
      const result = await repository.findByTopicIds([topicId]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(match.id);
    });
  });

  describe("findByDifficulty", () => {
    test("returns only resources with matching difficulty", async () => {
      await repository.save(
        generateLearningResource({ difficulty: DifficultyType.LOW }),
      );
      await repository.save(
        generateLearningResource({ difficulty: DifficultyType.HIGH }),
      );
      const result = await repository.findByDifficulty(DifficultyType.LOW);
      expect(result).toHaveLength(1);
      expect(result[0].difficulty).toBe(DifficultyType.LOW);
    });
  });

  describe("findByEnergyLevel", () => {
    test("returns only resources with matching energy level", async () => {
      await repository.save(
        generateLearningResource({ energyLevel: EnergyLevelType.LOW }),
      );
      await repository.save(
        generateLearningResource({ energyLevel: EnergyLevelType.HIGH }),
      );
      const result = await repository.findByEnergyLevel(EnergyLevelType.LOW);
      expect(result).toHaveLength(1);
      expect(result[0].energyLevel).toBe(EnergyLevelType.LOW);
    });
  });

  describe("findByStatus", () => {
    test("returns only resources with matching status", async () => {
      await repository.save(
        generateLearningResource({ status: ResourceStatusType.PENDING }),
      );
      await repository.save(
        generateLearningResource({ status: ResourceStatusType.COMPLETED }),
      );
      const result = await repository.findByStatus(ResourceStatusType.PENDING);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(ResourceStatusType.PENDING);
    });
  });

  describe("findByResourceTypeId", () => {
    test("returns only resources with matching typeId", async () => {
      const typeId = crypto.randomUUID();
      const match = generateLearningResource({ typeId });
      const noMatch = generateLearningResource({
        typeId: crypto.randomUUID() as UUID,
      });
      await repository.save(match);
      await repository.save(noMatch);
      const result = await repository.findByResourceTypeId(typeId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(match.id);
    });
  });
});
