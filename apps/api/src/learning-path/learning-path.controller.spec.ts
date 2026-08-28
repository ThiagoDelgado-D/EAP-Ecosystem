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
  let pathRepository: ReturnType<typeof mockLearningPathRepository>;
  let cryptoService: CryptoServiceImpl;
  let jwtService: MockedJwtService;

  let ownerId: UUID;
  let intruderId: UUID;
  let ownerToken: string;
  let intruderToken: string;

  beforeAll(async () => {
    cryptoService = new CryptoServiceImpl();
    ownerId = await cryptoService.generateUUID();
    intruderId = await cryptoService.generateUUID();

    pathRepository = mockLearningPathRepository();
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
      .useValue(pathRepository)
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

    ownerToken = await jwtService.sign({ sub: ownerId });
    intruderToken = await jwtService.sign({ sub: intruderId });
  });

  afterAll(async () => await app.close());

  afterEach(() => pathRepository.reset());

  const authHeader = (bearerToken: string = ownerToken) => ({
    Authorization: `Bearer ${bearerToken}`,
  });

  describe("Unauthenticated access", () => {
    test("Should return 401 without a bearer token", async () => {
      await request(app.getHttpServer()).get("/api/v1/learning-paths").expect(401);
    });
  });

  describe("Full path -> node -> edge lifecycle", () => {
    test("creates a path, adds two nodes, links them with an edge, and reads it back", async () => {
      const createPathResponse = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(authHeader())
        .send({ title: "Angular from scratch", mode: "graph" })
        .expect(201);

      const pathId = createPathResponse.body.id;
      expect(createPathResponse.body.title).toBe("Angular from scratch");
      expect(createPathResponse.body.mode).toBe("graph");

      const componentsNodeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(authHeader())
        .send({ title: "Components", stubScope: "path-local" })
        .expect(201);

      const servicesNodeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(authHeader())
        .send({ title: "Services", stubScope: "path-local" })
        .expect(201);

      const componentsNodeId = componentsNodeResponse.body.id;
      const servicesNodeId = servicesNodeResponse.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(authHeader())
        .send({ sourceNodeId: componentsNodeId, targetNodeId: servicesNodeId })
        .expect(201);

      const pathDetailResponse = await request(app.getHttpServer())
        .get(`/api/v1/learning-paths/${pathId}`)
        .set(authHeader())
        .expect(200);

      expect(pathDetailResponse.body.path.id).toBe(pathId);
      expect(pathDetailResponse.body.nodes).toHaveLength(2);
      expect(pathDetailResponse.body.edges).toHaveLength(1);
      expect(pathDetailResponse.body.edges[0]).toMatchObject({
        sourceNodeId: componentsNodeId,
        targetNodeId: servicesNodeId,
      });
    });

    test("updates node progress", async () => {
      const createPathResponse = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(authHeader())
        .send({ title: "TypeScript, Step by Step", mode: "sequential" })
        .expect(201);
      const pathId = createPathResponse.body.id;

      const handbookNodeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(authHeader())
        .send({ title: "TypeScript Handbook" })
        .expect(201);
      const handbookNodeId = handbookNodeResponse.body.id;

      const updateProgressResponse = await request(app.getHttpServer())
        .patch(`/api/v1/learning-paths/${pathId}/nodes/${handbookNodeId}/progress`)
        .set(authHeader())
        .send({ progress: "done" })
        .expect(200);

      expect(updateProgressResponse.body.progress).toBe("done");
    });

    test("deletes an edge", async () => {
      const createPathResponse = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(authHeader())
        .send({ title: "Frontend Architecture Map", mode: "graph" })
        .expect(201);
      const pathId = createPathResponse.body.id;

      const cleanArchitectureNodeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(authHeader())
        .send({ title: "Clean Architecture" })
        .expect(201);
      const hexagonalArchitectureNodeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(authHeader())
        .send({ title: "Hexagonal Architecture" })
        .expect(201);

      const createEdgeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(authHeader())
        .send({
          sourceNodeId: cleanArchitectureNodeResponse.body.id,
          targetNodeId: hexagonalArchitectureNodeResponse.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/learning-paths/${pathId}/edges/${createEdgeResponse.body.id}`)
        .set(authHeader())
        .expect(200);

      const pathDetailResponse = await request(app.getHttpServer())
        .get(`/api/v1/learning-paths/${pathId}`)
        .set(authHeader())
        .expect(200);
      expect(pathDetailResponse.body.edges).toHaveLength(0);
    });
  });

  describe("Error cases", () => {
    test("Should return 400 when required fields are missing on create", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(authHeader())
        .send({ title: "Missing the required mode field" })
        .expect(400);
    });

    test("Should return 404 when getting a path that does not exist", async () => {
      const nonExistentPathId = await cryptoService.generateUUID();
      await request(app.getHttpServer())
        .get(`/api/v1/learning-paths/${nonExistentPathId}`)
        .set(authHeader())
        .expect(404);
    });

    test("Should return 403 when a different user requests the path", async () => {
      const createPathResponse = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(authHeader())
        .send({ title: "DevOps Fundamentals", mode: "sequential" })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/api/v1/learning-paths/${createPathResponse.body.id}`)
        .set(authHeader(intruderToken))
        .expect(403);
    });

    test("Should return 409 when adding a duplicate edge", async () => {
      const createPathResponse = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(authHeader())
        .send({ title: "System Design Map", mode: "graph" })
        .expect(201);
      const pathId = createPathResponse.body.id;

      const messageQueuesNodeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(authHeader())
        .send({ title: "Message Queues" })
        .expect(201);
      const eventSourcingNodeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(authHeader())
        .send({ title: "Event Sourcing" })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(authHeader())
        .send({
          sourceNodeId: messageQueuesNodeResponse.body.id,
          targetNodeId: eventSourcingNodeResponse.body.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(authHeader())
        .send({
          sourceNodeId: messageQueuesNodeResponse.body.id,
          targetNodeId: eventSourcingNodeResponse.body.id,
        })
        .expect(409);
    });

    test("Should return 400 when an edge is self-looping", async () => {
      const createPathResponse = await request(app.getHttpServer())
        .post("/api/v1/learning-paths")
        .set(authHeader())
        .send({ title: "Algorithms Practice", mode: "graph" })
        .expect(201);
      const pathId = createPathResponse.body.id;

      const bigONotationNodeResponse = await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/nodes`)
        .set(authHeader())
        .send({ title: "Big-O Notation" })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/learning-paths/${pathId}/edges`)
        .set(authHeader())
        .send({
          sourceNodeId: bigONotationNodeResponse.body.id,
          targetNodeId: bigONotationNodeResponse.body.id,
        })
        .expect(400);
    });
  });
});
