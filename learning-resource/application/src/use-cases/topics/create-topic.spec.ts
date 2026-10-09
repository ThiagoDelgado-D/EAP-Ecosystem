import { beforeEach, describe, expect, test } from "vitest";
import {
  InvalidDataError,
  mockCryptoService,
  mockCurrentUser,
  type CurrentUser,
} from "domain-lib";
import { TopicTone } from "@learning-resource/domain";
import { mockTopicRepository } from "../../mocks/mock-topic-repository.js";
import { generateTopic } from "../../mocks/factories.js";
import { DuplicateTopicNameError } from "../../errors/topic-errors.js";
import { createTopic, TOPIC_TONE_ROTATION } from "./create-topic.js";
import { TOPIC_NAME_MAX_LENGTH } from "./topic-response.js";

const RUST_TOPIC_NAME = "Rust";
const RUST_TOPIC_NAME_SHOUTED = "RUST";

describe("createTopic", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let topicRepository: ReturnType<typeof mockTopicRepository>;
  let currentUser: CurrentUser;
  let anotherLearner: CurrentUser;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    topicRepository = mockTopicRepository([]);
    currentUser = await mockCurrentUser(cryptoService);
    anotherLearner = await mockCurrentUser(cryptoService);
  });

  const create = (request: Parameters<typeof createTopic>[1]) =>
    createTopic({ topicRepository, cryptoService, currentUser }, request);

  test("Should create a topic owned by the current learner with the chosen tone", async () => {
    const result = await create({ name: RUST_TOPIC_NAME, color: TopicTone.EMBER });

    if (result instanceof Error) throw result;
    expect(result.name).toBe(RUST_TOPIC_NAME);
    expect(result.color).toBe(TopicTone.EMBER);
    expect(topicRepository.topics[0].userId).toBe(currentUser.id);
  });

  test("Should pick the next tone in the rotation when none is chosen", async () => {
    topicRepository = mockTopicRepository([
      generateTopic({ userId: currentUser.id }),
      generateTopic({ userId: currentUser.id }),
      generateTopic({ userId: anotherLearner.id }),
    ]);

    const result = await create({ name: RUST_TOPIC_NAME });

    if (result instanceof Error) throw result;
    expect(result.color).toBe(TOPIC_TONE_ROTATION[2]);
  });

  test("Should reject a name the learner already uses, regardless of case", async () => {
    topicRepository = mockTopicRepository([
      generateTopic({ userId: currentUser.id, name: RUST_TOPIC_NAME }),
    ]);

    const result = await create({ name: RUST_TOPIC_NAME_SHOUTED });

    expect(result).toBeInstanceOf(DuplicateTopicNameError);
  });

  test("Should allow a name that only another learner uses", async () => {
    topicRepository = mockTopicRepository([
      generateTopic({ userId: anotherLearner.id, name: RUST_TOPIC_NAME }),
    ]);

    const result = await create({ name: RUST_TOPIC_NAME });

    expect(result).not.toBeInstanceOf(Error);
  });

  test("Should reject an empty name, an overly long name and an unknown tone", async () => {
    const tooLongName = "x".repeat(TOPIC_NAME_MAX_LENGTH + 1);
    const unknownTone = "neon" as TopicTone;

    expect(await create({ name: "" })).toBeInstanceOf(InvalidDataError);
    expect(await create({ name: tooLongName })).toBeInstanceOf(InvalidDataError);
    expect(await create({ name: RUST_TOPIC_NAME, color: unknownTone })).toBeInstanceOf(
      InvalidDataError,
    );
  });
});
