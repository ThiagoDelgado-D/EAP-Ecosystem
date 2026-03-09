import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { JsonStorage } from "infrastructure-lib";
import type { ResourceType } from "@learning-resource/domain";
import type { UUID } from "domain-lib";
import { JsonResourceTypeRepository } from "./json-resource-type-repository.js";
import { generateResourceType } from "../mocks/factories.js";

describe("JsonResourceTypeRepository", () => {
  let tempDir: string;
  let repository: JsonResourceTypeRepository;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "json-resource-type-test-"));
    const storage = new JsonStorage<ResourceType>(
      join(tempDir, "resource-types.json"),
    );
    repository = new JsonResourceTypeRepository(storage);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("save", () => {
    test("persists a new resource type", async () => {
      const resourceType = generateResourceType();
      await repository.save(resourceType);
      const result = await repository.findById(resourceType.id);
      expect(result?.id).toBe(resourceType.id);
    });
  });

  describe("update", () => {
    test("updates only the provided fields", async () => {
      const resourceType = generateResourceType();
      await repository.save(resourceType);
      await repository.update(resourceType.id, { displayName: "Updated Name" });
      const result = await repository.findById(resourceType.id);
      expect(result?.displayName).toBe("Updated Name");
      expect(result?.code).toBe(resourceType.code);
    });

    test("does nothing when id does not exist", async () => {
      await expect(
        repository.update(crypto.randomUUID() as UUID, {
          displayName: "Ghost",
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe("findAll", () => {
    test("returns all persisted resource types", async () => {
      await repository.save(generateResourceType());
      await repository.save(generateResourceType());
      const result = await repository.findAll();
      expect(result).toHaveLength(2);
    });

    test("returns empty array when no resource types exist", async () => {
      const result = await repository.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe("findById", () => {
    test("returns the correct resource type", async () => {
      const resourceType = generateResourceType();
      await repository.save(resourceType);
      const result = await repository.findById(resourceType.id);
      expect(result?.id).toBe(resourceType.id);
      expect(result?.code).toBe(resourceType.code);
      expect(result?.displayName).toBe(resourceType.displayName);
    });

    test("returns null when not found", async () => {
      const result = await repository.findById(crypto.randomUUID() as UUID);
      expect(result).toBeNull();
    });
  });
});
