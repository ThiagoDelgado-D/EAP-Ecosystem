import {
  mockLearningResourceRepository,
  mockResourceTypeRepository,
  mockTopicRepository,
  type IUrlMetadataService,
} from "@learning-resource/application";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { UUID } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import { LearningResourceModule } from "./learning-resource.module.js";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  LearningResourceEntity,
  ResourceTypeEntity,
  TopicEntity,
} from "@learning-resource/infrastructure";

describe("LearningResourceController (integration)", () => {
  let app: INestApplication;
  let resourceRepo: ReturnType<typeof mockLearningResourceRepository>;
  let topicRepo: ReturnType<typeof mockTopicRepository>;
  let resourceTypeRepo: ReturnType<typeof mockResourceTypeRepository>;
  let cryptoService: CryptoServiceImpl;
  let mockMetadataService: IUrlMetadataService;

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

    mockMetadataService = {
      extract: async (url: string) => {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          return { title: "Some Video", resourceTypeCode: "video" };
        }
        if (url.includes("github.com")) {
          return { title: "Some Repo", resourceTypeCode: "document" };
        }
        if (url.includes("example.com/empty")) {
          return {};
        }
        return { title: "Some Article", resourceTypeCode: "article" };
      },
    };

    const module = await Test.createTestingModule({
      imports: [LearningResourceModule],
    })
      .overrideProvider(getRepositoryToken(LearningResourceEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(TopicEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(ResourceTypeEntity))
      .useValue({})
      .overrideProvider("ILearningResourceRepository")
      .useValue(resourceRepo)
      .overrideProvider("ITopicRepository")
      .useValue(topicRepo)
      .overrideProvider("IResourceTypeRepository")
      .useValue(resourceTypeRepo)
      .overrideProvider("ICryptoService")
      .useValue(cryptoService)
      .overrideProvider("IUrlMetadataService")
      .useValue(mockMetadataService)
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
  describe("DELETE /api/v1/learning-resources/:id", () => {
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

    test("Should delete the resource and return 200", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/learning-resources/${resourceId}`)
        .expect(200);

      expect(resourceRepo.count()).toBe(0);
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .delete(`/api/v1/learning-resources/${nonExistentId}`)
        .expect(404);
    });

    test("Should return 400 when id is not a valid UUID", async () => {
      await request(app.getHttpServer())
        .delete("/api/v1/learning-resources/not-a-uuid")
        .expect(400);
    });
  });
  describe("PATCH /api/v1/learning-resources/:id/difficulty", () => {
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

    test("Should toggle difficulty successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/difficulty`)
        .send({ difficulty: "low" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.difficulty).toBe("low");
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}/difficulty`)
        .send({ difficulty: "low" })
        .expect(404);
    });

    test("Should return 400 when difficulty is invalid", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/difficulty`)
        .send({ difficulty: "INVALID" })
        .expect(400);
    });
  });
  describe("PATCH /api/v1/learning-resources/:id/energy", () => {
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

    test("Should toggle energy level successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/energy`)
        .send({ energyLevel: "low" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.energyLevel).toBe("low");
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}/energy`)
        .send({ energyLevel: "low" })
        .expect(404);
    });

    test("Should return 400 when energyLevel is invalid", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/energy`)
        .send({ energyLevel: "INVALID" })
        .expect(400);
    });
  });
  describe("PATCH /api/v1/learning-resources/:id/status", () => {
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

    test("Should toggle status successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/status`)
        .send({ status: "completed" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.status).toBe("completed");
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}/status`)
        .send({ status: "completed" })
        .expect(404);
    });

    test("Should return 400 when status is invalid", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/status`)
        .send({ status: "INVALID" })
        .expect(400);
    });
  });

  describe("PATCH /api/v1/learning-resources/:id/mental-state", () => {
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

    test("Should toggle mental state to deep_focus successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/mental-state`)
        .send({ mentalState: "deep_focus" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.mentalState).toBe("deep_focus");
    });

    test("Should toggle mental state to light_read successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/mental-state`)
        .send({ mentalState: "light_read" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.mentalState).toBe("light_read");
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}/mental-state`)
        .send({ mentalState: "deep_focus" })
        .expect(404);
    });

    test("Should return 400 when mentalState is invalid", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/mental-state`)
        .send({ mentalState: "INVALID" })
        .expect(400);
    });
  });

  describe("POST /api/v1/learning-resources/preview", () => {
    test("Should return 200 with metadata for a YouTube URL", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .send({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
        .expect(200);

      expect(response.body.title).toBe("Some Video");
      expect(response.body.resourceTypeCode).toBe("video");
    });

    test("Should resolve resourceTypeId when code matches an existing resource type", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .send({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
        .expect(200);

      expect(response.body.resourceTypeId).toBe(resourceTypeId);
    });

    test("Should return 200 with empty body when site returns no metadata", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .send({ url: "https://example.com/empty" })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.title).toBeUndefined();
      expect(response.body.resourceTypeId).toBeUndefined();
    });

    test("Should return 400 when URL is missing", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .send({})
        .expect(400);
    });

    test("Should return 400 when URL is malformed", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .send({ url: "not-a-valid-url" })
        .expect(400);
    });

    test("Should return 400 when URL is empty string", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .send({ url: "" })
        .expect(400);
    });

    test("Should ignore extra fields (whitelist)", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .send({ url: "https://github.com/test", extra: "field" })
        .expect(400);
    });
  });
});
