import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import type { Topic } from "@learning-resource/domain";
import { mockTopicRepository } from "../../mocks/mock-topic-repository.js";
import { generateTopic } from "../../mocks/factories.js";
import { TopicNotFoundError } from "../../errors/topic-errors.js";
import { deleteTopic } from "./delete-topic.js";

describe("deleteTopic", () => {
  let topicRepository: ReturnType<typeof mockTopicRepository>;
  let currentUser: CurrentUser;
  let ownTopic: Topic;
  let someoneElsesTopic: Topic;

  beforeEach(async () => {
    const cryptoService = mockCryptoService();
    currentUser = await mockCurrentUser(cryptoService);
    const anotherLearner = await mockCurrentUser(cryptoService);
    ownTopic = generateTopic({ userId: currentUser.id });
    someoneElsesTopic = generateTopic({ userId: anotherLearner.id });
    topicRepository = mockTopicRepository([ownTopic, someoneElsesTopic]);
  });

  test("Should delete the learner's own topic", async () => {
    const result = await deleteTopic({ topicRepository, currentUser }, { topicId: ownTopic.id });

    expect(result).toBeUndefined();
    expect(topicRepository.topics.map((topic) => topic.id)).toEqual([someoneElsesTopic.id]);
  });

  test("Should treat another learner's topic as not found and keep it", async () => {
    const result = await deleteTopic(
      { topicRepository, currentUser },
      { topicId: someoneElsesTopic.id },
    );

    expect(result).toBeInstanceOf(TopicNotFoundError);
    expect(topicRepository.topics).toHaveLength(2);
  });
});
