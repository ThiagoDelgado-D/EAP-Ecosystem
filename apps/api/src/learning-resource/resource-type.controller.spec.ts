import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { MockedJwtService, UUID } from "domain-lib";
import { createLearningResourceTestApp } from "./learning-resource-module.fixture.js";

describe("ResourceTypeController (integration)", () => {
  let app: INestApplication;
  let jwtService: MockedJwtService;
  let ownerToken: string;

  beforeAll(async () => {
    const ctx = await createLearningResourceTestApp({
      resourceTypes: [
        { code: "video", displayName: "Video" },
        { code: "article", displayName: "Article" },
      ],
    });

    app = ctx.app;
    jwtService = ctx.jwtService;

    const ownerId: UUID = await ctx.cryptoService.generateUUID();
    ownerToken = await jwtService.sign({ sub: ownerId });
  });

  afterAll(async () => await app.close());

  describe("Unauthenticated access", () => {
    test("Should return 401 without a bearer token", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/resource-types")
        .expect(401);
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
      expect(response.body.resourceTypes.map((rt: { code: string }) => rt.code)).toEqual(
        expect.arrayContaining(["video", "article"]),
      );
    });
  });
});
