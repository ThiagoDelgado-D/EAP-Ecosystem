import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { JsonStorage } from "infrastructure-lib";
import type { Topic } from "@learning-resource/domain";
import type { UUID } from "domain-lib";
import { JsonTopicRepository } from "./json-topic-repository.js";
import { generateTopic } from "../mocks/factories.js";

describe("JsonTopicRepository", () => {
  let tempDir: string;
  let repository: JsonTopicRepository;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "json-topic-test-"));
    const storage = new JsonStorage<Topic>(join(tempDir, "topics.json"));
    repository = new JsonTopicRepository(storage);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("save", () => {
    test("persists a new topic", async () => {
      const topic = generateTopic();
      await repository.save(topic);
      const result = await repository.findById(topic.id);
      expect(result?.id).toBe(topic.id);
    });
  });

  describe("update", () => {
    test("updates only the provided fields", async () => {
      const topic = generateTopic();
      await repository.save(topic);
      await repository.update(topic.id, { name: "Updated Name" });
      const result = await repository.findById(topic.id);
      expect(result?.name).toBe("Updated Name");
    });

    test("does nothing when id does not exist", async () => {
      await expect(
        repository.update(crypto.randomUUID() as UUID, { name: "Ghost" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("delete", () => {
    test("removes the correct topic", async () => {
      const topic = generateTopic();
      await repository.save(topic);
      await repository.delete(topic.id);
      const result = await repository.findById(topic.id);
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    test("returns all persisted topics", async () => {
      await repository.save(generateTopic());
      await repository.save(generateTopic());
      const result = await repository.findAll();
      expect(result).toHaveLength(2);
    });
  });

  describe("findById", () => {
    test("returns the correct topic", async () => {
      const topic = generateTopic();
      await repository.save(topic);
      const result = await repository.findById(topic.id);
      expect(result?.id).toBe(topic.id);
    });

    test("returns null when not found", async () => {
      const result = await repository.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });
  });
});
