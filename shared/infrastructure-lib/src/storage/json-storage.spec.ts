import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { JsonStorage } from "./json-storage.js";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { UUID } from "domain-lib";

interface TestEntity {
  id: UUID;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

describe("JsonStorage", () => {
  const makeId = () => crypto.randomUUID() as UUID;

  let tempDir: string;
  let filePath: string;
  let storage: JsonStorage<TestEntity>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "json-storage-test-"));
    filePath = join(tempDir, "test.json");
    storage = new JsonStorage<TestEntity>(filePath);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("readAll", () => {
    test("Should return an empty array when file not exist", async () => {
      const result = await storage.readAll();
      expect(result).toEqual([]);
    });

    test("parses stored entities correctly", async () => {
      const entity: TestEntity = {
        id: makeId(),
        name: "test",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };
      await storage.writeAll([entity]);
      const result = await storage.readAll();
      expect(result[0].name).toBe("test");
    });

    test("revives date strings back to Date objects", async () => {
      const entity: TestEntity = {
        id: makeId(),
        name: "test",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      };

      await storage.writeAll([entity]);
      const result = await storage.readAll();
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    test("Should throws descriptive error on malformed JSON", async () => {
      const { writeFile } = await import("fs/promises");
      await writeFile(filePath, "{ invalid json", "utf-8");
      await expect(storage.readAll()).rejects.toThrow(
        `Failed to parse JSON storage at ${filePath}`,
      );
    });
  });

  describe("findById", () => {
    test("Should return the correct entity by id", async () => {
      const id = makeId();
      const entity: TestEntity = {
        id,
        name: "found",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await storage.writeAll([entity]);
      const result = await storage.findById(id);
      expect(result?.name).toBe("found");
    });

    test("returns undefined when entity does not exist", async () => {
      const result = await storage.findById(makeId());
      expect(result).toBeUndefined();
    });
  });
  describe("save", () => {
    test("adds a new entity", async () => {
      const entity: TestEntity = {
        id: makeId(),
        name: "new",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await storage.save(entity);
      const all = await storage.readAll();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe("new");
    });

    test("updates an existing entity", async () => {
      const id = makeId();
      await storage.save({
        id,
        name: "original",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await storage.save({
        id,
        name: "updated",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const all = await storage.readAll();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe("updated");
    });
  });
  describe("delete", () => {
    test("removes the correct entity", async () => {
      const id = makeId();
      await storage.save({
        id,
        name: "to delete",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await storage.delete(id);
      const all = await storage.readAll();
      expect(all).toHaveLength(0);
    });

    test("does nothing when entity does not exist", async () => {
      const entity: TestEntity = {
        id: makeId(),
        name: "keep",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await storage.save(entity);
      await storage.delete(makeId());
      const all = await storage.readAll();
      expect(all).toHaveLength(1);
    });
  });
});
