import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { MockedJwtService, UUID } from "domain-lib";
import { createLearningResourceTestApp } from "./learning-resource-module.fixture.js";

describe("ResourceTypeController (integration)", () => {
  let app: INestApplication;
  let jwtService: MockedJwtService;
  let ownerToken: string;
  let videoId: UUID;
  let articleId: UUID;

  beforeAll(async () => {
    const ctx = await createLearningResourceTestApp({
      resourceTypes: [
        { code: "video", displayName: "Video" },
        { code: "article", displayName: "Article" },
      ],
    });

    app = ctx.app;
    jwtService = ctx.jwtService;
    videoId = ctx.resourceTypes[0].id;
    articleId = ctx.resourceTypes[1].id;

    const ownerId: UUID = await ctx.cryptoService.generateUUID();
    ownerToken = await jwtService.sign({ sub: ownerId });
  });

  afterAll(async () => await app.close());

  describe("Unauthenticated access", () => {
    test("Should return 401 without a bearer token", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/resource-types")
        .expect(401);

      expect(response.body.resourceTypes).toBeUndefined();
    });
  });

  describe("GET /api/v1/resource-types", () => {
    test("Should return all resource types with total count", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/resource-types")
        .set({ Authorization: `Bearer ${ownerToken}` })
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.resourceTypes).toHaveLength(2);
      expect(response.body.resourceTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: videoId, code: "video", displayName: "Video" }),
          expect.objectContaining({ id: articleId, code: "article", displayName: "Article" }),
        ]),
      );
    });
  });
});

describe("ResourceTypeController (integration) — empty state", () => {
  let app: INestApplication;
  let ownerToken: string;

  beforeAll(async () => {
    const ctx = await createLearningResourceTestApp();

    app = ctx.app;
    const ownerId: UUID = await ctx.cryptoService.generateUUID();
    ownerToken = await ctx.jwtService.sign({ sub: ownerId });
  });

  afterAll(async () => await app.close());

  test("Should return an empty list and total 0 when no resource types exist", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/resource-types")
      .set({ Authorization: `Bearer ${ownerToken}` })
      .expect(200);

    expect(response.body.resourceTypes).toEqual([]);
    expect(response.body.total).toBe(0);
  });
});
