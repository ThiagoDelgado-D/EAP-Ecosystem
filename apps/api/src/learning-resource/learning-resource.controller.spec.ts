import {
  mockLearningResourceRepository,
  mockResourceTypeRepository,
  mockTopicRepository,
  type IUrlMetadataService,
} from "@learning-resource/application";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { mockJwtService, type MockedJwtService, type UUID } from "domain-lib";
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
  let jwtService: MockedJwtService;

  let topicId: UUID;
  let resourceTypeId: UUID;
  let ownerId: UUID;
  let intruderId: UUID;
  let ownerToken: string;
  let intruderToken: string;

  beforeAll(async () => {
    cryptoService = new CryptoServiceImpl();
    topicId = await cryptoService.generateUUID();
    resourceTypeId = await cryptoService.generateUUID();
    ownerId = await cryptoService.generateUUID();
    intruderId = await cryptoService.generateUUID();
    jwtService = mockJwtService();

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
      .overrideProvider("IJwtService")
      .useValue(jwtService)
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

    ownerToken = await jwtService.sign({ sub: ownerId });
    intruderToken = await jwtService.sign({ sub: intruderId });
  });
  afterAll(async () => await app.close());

  afterEach(() => resourceRepo.reset());

  const authHeader = (bearerToken: string = ownerToken) => ({
    Authorization: `Bearer ${bearerToken}`,
  });

  const createResource = (
    overrides: Record<string, unknown> = {},
    bearerToken: string = ownerToken,
  ) =>
    request(app.getHttpServer())
      .post("/api/v1/learning-resources")
      .set(authHeader(bearerToken))
      .send({
        title: "TypeScript Advanced",
        resourceTypeId,
        topicIds: [topicId],
        difficulty: "high",
        estimatedDurationMinutes: 120,
        ...overrides,
      });

  describe("Unauthenticated access", () => {
    test("Should return 401 without a bearer token", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .expect(401);
    });
  });

  describe("Ownership", () => {
    test("Should return 403 when a different user requests the resource", async () => {
      const createResponse = await createResource().expect(201);

      await request(app.getHttpServer())
        .get(`/api/v1/learning-resources/${createResponse.body.id}`)
        .set(authHeader(intruderToken))
        .expect(403);
    });

    test("Should return 403 when a different user tries to update the resource", async () => {
      const createResponse = await createResource().expect(201);

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${createResponse.body.id}`)
        .set(authHeader(intruderToken))
        .send({ title: "Hijacked Title" })
        .expect(403);
    });

    test("Should return 403 when a different user tries to delete the resource", async () => {
      const createResponse = await createResource().expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/learning-resources/${createResponse.body.id}`)
        .set(authHeader(intruderToken))
        .expect(403);
    });

    test("Should not return another user's resources in the list", async () => {
      await createResource({ title: "Owned Resource" }).expect(201);
      await createResource({ title: "Intruder Resource" }, intruderToken).expect(201);

      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .expect(200);

      expect(response.body.resources).toHaveLength(1);
      expect(response.body.resources[0].title).toBe("Owned Resource");
    });
  });

  describe("POST /api/v1/learning-resources", () => {
    test("Should create a resource and return 201", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .set(authHeader())
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
        .set(authHeader())
        .send({ title: "Missing fields" })
        .expect(400);
    });

    test("Should return 400 when resourceTypeId is not valid UUID", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .set(authHeader())
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
        .set(authHeader())
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
    test("Should return paginated shape when no resources exist", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .expect(200);

      expect(response.body.resources).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(20);
      expect(response.body.totalPages).toBe(0);
    });

    test("Should return paginated shape with existing resources", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .set(authHeader())
        .send({
          title: "TypeScript Advanced",
          resourceTypeId,
          topicIds: [topicId],
          difficulty: "high",
          estimatedDurationMinutes: 120,
        });

      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .expect(200);

      expect(response.body.resources).toHaveLength(1);
      expect(response.body.total).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(1);
      expect(response.body.resources[0].title).toBe("TypeScript Advanced");
    });

    test("Should respect pageSize param", async () => {
      for (let i = 0; i < 3; i++) {
        await createResource({ title: `Resource ${i}`, difficulty: "low", estimatedDurationMinutes: 10 });
      }

      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ pageSize: 2 })
        .expect(200);

      expect(response.body.resources).toHaveLength(2);
      expect(response.body.total).toBe(3);
      expect(response.body.totalPages).toBe(2);
    });

    test("Should respect page param", async () => {
      for (let i = 0; i < 3; i++) {
        await createResource({ title: `Resource ${i}`, difficulty: "low", estimatedDurationMinutes: 10 });
      }

      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ page: 2, pageSize: 2 })
        .expect(200);

      expect(response.body.resources).toHaveLength(1);
      expect(response.body.page).toBe(2);
    });

    test("Should fall back to page=1 when page param is non-numeric", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ page: "abc" })
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(Number.isNaN(response.body.page)).toBe(false);
    });

    test("Should fall back to pageSize=20 when pageSize param is non-numeric", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ pageSize: "xyz" })
        .expect(200);

      expect(response.body.pageSize).toBe(20);
      expect(Number.isNaN(response.body.pageSize)).toBe(false);
    });

    test("Should ignore resourceTypeId filter when value is not a valid UUID", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ resourceTypeId: "not-a-uuid" })
        .expect(200);

      expect(response.body.resources).toBeDefined();
      expect(Number.isNaN(response.body.total)).toBe(false);
    });
  });

  describe("GET /api/v1/learning-resources — filtering", () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources")
        .set(authHeader())
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
        .set(authHeader())
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
        .set(authHeader())
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
        .set(authHeader())
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
        .set(authHeader())
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
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .expect(200);

      expect(response.body.total).toBe(5);
      expect(response.body.resources).toHaveLength(5);
    });

    test("Should filter by difficulty", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ difficulty: "high" })
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.resources.every((r: { difficulty: string }) => r.difficulty === "high")).toBe(true);
    });

    test("Should filter by status", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ status: "completed" })
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.resources.every((r: { status: string }) => r.status === "completed")).toBe(true);
    });

    test("Should filter by q (title search, case-insensitive)", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ q: "typescript" })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.resources[0].title).toBe("TypeScript Advanced");
    });

    test("Should return empty when q matches nothing", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ q: "nonexistentxyz" })
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.resources).toHaveLength(0);
    });

    test("Should combine filters (difficulty + status)", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/learning-resources")
        .set(authHeader())
        .query({ difficulty: "medium", status: "completed" })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.resources[0].title).toBe("React Hooks Deep Dive");
    });

  });
  describe("GET /api/v1/learning-resources/:id", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      const response = await createResource().expect(201);
      resourceId = response.body.id;
    });

    test("Should return the resource when it exists", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/learning-resources/${resourceId}`)
        .set(authHeader())
        .expect(200);

      expect(response.body.title).toBe("TypeScript Advanced");
      expect(response.body.resourceId).toBe(resourceId);
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .get(`/api/v1/learning-resources/${nonExistentId}`)
        .set(authHeader())
        .expect(404);
    });

    test("Should return 400 when id is not a valid UUID", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/learning-resources/not-a-uuid")
        .set(authHeader())
        .expect(400);
    });
  });
  describe("PATCH /api/v1/learning-resources/:id", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      const response = await createResource().expect(201);
      resourceId = response.body.id;
    });

    test("Should update title successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}`)
        .set(authHeader())
        .send({ title: "TypeScript Masterclass" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.title).toBe("TypeScript Masterclass");
    });

    test("Should clear url when empty string is provided", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}`)
        .set(authHeader())
        .send({ url: "" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.url).toBeUndefined();
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}`)
        .set(authHeader())
        .send({ title: "New Title" })
        .expect(404);
    });

    test("Should return 400 when no fields are provided", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}`)
        .set(authHeader())
        .send({})
        .expect(400);
    });

    test("Should return 400 when title exceeds max length", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}`)
        .set(authHeader())
        .send({ title: "x".repeat(251) })
        .expect(400);
    });
  });
  describe("DELETE /api/v1/learning-resources/:id", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      const response = await createResource().expect(201);
      resourceId = response.body.id;
    });

    test("Should delete the resource and return 200", async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/learning-resources/${resourceId}`)
        .set(authHeader())
        .expect(200);

      expect(resourceRepo.count()).toBe(0);
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .delete(`/api/v1/learning-resources/${nonExistentId}`)
        .set(authHeader())
        .expect(404);
    });

    test("Should return 400 when id is not a valid UUID", async () => {
      await request(app.getHttpServer())
        .delete("/api/v1/learning-resources/not-a-uuid")
        .set(authHeader())
        .expect(400);
    });
  });
  describe("PATCH /api/v1/learning-resources/:id/difficulty", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      const response = await createResource().expect(201);
      resourceId = response.body.id;
    });

    test("Should toggle difficulty successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/difficulty`)
        .set(authHeader())
        .send({ difficulty: "low" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.difficulty).toBe("low");
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}/difficulty`)
        .set(authHeader())
        .send({ difficulty: "low" })
        .expect(404);
    });

    test("Should return 400 when difficulty is invalid", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/difficulty`)
        .set(authHeader())
        .send({ difficulty: "INVALID" })
        .expect(400);
    });
  });
  describe("PATCH /api/v1/learning-resources/:id/energy", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      const response = await createResource().expect(201);
      resourceId = response.body.id;
    });

    test("Should toggle energy level successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/energy`)
        .set(authHeader())
        .send({ energyLevel: "low" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.energyLevel).toBe("low");
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}/energy`)
        .set(authHeader())
        .send({ energyLevel: "low" })
        .expect(404);
    });

    test("Should return 400 when energyLevel is invalid", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/energy`)
        .set(authHeader())
        .send({ energyLevel: "INVALID" })
        .expect(400);
    });
  });
  describe("PATCH /api/v1/learning-resources/:id/status", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      const response = await createResource().expect(201);
      resourceId = response.body.id;
    });

    test("Should toggle status successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/status`)
        .set(authHeader())
        .send({ status: "completed" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.status).toBe("completed");
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}/status`)
        .set(authHeader())
        .send({ status: "completed" })
        .expect(404);
    });

    test("Should return 400 when status is invalid", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/status`)
        .set(authHeader())
        .send({ status: "INVALID" })
        .expect(400);
    });
  });

  describe("PATCH /api/v1/learning-resources/:id/mental-state", () => {
    let resourceId: UUID;

    beforeEach(async () => {
      const response = await createResource().expect(201);
      resourceId = response.body.id;
    });

    test("Should toggle mental state to deep_focus successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/mental-state`)
        .set(authHeader())
        .send({ mentalState: "deep_focus" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.mentalState).toBe("deep_focus");
    });

    test("Should toggle mental state to light_read successfully", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/mental-state`)
        .set(authHeader())
        .send({ mentalState: "light_read" })
        .expect(200);

      const updated = await resourceRepo.findById(resourceId);
      expect(updated?.mentalState).toBe("light_read");
    });

    test("Should return 404 when resource does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${nonExistentId}/mental-state`)
        .set(authHeader())
        .send({ mentalState: "deep_focus" })
        .expect(404);
    });

    test("Should return 400 when mentalState is invalid", async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/learning-resources/${resourceId}/mental-state`)
        .set(authHeader())
        .send({ mentalState: "INVALID" })
        .expect(400);
    });
  });

  describe("POST /api/v1/learning-resources/preview", () => {
    test("Should return 200 with metadata for a YouTube URL", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .set(authHeader())
        .send({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
        .expect(200);

      expect(response.body.title).toBe("Some Video");
      expect(response.body.resourceTypeCode).toBe("video");
    });

    test("Should resolve resourceTypeId when code matches an existing resource type", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .set(authHeader())
        .send({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
        .expect(200);

      expect(response.body.resourceTypeId).toBe(resourceTypeId);
    });

    test("Should return 200 with empty body when site returns no metadata", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .set(authHeader())
        .send({ url: "https://example.com/empty" })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.title).toBeUndefined();
      expect(response.body.resourceTypeId).toBeUndefined();
    });

    test("Should return 400 when URL is missing", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .set(authHeader())
        .send({})
        .expect(400);
    });

    test("Should return 400 when URL is malformed", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .set(authHeader())
        .send({ url: "not-a-valid-url" })
        .expect(400);
    });

    test("Should return 400 when URL is empty string", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .set(authHeader())
        .send({ url: "" })
        .expect(400);
    });

    test("Should ignore extra fields (whitelist)", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-resources/preview")
        .set(authHeader())
        .send({ url: "https://github.com/test", extra: "field" })
        .expect(400);
    });
  });
});
