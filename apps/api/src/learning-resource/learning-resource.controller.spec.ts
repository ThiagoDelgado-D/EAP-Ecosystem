import {
  mockLearningResourceRepository,
  mockResourceTypeRepository,
  mockTopicRepository,
} from "@learning-resource/application";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { UUID } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import { LearningResourceModule } from "./learning-resource.module.js";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";

describe("LearningResourceController (integration)", () => {
  let app: INestApplication;
  let resourceRepo: ReturnType<typeof mockLearningResourceRepository>;
  let topicRepo: ReturnType<typeof mockTopicRepository>;
  let resourceTypeRepo: ReturnType<typeof mockResourceTypeRepository>;
  let cryptoService: CryptoServiceImpl;

  let topicId: UUID;
  let resourceTypeId: UUID;

  beforeAll(async () => {
    cryptoService = new CryptoServiceImpl();
    topicId = await cryptoService.generateUUID();
    resourceTypeId = await cryptoService.generateUUID();

    resourceRepo = mockLearningResourceRepository([]);
    topicRepo = mockTopicRepository([
      {
        id: topicId,
        name: "Programming",
        color: "#FF5733",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    resourceTypeRepo = mockResourceTypeRepository([
      {
        id: resourceTypeId,
        code: "video",
        displayName: "Video",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const module = await Test.createTestingModule({
      imports: [LearningResourceModule],
    })
      .overrideProvider("ILearningResourceRepository")
      .useValue(resourceRepo)
      .overrideProvider("ITopicRepository")
      .useValue(topicRepo)
      .overrideProvider("IResourceTypeRepository")
      .useValue(resourceTypeRepo)
      .overrideProvider("ICryptoService")
      .useValue(cryptoService)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });
  afterAll(async () => await app.close());

  afterEach(() => resourceRepo.reset());

  describe("POST /api/v1/learning-resources", () => {
    test("Should create a resource and return 201", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "TypeScript Advanced",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 120,
        })
        .expect(201);

      expect(resourceRepo.count()).toBe(1);
    });

    test("Should return 400 when required fields are missing", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({ title: "Missing fields" })
        .expect(400);
    });

    test("Should return 400 when resourceTypeId is not valid UUID", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "TypeScript Advanced",
          resourceTypeId: "not-a-uuid",
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 120,
        })
        .expect(400);
    });

    test("Should return 404 when resourceType does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "TypeScript Advanced",
          resourceTypeId: nonExistentId,
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 120,
        })
        .expect(404);
    });
  });
  describe("GET /api/v1/learning-resources", () => {
    test("Should return empty list when no resources exist", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .expect(200)
        .expect({ resources: [] });
    });

    test("Should return list with existing resources", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "TypeScript Advanced",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 120,
        });

      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .expect(200);

      expect(response.body.resources).toHaveLength(1);
      expect(response.body.resources[0].title).toBe("TypeScript Advanced");
    });
  });
  describe("GET /api/v1/learning-resources/filter", () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "TypeScript Advanced",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 180,
          status: "pending",
        });

      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "CSS Basics",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "low",
          estimatedDurationMinutes: 20,
          status: "completed",
        });

      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "Clean Architecture",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 240,
          status: "in_progress",
        });

      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "NestJS Fundamentals",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "medium",
          estimatedDurationMinutes: 90,
          status: "pending",
        });

      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "React Hooks Deep Dive",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "medium",
          estimatedDurationMinutes: 60,
          status: "completed",
        });
    });

    test("Should return all resources when no filters provided", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources/filter")
        .expect(200);

      expect(response.body.total).toBe(5);
    });

    test("Should filter by difficulty", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources/filter")
        .query({ difficulty: "high" })
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.resources[0].title).toBe("TypeScript Advanced");
    });

    test("Should filter by topicIds as array", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources/filter")
        .query({ topicIds: [topicId] })
        .expect(200);

      expect(response.body.total).toBe(5);
    });

    test("Should filter by topicIds as single string (coercion)", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources/filter")
        .query({ topicIds: topicId })
        .expect(200);

      expect(response.body.total).toBe(5);
    });

    test("Should return 400 when difficulty is invalid", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/learning-resources/filter")
        .query({ difficulty: "INVALID" })
        .expect(400);
    });
  });
  describe("GET /api/v1/learning-resources/:id", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "TypeScript Advanced",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 120,
        });

      resourceId = resourceRepo.learningResources[0].id;
    });

    test("Should return the resource when it exists", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/learning-resources/${resourceId}`)
        .expect(200);

      expect(response.body.title).toBe("TypeScript Advanced");
      expect(response.body.resourceId).toBe(resourceId);
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .get(`/api/v1/learning-resources/${nonExistentId}`)
        .expect(404);
    });

    test("Should return 400 when id is not a valid UUID", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/learning-resources/not-a-uuid")
        .expect(400);
    });
  });
  describe("PATCH /api/v1/learning-resources/:id", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .send({
          title: "TypeScript Advanced",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 120,
        });

      resourceId = resourceRepo.learningResources[0].id;
    });

    test("Should update title successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}`)
        .send({ title: "TypeScript Masterclass" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.title).toBe("TypeScript Masterclass");
    });

    test("Should clear url when empty string is provided", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}`)
        .send({ url: "" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.url).toBeUndefined();
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}`)
        .send({ title: "New Title" })
        .expect(404);
    });

    test("Should return 400 when no fields are provided", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}`)
        .send({})
        .expect(400);
    });

    test("Should return 400 when title exceeds max length", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}`)
        .send({ title: "x".repeat(251) })
        .expect(400);
    });
  });
});
