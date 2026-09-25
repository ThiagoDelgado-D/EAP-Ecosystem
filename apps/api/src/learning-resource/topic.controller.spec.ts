import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { MockedJwtService, UUID } from "domain-lib";
import { createLearningResourceTestApp } from "./learning-resource-module.fixture.js";

describe("TopicController (integration)", () => {
  let app: INestApplication;
  let jwtService: MockedJwtService;
  let ownerToken: string;
  let programmingId: UUID;
  let designId: UUID;

  beforeAll(async () => {
    const ctx = await createLearningResourceTestApp({
      topics: [
        { name: "Programming", color: "#FF5733" },
        { name: "Design", color: "#33A1FF" },
      ],
    });

    app = ctx.app;
    jwtService = ctx.jwtService;
    programmingId = ctx.topics[0].id;
    designId = ctx.topics[1].id;

    const ownerId: UUID = await ctx.cryptoService.generateUUID();
    ownerToken = await jwtService.sign({ sub: ownerId });
  });

  afterAll(async () => await app.close());

  describe("Unauthenticated access", () => {
    test("Should return 401 without a bearer token", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/topics")
        .expect(401);

      expect(response.body.topics).toBeUndefined();
    });
  });

  describe("GET /api/v1/topics", () => {
    test("Should return all topics with total count", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/topics")
        .set({ Authorization: `Bearer ${ownerToken}` })
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.topics).toHaveLength(2);
      expect(response.body.topics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: programmingId, name: "Programming", color: "#FF5733" }),
          expect.objectContaining({ id: designId, name: "Design", color: "#33A1FF" }),
        ]),
      );
    });
  });
});

describe("TopicController (integration) — empty state", () => {
  let app: INestApplication;
  let ownerToken: string;

  beforeAll(async () => {
    const ctx = await createLearningResourceTestApp();

    app = ctx.app;
    const ownerId: UUID = await ctx.cryptoService.generateUUID();
    ownerToken = await ctx.jwtService.sign({ sub: ownerId });
  });

  afterAll(async () => await app.close());

  test("Should return an empty list and total 0 when no topics exist", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/topics")
      .set({ Authorization: `Bearer ${ownerToken}` })
      .expect(200);

    expect(response.body.topics).toEqual([]);
    expect(response.body.total).toBe(0);
  });
});
