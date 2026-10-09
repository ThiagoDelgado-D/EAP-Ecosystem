import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockCurrentUser, type CurrentUser, type UUID } from "domain-lib";
import { mockTopicRepository } from "../../mocks/mock-topic-repository.js";
import { generateTopic } from "../../mocks/factories.js";
import { getTopics } from "./get-topics.js";

const RUST_RESOURCE_COUNT = 3;

describe("getTopics", () => {
  let currentUser: CurrentUser;
  let anotherLearner: CurrentUser;

  beforeEach(async () => {
    const cryptoService = mockCryptoService();
    currentUser = await mockCurrentUser(cryptoService);
    anotherLearner = await mockCurrentUser(cryptoService);
  });

  test("Should return an empty list for a learner without topics", async () => {
    const result = await getTopics({ topicRepository: mockTopicRepository([]), currentUser });

    expect(result.topics).toEqual([]);
    expect(result.total).toBe(0);
  });

  test("Should return only the current learner's topics", async () => {
    const ownTopic = generateTopic({ userId: currentUser.id });
    const someoneElsesTopic = generateTopic({ userId: anotherLearner.id });

    const result = await getTopics({
      topicRepository: mockTopicRepository([ownTopic, someoneElsesTopic]),
      currentUser,
    });

    expect(result.total).toBe(1);
    expect(result.topics.map((topic) => topic.id)).toEqual([ownTopic.id]);
  });

  test("Should include how many resources use each topic, without the owner id", async () => {
    const rustTopic = generateTopic({ userId: currentUser.id });
    const resourceCounts = new Map<UUID, number>([[rustTopic.id, RUST_RESOURCE_COUNT]]);

    const result = await getTopics({
      topicRepository: mockTopicRepository([rustTopic], (topicId) => resourceCounts.get(topicId) ?? 0),
      currentUser,
    });

    const [listedTopic] = result.topics;
    expect(listedTopic.resourceCount).toBe(RUST_RESOURCE_COUNT);
    expect(listedTopic.name).toBe(rustTopic.name);
    expect(listedTopic.color).toBe(rustTopic.color);
    expect(listedTopic).not.toHaveProperty("userId");
  });
});
