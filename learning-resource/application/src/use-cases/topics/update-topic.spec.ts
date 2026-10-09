import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, mockCurrentUser, type CurrentUser } from "domain-lib";
import { TopicTone, type Topic } from "@learning-resource/domain";
import { mockTopicRepository } from "../../mocks/mock-topic-repository.js";
import { generateTopic } from "../../mocks/factories.js";
import { DuplicateTopicNameError, TopicNotFoundError } from "../../errors/topic-errors.js";
import { updateTopic } from "./update-topic.js";

const RUST_TOPIC_NAME = "Rust";
const RUST_LANG_TOPIC_NAME = "Rust lang";
const SYSTEMS_DESIGN_TOPIC_NAME = "Systems Design";

describe("updateTopic", () => {
  let topicRepository: ReturnType<typeof mockTopicRepository>;
  let currentUser: CurrentUser;
  let rustTopic: Topic;
  let systemsDesignTopic: Topic;
  let someoneElsesTopic: Topic;

  beforeEach(async () => {
    const cryptoService = mockCryptoService();
    currentUser = await mockCurrentUser(cryptoService);
    const anotherLearner = await mockCurrentUser(cryptoService);
    rustTopic = generateTopic({
      userId: currentUser.id,
      name: RUST_TOPIC_NAME,
      color: TopicTone.EMBER,
    });
    systemsDesignTopic = generateTopic({
      userId: currentUser.id,
      name: SYSTEMS_DESIGN_TOPIC_NAME,
    });
    someoneElsesTopic = generateTopic({ userId: anotherLearner.id });
    topicRepository = mockTopicRepository([rustTopic, systemsDesignTopic, someoneElsesTopic]);
  });

  const update = (request: Parameters<typeof updateTopic>[1]) =>
    updateTopic({ topicRepository, currentUser }, request);

  test("Should rename a topic and keep its tone", async () => {
    const result = await update({ topicId: rustTopic.id, name: RUST_LANG_TOPIC_NAME });

    if (result instanceof Error) throw result;
    expect(result.name).toBe(RUST_LANG_TOPIC_NAME);
    expect(result.color).toBe(TopicTone.EMBER);
  });

  test("Should recolor a topic and keep its name", async () => {
    const result = await update({ topicId: rustTopic.id, color: TopicTone.PLUM });

    if (result instanceof Error) throw result;
    expect(result.name).toBe(RUST_TOPIC_NAME);
    expect(result.color).toBe(TopicTone.PLUM);
  });

  test("Should allow changing only the case of the topic's own name", async () => {
    const result = await update({ topicId: rustTopic.id, name: RUST_TOPIC_NAME.toUpperCase() });

    expect(result).not.toBeInstanceOf(Error);
  });

  test("Should reject a name another of the learner's topics already uses", async () => {
    const result = await update({ topicId: rustTopic.id, name: SYSTEMS_DESIGN_TOPIC_NAME });

    expect(result).toBeInstanceOf(DuplicateTopicNameError);
  });

  test("Should treat another learner's topic as not found", async () => {
    const result = await update({ topicId: someoneElsesTopic.id, name: RUST_LANG_TOPIC_NAME });

    expect(result).toBeInstanceOf(TopicNotFoundError);
  });
});
