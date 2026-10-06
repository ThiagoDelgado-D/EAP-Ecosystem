import {
  generateLearningResourceCandidate,
  mockLearningPathCandidatesPort,
  mockLearningResourceCandidatesPort,
  mockRecommendationContextRepository,
} from "@recommendation/application";
import { EnergyLevel, MentalState } from "@recommendation/domain";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { mockJwtService, type MockedJwtService, type UUID } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import { getRepositoryToken } from "@nestjs/typeorm";
import { RecommendationContextEntity } from "@recommendation/infrastructure";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { RecommendationModule } from "./recommendation.module.js";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";

describe("RecommendationController (integration)", () => {
  let app: INestApplication;
  let recommendationContextRepository: ReturnType<
    typeof mockRecommendationContextRepository
  >;
  let learningResourceCandidatesPort: ReturnType<
    typeof mockLearningResourceCandidatesPort
  >;
  let learningPathCandidatesPort: ReturnType<
    typeof mockLearningPathCandidatesPort
  >;
  let cryptoService: CryptoServiceImpl;
  let jwtService: MockedJwtService;

  let ownerId: UUID;
  let ownerToken: string;

  beforeAll(async () => {
    cryptoService = new CryptoServiceImpl();
    ownerId = await cryptoService.generateUUID();

    recommendationContextRepository = mockRecommendationContextRepository();
    learningResourceCandidatesPort = mockLearningResourceCandidatesPort();
    learningPathCandidatesPort = mockLearningPathCandidatesPort();
    jwtService = mockJwtService();

    const module = await Test.createTestingModule({
      imports: [RecommendationModule],
    })
      .overrideProvider(getRepositoryToken(RecommendationContextEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningPathNodeEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningPathEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningPathEdgeEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningResourceEntity))
      .useValue({})
      .overrideProvider("IRecommendationContextRepository")
      .useValue(recommendationContextRepository)
      .overrideProvider("ILearningResourceCandidatesPort")
      .useValue(learningResourceCandidatesPort)
      .overrideProvider("ILearningPathCandidatesPort")
      .useValue(learningPathCandidatesPort)
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
  });

  afterAll(async () => await app.close());

  afterEach(() => {
    recommendationContextRepository.reset();
    learningResourceCandidatesPort.reset();
    learningPathCandidatesPort.reset();
  });

  const authHeader = (bearerToken: string = ownerToken) => ({
    Authorization: `Bearer ${bearerToken}`,
  });

  describe("Unauthenticated access", () => {
    test("Should return 401 without a bearer token", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/recommendations")
        .expect(401);

      expect(response.body.message).toBe("Unauthorized");
    });
  });

  describe("GET /api/v1/recommendations", () => {
    test("returns 404 when the user hasn't set a recommendation context yet", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/recommendations")
        .set(authHeader())
        .expect(404);

      expect(response.body.error).toBe("RECOMMENDATION_CONTEXT_NOT_FOUND_ERROR");
    });

    test("scores candidates from both ports against the stored context", async () => {
      recommendationContextRepository.contexts.push({
        userId: ownerId,
        energyLevel: EnergyLevel.LOW,
        updatedAt: new Date(),
      });
      const resourceId = await cryptoService.generateUUID();
      learningResourceCandidatesPort.candidatesByUser[ownerId] = [
        {
          resourceId,
          title: "Intro to Kubernetes",
          energyLevel: EnergyLevel.LOW,
        },
      ];

      const response = await request(app.getHttpServer())
        .get("/api/v1/recommendations")
        .set(authHeader())
        .expect(200);

      expect(response.body).toEqual([
        expect.objectContaining({ resourceId, title: "Intro to Kubernetes" }),
      ]);
    });

    describe("with dismissed candidates excluded", () => {
      let kubernetesResourceId: UUID;
      let dockerResourceId: UUID;
      let terraformResourceId: UUID;

      beforeEach(async () => {
        recommendationContextRepository.contexts.push({
          userId: ownerId,
          energyLevel: EnergyLevel.LOW,
          updatedAt: new Date(),
        });
        kubernetesResourceId = await cryptoService.generateUUID();
        dockerResourceId = await cryptoService.generateUUID();
        terraformResourceId = await cryptoService.generateUUID();
        learningResourceCandidatesPort.candidatesByUser[ownerId] = [
          generateLearningResourceCandidate({
            resourceId: kubernetesResourceId,
            title: "Intro to Kubernetes",
          }),
          generateLearningResourceCandidate({
            resourceId: dockerResourceId,
            title: "Docker Deep Dive",
          }),
          generateLearningResourceCandidate({
            resourceId: terraformResourceId,
            title: "Terraform Basics",
          }),
        ];
      });

      test("leaves out a single dismissed resource", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/recommendations")
          .query({ exclude: kubernetesResourceId })
          .set(authHeader())
          .expect(200);

        expect(response.body.map((r: { resourceId: UUID }) => r.resourceId))
          .toEqual(expect.arrayContaining([dockerResourceId, terraformResourceId]));
        expect(response.body).toHaveLength(2);
      });

      test("leaves out every resource passed as a repeated exclude parameter", async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/api/v1/recommendations?exclude=${kubernetesResourceId}&exclude=${dockerResourceId}`,
          )
          .set(authHeader())
          .expect(200);

        expect(response.body).toEqual([
          expect.objectContaining({ resourceId: terraformResourceId }),
        ]);
      });

      test("returns 400 when an excluded id is not a UUID", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/recommendations")
          .query({ exclude: "not-a-uuid" })
          .set(authHeader())
          .expect(400);

        expect(response.body.message).toBeDefined();
      });
    });
  });

  describe("GET /api/v1/recommendations/context", () => {
    test("returns 404 when the user hasn't set a recommendation context yet", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/recommendations/context")
        .set(authHeader())
        .expect(404);

      expect(response.body.error).toBe("RECOMMENDATION_CONTEXT_NOT_FOUND_ERROR");
    });

    test("returns the context the user last saved", async () => {
      recommendationContextRepository.contexts.push({
        userId: ownerId,
        energyLevel: EnergyLevel.HIGH,
        availableMinutes: 25,
        mentalState: MentalState.REVIEW,
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get("/api/v1/recommendations/context")
        .set(authHeader())
        .expect(200);

      expect(response.body).toMatchObject({
        userId: ownerId,
        energyLevel: "high",
        availableMinutes: 25,
        mentalState: "review",
      });
    });
  });

  describe("POST /api/v1/recommendations/context", () => {
    test("persists the submitted context", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/recommendations/context")
        .set(authHeader())
        .send({ energyLevel: "medium", availableMinutes: 30 })
        .expect(201);

      expect(response.body).toMatchObject({
        userId: ownerId,
        energyLevel: "medium",
        availableMinutes: 30,
      });
      expect(recommendationContextRepository.contexts).toHaveLength(1);
    });

    test("returns 400 for an energyLevel outside the allowed values", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/recommendations/context")
        .set(authHeader())
        .send({ energyLevel: "extreme" })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });
});
