import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { UUID } from "domain-lib";
import { TopicTone } from "@learning-resource/domain";
import { createLearningResourceTestApp } from "./learning-resource-module.fixture.js";

const TOPICS_URL = "/api/v1/topics";
const RUST_TOPIC_NAME = "Rust";
const SYSTEMS_DESIGN_TOPIC_NAME = "Systems Design";
const RUST_LANG_TOPIC_NAME = "Rust lang";
const INTRUDER_TOPIC_NAME = "Gardening";
const NEW_TOPIC_NAME = "Distributed Systems";
const UNKNOWN_TONE = "neon";
const DUPLICATE_TOPIC_NAME_ERROR = "DUPLICATE_TOPIC_NAME_ERROR";
const TOPIC_NOT_FOUND_ERROR = "TOPIC_NOT_FOUND_ERROR";

describe("TopicController (integration)", () => {
  let app: INestApplication;
  let ctx: Awaited<ReturnType<typeof createLearningResourceTestApp>>;
  let ownerToken: string;
  let intruderToken: string;
  let rustTopicId: UUID;
  let systemsDesignTopicId: UUID;
  let intruderTopicId: UUID;
  let resourceTypeId: UUID;

  beforeEach(async () => {
    const ownerId = crypto.randomUUID() as UUID;
    const intruderId = crypto.randomUUID() as UUID;
    ctx = await createLearningResourceTestApp({
      topics: [
        { userId: ownerId, name: RUST_TOPIC_NAME, color: TopicTone.EMBER },
        { userId: ownerId, name: SYSTEMS_DESIGN_TOPIC_NAME, color: TopicTone.INFO },
        { userId: intruderId, name: INTRUDER_TOPIC_NAME, color: TopicTone.PINE },
      ],
      resourceTypes: [{ code: "video", displayName: "Video" }],
    });

    app = ctx.app;
    rustTopicId = ctx.topics[0].id;
    systemsDesignTopicId = ctx.topics[1].id;
    intruderTopicId = ctx.topics[2].id;
    resourceTypeId = ctx.resourceTypes[0].id;
    ownerToken = await ctx.jwtService.sign({ sub: ownerId });
    intruderToken = await ctx.jwtService.sign({ sub: intruderId });
  });

  afterEach(async () => await app.close());

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());

  test("Should return 401 without a bearer token", async () => {
    const response = await http().get(TOPICS_URL).expect(401);

    expect(response.body.topics).toBeUndefined();
  });

  describe("GET /api/v1/topics", () => {
    test("Should list only the learner's topics, with how many resources use each", async () => {
      await http()
        .post("/api/v1/learning-resources")
        .set(authHeader(ownerToken))
        .send({
          title: "The Rust Book",
          resourceTypeId,
          topicIds: [rustTopicId],
          difficulty: "medium",
          estimatedDurationMinutes: 60,
        })
        .expect(201);

      const response = await http().get(TOPICS_URL).set(authHeader(ownerToken)).expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.topics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: rustTopicId, color: TopicTone.EMBER, resourceCount: 1 }),
          expect.objectContaining({ id: systemsDesignTopicId, resourceCount: 0 }),
        ]),
      );
      expect(response.body.topics[0]).not.toHaveProperty("userId");
    });
  });

  describe("POST /api/v1/topics", () => {
    test("Should create a topic with the chosen tone", async () => {
      const response = await http()
        .post(TOPICS_URL)
        .set(authHeader(ownerToken))
        .send({ name: NEW_TOPIC_NAME, color: TopicTone.PLUM })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({ name: NEW_TOPIC_NAME, color: TopicTone.PLUM }),
      );
    });

    test("Should assign a tone when none is sent", async () => {
      const response = await http()
        .post(TOPICS_URL)
        .set(authHeader(ownerToken))
        .send({ name: NEW_TOPIC_NAME })
        .expect(201);

      expect(Object.values(TopicTone)).toContain(response.body.color);
    });

    test("Should return 409 for a name the learner already uses, regardless of case", async () => {
      const response = await http()
        .post(TOPICS_URL)
        .set(authHeader(ownerToken))
        .send({ name: RUST_TOPIC_NAME.toLowerCase() })
        .expect(409);

      expect(response.body.error).toBe(DUPLICATE_TOPIC_NAME_ERROR);
    });

    test("Should return 400 for an unknown tone", async () => {
      const response = await http()
        .post(TOPICS_URL)
        .set(authHeader(ownerToken))
        .send({ name: NEW_TOPIC_NAME, color: UNKNOWN_TONE })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe("PATCH /api/v1/topics/:id", () => {
    test("Should rename and recolor the learner's topic", async () => {
      const response = await http()
        .patch(`${TOPICS_URL}/${rustTopicId}`)
        .set(authHeader(ownerToken))
        .send({ name: RUST_LANG_TOPIC_NAME, color: TopicTone.OCHRE })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({ id: rustTopicId, name: RUST_LANG_TOPIC_NAME, color: TopicTone.OCHRE }),
      );
    });

    test("Should return 409 when renaming onto another of the learner's topics", async () => {
      const response = await http()
        .patch(`${TOPICS_URL}/${rustTopicId}`)
        .set(authHeader(ownerToken))
        .send({ name: SYSTEMS_DESIGN_TOPIC_NAME })
        .expect(409);

      expect(response.body.error).toBe(DUPLICATE_TOPIC_NAME_ERROR);
    });

    test("Should return 404 for another learner's topic", async () => {
      const response = await http()
        .patch(`${TOPICS_URL}/${intruderTopicId}`)
        .set(authHeader(ownerToken))
        .send({ name: RUST_LANG_TOPIC_NAME })
        .expect(404);

      expect(response.body.error).toBe(TOPIC_NOT_FOUND_ERROR);
    });
  });

  describe("DELETE /api/v1/topics/:id", () => {
    test("Should delete the learner's topic", async () => {
      await http().delete(`${TOPICS_URL}/${rustTopicId}`).set(authHeader(ownerToken)).expect(200);

      const response = await http().get(TOPICS_URL).set(authHeader(ownerToken)).expect(200);
      expect(response.body.topics.map((topic: { id: UUID }) => topic.id)).toEqual([
        systemsDesignTopicId,
      ]);
    });

    test("Should return 404 for another learner's topic and keep it", async () => {
      const response = await http()
        .delete(`${TOPICS_URL}/${intruderTopicId}`)
        .set(authHeader(ownerToken))
        .expect(404);

      expect(response.body.error).toBe(TOPIC_NOT_FOUND_ERROR);
      const intruderTopics = await http().get(TOPICS_URL).set(authHeader(intruderToken)).expect(200);
      expect(intruderTopics.body.total).toBe(1);
    });
  });
});
