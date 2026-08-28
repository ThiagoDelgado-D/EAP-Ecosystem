import { mockLearningPathRepository } from "@learning-resource/application";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { mockJwtService, type MockedJwtService, type UUID } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
} from "@learning-resource/infrastructure";
import { LearningPathModule } from "./learning-path.module.js";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";

describe("LearningPathController (integration)", () => {
  let app: INestApplication;
  let pathRepo: ReturnType<typeof mockLearningPathRepository>;
  let cryptoService: CryptoServiceImpl;
  let jwtService: MockedJwtService;

  let userId: UUID;
  let otherUserId: UUID;
  let token: string;
  let otherToken: string;

  beforeAll(async () => {
    cryptoService = new CryptoServiceImpl();
    userId = await cryptoService.generateUUID();
    otherUserId = await cryptoService.generateUUID();

    pathRepo = mockLearningPathRepository();
    jwtService = mockJwtService();

    const module = await Test.createTestingModule({
      imports: [LearningPathModule],
    })
      .overrideProvider(getRepositoryToken(LearningPathEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningPathNodeEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningPathEdgeEntity))
      .useValue({})
      .overrideProvider("ILearningPathRepository")
      .useValue(pathRepo)
      .overrideProvider("ICryptoService")
      .useValue(cryptoService)
      .overrideProvider("IJwtService")
      .useValue(jwtService)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    token = await jwtService.sign({ sub: userId });
    otherToken = await jwtService.sign({ sub: otherUserId });
  });

  afterAll(async () => await app.close());

  afterEach(() => pathRepo.reset());

  const auth = (t: string = token) => ({ Authorization: `Bearer ${t}` });

  describe("Unauthenticated access", () => {
    test("Should return 401 without a bearer token", async () => {
      await request(app.getHttpServer()).get("/api/v1/learning-paths").expect(401);
    });
  });

  describe("Full path -> node -> edge lifecycle", () => {
    test("creates a path, adds two nodes, links them with an edge, and reads it back", async () => {
      const createRes = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(auth())
        .send({ title: "Angular from scratch", mode: "graph" })
        .expect(201);

      const pathId = createRes.body.id;
      expect(createRes.body.title).toBe("Angular from scratch");
      expect(createRes.body.mode).toBe("graph");

      const nodeARes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(auth())
        .send({ title: "Components", stubScope: "path-local" })
        .expect(201);

      const nodeBRes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(auth())
        .send({ title: "Services", stubScope: "path-local" })
        .expect(201);

      const nodeAId = nodeARes.body.id;
      const nodeBId = nodeBRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(auth())
        .send({ sourceNodeId: nodeAId, targetNodeId: nodeBId })
        .expect(201);

      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/learning-paths/${pathId}`)
        .set(auth())
        .expect(200);

      expect(getRes.body.path.id).toBe(pathId);
      expect(getRes.body.nodes).toHaveLength(2);
      expect(getRes.body.edges).toHaveLength(1);
      expect(getRes.body.edges[0]).toMatchObject({ sourceNodeId: nodeAId, targetNodeId: nodeBId });
    });

    test("updates node progress", async () => {
      const createRes = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(auth())
        .send({ title: "Path", mode: "sequential" })
        .expect(201);
      const pathId = createRes.body.id;

      const nodeRes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(auth())
        .send({ title: "Step 1" })
        .expect(201);
      const nodeId = nodeRes.body.id;

      const progressRes = await request(app.getHttpServer())
        .patch(`/api/v1/learning-paths/${pathId}/nodes/${nodeId}/progress`)
        .set(auth())
        .send({ progress: "done" })
        .expect(200);

      expect(progressRes.body.progress).toBe("done");
    });

    test("deletes an edge", async () => {
      const createRes = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(auth())
        .send({ title: "Path", mode: "graph" })
        .expect(201);
      const pathId = createRes.body.id;

      const nodeARes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(auth())
        .send({ title: "A" })
        .expect(201);
      const nodeBRes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(auth())
        .send({ title: "B" })
        .expect(201);

      const edgeRes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(auth())
        .send({ sourceNodeId: nodeARes.body.id, targetNodeId: nodeBRes.body.id })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/learning-paths/${pathId}/edges/${edgeRes.body.id}`)
        .set(auth())
        .expect(200);

      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/learning-paths/${pathId}`)
        .set(auth())
        .expect(200);
      expect(getRes.body.edges).toHaveLength(0);
    });
  });

  describe("Error cases", () => {
    test("Should return 400 when required fields are missing on create", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(auth())
        .send({ title: "No mode" })
        .expect(400);
    });

    test("Should return 404 when getting a path that does not exist", async () => {
      const nonExistentId = await cryptoService.generateUUID();
      await request(app.getHttpServer())
        .get(`/api/v1/learning-paths/${nonExistentId}`)
        .set(auth())
        .expect(404);
    });

    test("Should return 403 when a different user requests the path", async () => {
      const createRes = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(auth())
        .send({ title: "Private path", mode: "sequential" })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/api/v1/learning-paths/${createRes.body.id}`)
        .set(auth(otherToken))
        .expect(403);
    });

    test("Should return 409 when adding a duplicate edge", async () => {
      const createRes = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(auth())
        .send({ title: "Path", mode: "graph" })
        .expect(201);
      const pathId = createRes.body.id;

      const nodeARes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(auth())
        .send({ title: "A" })
        .expect(201);
      const nodeBRes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(auth())
        .send({ title: "B" })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(auth())
        .send({ sourceNodeId: nodeARes.body.id, targetNodeId: nodeBRes.body.id })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(auth())
        .send({ sourceNodeId: nodeARes.body.id, targetNodeId: nodeBRes.body.id })
        .expect(409);
    });

    test("Should return 400 when an edge is self-looping", async () => {
      const createRes = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(auth())
        .send({ title: "Path", mode: "graph" })
        .expect(201);
      const pathId = createRes.body.id;

      const nodeRes = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(auth())
        .send({ title: "A" })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(auth())
        .send({ sourceNodeId: nodeRes.body.id, targetNodeId: nodeRes.body.id })
        .expect(400);
    });
  });
});
