import { beforeEach, describe, expect, test } from "vitest";
import { mockTopicRepository } from "../../mocks/mock-topic-repository.js";
import { mockCryptoService, type UUID } from "domain-lib";
import type { Topic } from "@learning-resource/domain";
import { getTopics } from "./get-topics.js";

describe("getTopics", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let topicRepository: ReturnType<typeof mockTopicRepository>;

  beforeEach(() => {
    cryptoService = mockCryptoService();
    topicRepository = mockTopicRepository([]);
  });

  test("Should return empty array when no topics exist", async () => {
    const result = await getTopics({ topicRepository });

    expect(result.topics).toEqual([]);
    expect(result.total).toBe(0);
  });

  test("Should return all topics with correct total", async () => {
    const topic1Id = await cryptoService.generateUUID();
    const topic2Id = await cryptoService.generateUUID();

    const topic1: Topic = {
      id: topic1Id,
      name: "Programming",
      color: "#FF5733",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const topic2: Topic = {
      id: topic2Id,
      name: "Design",
      color: "#1E90FF",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    topicRepository = mockTopicRepository([topic1, topic2]);

    const result = await getTopics({ topicRepository });

    expect(result.total).toBe(2);
    expect(result.topics).toHaveLength(2);
    expect(result.topics[0].name).toBe("Programming");
    expect(result.topics[1].name).toBe("Design");
  });

  test("Should return topics with all their fields", async () => {
    const topicId = await cryptoService.generateUUID();

    const topic: Topic = {
      id: topicId,
      name: "Programming",
      color: "#FF5733",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    topicRepository = mockTopicRepository([topic]);

    const result = await getTopics({ topicRepository });

    expect(result.topics[0]).toMatchObject({
      name: "Programming",
      color: "#FF5733",
    });
  });

  test("Should return topic with undefined color", async () => {
    const topicId = await cryptoService.generateUUID();

    const topic: Topic = {
      id: topicId,
      name: "Science",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    topicRepository = mockTopicRepository([topic]);

    const result = await getTopics({ topicRepository });

    expect(result.topics[0].color).toBeUndefined();
  });
});
