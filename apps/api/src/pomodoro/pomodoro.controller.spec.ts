import {
  mockCandidateNodesPort,
  mockLearningPathMembershipPort,
  mockNotificationPort,
  mockSessionRepository,
  MIN_SESSION_DURATION_SEC,
} from "@pomodoro/application";
import {
  CandidateNodeEnergyLevel,
  CandidateNodeProgress,
  SegmentTargetKind,
  DomainNotificationType,
} from "@pomodoro/domain";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { mockJwtService, type MockedJwtService, type UUID } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import { getRepositoryToken } from "@nestjs/typeorm";
import { SegmentEntity, SessionEntity } from "@pomodoro/infrastructure";
import {
  LearningPathEdgeEntity,
  LearningPathEntity,
  LearningPathNodeEntity,
  LearningResourceEntity,
} from "@learning-resource/infrastructure";
import { PomodoroModule } from "./pomodoro.module.js";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";

describe("PomodoroController (integration)", () => {
  let app: INestApplication;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let membershipPort: ReturnType<typeof mockLearningPathMembershipPort>;
  let notificationPort: ReturnType<typeof mockNotificationPort>;
  let candidateNodesPort: ReturnType<typeof mockCandidateNodesPort>;
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

    sessionRepository = mockSessionRepository();
    membershipPort = mockLearningPathMembershipPort();
    notificationPort = mockNotificationPort();
    candidateNodesPort = mockCandidateNodesPort();
    jwtService = mockJwtService();

    const module = await Test.createTestingModule({
      imports: [PomodoroModule],
    })
      .overrideProvider(getRepositoryToken(SessionEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(SegmentEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningPathNodeEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningPathEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningPathEdgeEntity))
      .useValue({})
      .overrideProvider(getRepositoryToken(LearningResourceEntity))
      .useValue({})
      .overrideProvider("IPomodoroSessionRepository")
      .useValue(sessionRepository)
      .overrideProvider("ILearningPathMembershipPort")
      .useValue(membershipPort)
      .overrideProvider("INotificationPort")
      .useValue(notificationPort)
      .overrideProvider("ICandidateNodesPort")
      .useValue(candidateNodesPort)
      .overrideProvider("ICryptoService")
      .useValue(cryptoService)
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

  afterEach(() => {
    sessionRepository.reset();
    membershipPort.reset();
    notificationPort.reset();
    candidateNodesPort.reset();
  });

  const authHeader = (bearerToken: string = ownerToken) => ({
    Authorization: `Bearer ${bearerToken}`,
  });

  const backdateSession = (sessionId: UUID, secondsAgo: number) => {
    const stored = sessionRepository.sessions.find((s) => s.id === sessionId)!;
    stored.startedAt = new Date(Date.now() - secondsAgo * 1000);
  };

  describe("Unauthenticated access", () => {
    test("Should return 401 without a bearer token", async () => {
      const unauthenticatedResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(401);

      expect(unauthenticatedResponse.body.message).toBe("Unauthorized");
    });
  });

  describe("Full session lifecycle", () => {
    test("starts a session, switches target, and ends it with a completion notification", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({
          plannedMin: 25,
          intent: "Deep work on the graph canvas",
          target: { kind: "free" },
        })
        .expect(201);

      const sessionId = startResponse.body.id;
      expect(startResponse.body.plannedMin).toBe(25);
      expect(startResponse.body.completedAt).toBeUndefined();

      backdateSession(sessionId, MIN_SESSION_DURATION_SEC + 60);

      const resourceId = await cryptoService.generateUUID();
      const switchResponse = await request(app.getHttpServer())
        .patch(`/api/v1/pomodoro/sessions/${sessionId}/target`)
        .set(authHeader())
        .send({ target: { kind: "resource", resourceId } })
        .expect(200);

      expect(switchResponse.body.closedSegment.endSec).toBeDefined();
      expect(switchResponse.body.openedSegment).toMatchObject({
        targetKind: "resource",
        resourceId,
      });

      const endResponse = await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${sessionId}/end`)
        .set(authHeader())
        .expect(201);

      expect(endResponse.body.discarded).toBe(false);
      expect(endResponse.body.session.completedAt).toBeDefined();
      expect(endResponse.body.segments).toHaveLength(2);

      expect(notificationPort.notifications).toHaveLength(1);
      expect(notificationPort.notifications[0]!.type).toBe(
        DomainNotificationType.SESSION_COMPLETED,
      );
    });

    test("resolves a resource target to its owning node when exactly one path membership exists", async () => {
      const resourceId = await cryptoService.generateUUID();
      const pathId = await cryptoService.generateUUID();
      const nodeId = await cryptoService.generateUUID();
      membershipPort.memberships[resourceId] = [
        { pathId, pathTitle: "Backend Fundamentals", nodeId },
      ];

      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "resource", resourceId } })
        .expect(201);

      const resolvedSegment = sessionRepository.segments.find(
        (s) => s.sessionId === startResponse.body.id,
      );
      expect(resolvedSegment).toMatchObject({
        targetKind: SegmentTargetKind.NODE,
        learningPathId: pathId,
        learningPathNodeId: nodeId,
        resourceId,
      });
    });

    test("starts directly on a node target and ends with a single segment", async () => {
      const pathId = await cryptoService.generateUUID();
      const nodeId = await cryptoService.generateUUID();
      const resourceId = await cryptoService.generateUUID();

      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({
          plannedMin: 45,
          target: {
            kind: "node",
            learningPathId: pathId,
            learningPathNodeId: nodeId,
            resourceId,
          },
        })
        .expect(201);
      const sessionId = startResponse.body.id;
      backdateSession(sessionId, MIN_SESSION_DURATION_SEC + 30);

      const endResponse = await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${sessionId}/end`)
        .set(authHeader())
        .expect(201);

      expect(endResponse.body.segments).toHaveLength(1);
      expect(endResponse.body.segments[0]).toMatchObject({
        targetKind: "node",
        learningPathId: pathId,
        learningPathNodeId: nodeId,
        startSec: 0,
      });
      expect(endResponse.body.segments[0].endSec).toBeDefined();
    });

    test("switches target on a stub node (no linked resource yet)", async () => {
      const pathId = await cryptoService.generateUUID();
      const stubNodeId = await cryptoService.generateUUID();

      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);
      backdateSession(startResponse.body.id, 30);

      const switchResponse = await request(app.getHttpServer())
        .patch(`/api/v1/pomodoro/sessions/${startResponse.body.id}/target`)
        .set(authHeader())
        .send({
          target: {
            kind: "node",
            learningPathId: pathId,
            learningPathNodeId: stubNodeId,
          },
        })
        .expect(200);

      expect(switchResponse.body.openedSegment).toMatchObject({
        targetKind: "node",
        learningPathId: pathId,
        learningPathNodeId: stubNodeId,
      });
      expect(switchResponse.body.openedSegment.resourceId).toBeUndefined();
    });

    test("keeps a resource target as-is when it belongs to no path", async () => {
      const resourceId = await cryptoService.generateUUID();

      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "resource", resourceId } })
        .expect(201);

      const unresolvedSegment = sessionRepository.segments.find(
        (s) => s.sessionId === startResponse.body.id,
      );

      expect(unresolvedSegment).toMatchObject({
        targetKind: SegmentTargetKind.RESOURCE,
        resourceId,
      });
    });

    test("chains three targets in one session before ending it", async () => {
      const resourceId = await cryptoService.generateUUID();
      const pathId = await cryptoService.generateUUID();
      const nodeId = await cryptoService.generateUUID();

      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 50, target: { kind: "free" } })
        .expect(201);
      const sessionId = startResponse.body.id;
      backdateSession(sessionId, MIN_SESSION_DURATION_SEC * 3);

      await request(app.getHttpServer())
        .patch(`/api/v1/pomodoro/sessions/${sessionId}/target`)
        .set(authHeader())
        .send({ target: { kind: "resource", resourceId } })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/pomodoro/sessions/${sessionId}/target`)
        .set(authHeader())
        .send({
          target: {
            kind: "node",
            learningPathId: pathId,
            learningPathNodeId: nodeId,
          },
        })
        .expect(200);

      const endResponse = await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${sessionId}/end`)
        .set(authHeader())
        .expect(201);

      expect(endResponse.body.segments).toHaveLength(3);

      const [freeSegment, resourceSegment, nodeSegment] =
        endResponse.body.segments;

      expect(freeSegment).toMatchObject({ targetKind: "free", startSec: 0 });
      expect(resourceSegment).toMatchObject({
        targetKind: "resource",
        resourceId,
      });

      expect(nodeSegment).toMatchObject({
        targetKind: "node",
        learningPathId: pathId,
        learningPathNodeId: nodeId,
      });

      expect(resourceSegment.startSec).toBe(freeSegment.endSec);
      expect(nodeSegment.startSec).toBe(resourceSegment.endSec);
      expect(nodeSegment.endSec).toBeDefined();
    });

    test("allows starting a new session right after the previous one ends", async () => {
      const firstStart = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);
      backdateSession(firstStart.body.id, MIN_SESSION_DURATION_SEC + 5);

      await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${firstStart.body.id}/end`)
        .set(authHeader())
        .expect(201);

      const secondStart = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 15, target: { kind: "free" } })
        .expect(201);

      expect(secondStart.body.id).not.toBe(firstStart.body.id);
      expect(sessionRepository.sessions).toHaveLength(2);
    });
  });

  describe("Active session", () => {
    test("returns null when the user has no active session", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/pomodoro/sessions/active")
        .set(authHeader())
        .expect(200);

      expect(response.body).toEqual({});
    });

    test("returns the active session with its segments", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, intent: "Rehydrate me", target: { kind: "free" } })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get("/api/v1/pomodoro/sessions/active")
        .set(authHeader())
        .expect(200);

      expect(response.body.session.id).toBe(startResponse.body.id);
      expect(response.body.session.intent).toBe("Rehydrate me");
      expect(response.body.segments).toHaveLength(1);
      expect(response.body.segments[0]).toMatchObject({ targetKind: "free", startSec: 0 });
    });

    test("does not return another user's active session", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get("/api/v1/pomodoro/sessions/active")
        .set(authHeader(intruderToken))
        .expect(200);

      expect(response.body).toEqual({});
    });
  });

  describe("Breaks", () => {
    test("fires a break-started notification", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/pomodoro/breaks")
        .set(authHeader())
        .expect(200);

      expect(notificationPort.notifications).toHaveLength(1);
      expect(notificationPort.notifications[0]!.type).toBe(
        DomainNotificationType.BREAK_STARTED,
      );
    });
  });

  describe("Suggestion", () => {
    test("ranks an in-progress node above a pending one", async () => {
      const pathId = await cryptoService.generateUUID();
      const inProgressNodeId = await cryptoService.generateUUID();
      const pendingNodeId = await cryptoService.generateUUID();
      candidateNodesPort.nodesByUser[ownerId] = [
        {
          pathId,
          pathTitle: "Frontend Architecture Mastery",
          nodeId: pendingNodeId,
          nodeTitle: "Signals Deep Dive",
          progress: CandidateNodeProgress.PENDING,
          prerequisitesDone: true,
        },
        {
          pathId,
          pathTitle: "Frontend Architecture Mastery",
          nodeId: inProgressNodeId,
          nodeTitle: "Angular Official Docs",
          progress: CandidateNodeProgress.IN_PROGRESS,
          prerequisitesDone: true,
        },
      ];

      const response = await request(app.getHttpServer())
        .get("/api/v1/pomodoro/suggestion")
        .set(authHeader())
        .expect(200);

      expect(response.body[0].nodeId).toBe(inProgressNodeId);
      expect(response.body[0].why).toContain("already open");
    });

    test("excludes a node that is already done", async () => {
      candidateNodesPort.nodesByUser[ownerId] = [
        {
          pathId: await cryptoService.generateUUID(),
          pathTitle: "TypeScript, Step by Step",
          nodeId: await cryptoService.generateUUID(),
          nodeTitle: "TypeScript Handbook",
          progress: CandidateNodeProgress.DONE,
          prerequisitesDone: true,
        },
      ];

      const response = await request(app.getHttpServer())
        .get("/api/v1/pomodoro/suggestion")
        .set(authHeader())
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test("forwards the energy query through to the response", async () => {
      const matchingNodeId = await cryptoService.generateUUID();
      candidateNodesPort.nodesByUser[ownerId] = [
        {
          pathId: await cryptoService.generateUUID(),
          pathTitle: "System Design Prep",
          nodeId: matchingNodeId,
          nodeTitle: "CAP Theorem",
          progress: CandidateNodeProgress.PENDING,
          prerequisitesDone: true,
          resourceId: await cryptoService.generateUUID(),
          resourceEnergyLevel: CandidateNodeEnergyLevel.HIGH,
        },
      ];

      const response = await request(app.getHttpServer())
        .get("/api/v1/pomodoro/suggestion")
        .query({ energy: CandidateNodeEnergyLevel.HIGH })
        .set(authHeader())
        .expect(200);

      expect(response.body[0].nodeId).toBe(matchingNodeId);
      expect(response.body[0].why).toContain("fits high energy");
    });

    test("Should return 400 when energy is not a known level", async () => {
      const invalidEnergyResponse = await request(app.getHttpServer())
        .get("/api/v1/pomodoro/suggestion")
        .query({ energy: "extreme" })
        .set(authHeader())
        .expect(400);

      expect(invalidEnergyResponse.body.energy).toContain("Energy");
    });
  });

  describe("Error cases", () => {
    test("Should return 400 when plannedMin is missing on start", async () => {
      const missingPlannedMinResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ target: { kind: "free" } })
        .expect(400);

      expect(missingPlannedMinResponse.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("plannedMin")]),
      );
    });

    test("Should return 409 when starting a session while one is already active", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);

      const duplicateStartResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(409);

      expect(duplicateStartResponse.body.activeSessionId).toBeDefined();
    });

    test("Should return 409 when a resource target has more than one path membership", async () => {
      const resourceId = await cryptoService.generateUUID();
      membershipPort.memberships[resourceId] = [
        {
          pathId: await cryptoService.generateUUID(),
          pathTitle: "Kubernetes Internals",
          nodeId: await cryptoService.generateUUID(),
        },
        {
          pathId: await cryptoService.generateUUID(),
          pathTitle: "Distributed Tracing Guide",
          nodeId: await cryptoService.generateUUID(),
        },
      ];

      const ambiguousTargetResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "resource", resourceId } })
        .expect(409);

      expect(ambiguousTargetResponse.body.candidates).toHaveLength(2);
    });

    test("Should return 403 when a different user tries to switch target", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);

      const forbiddenSwitchResponse = await request(app.getHttpServer())
        .patch(`/api/v1/pomodoro/sessions/${startResponse.body.id}/target`)
        .set(authHeader(intruderToken))
        .send({ target: { kind: "free" } })
        .expect(403);

      expect(forbiddenSwitchResponse.body).toEqual({});
    });

    test("Should return 404 when ending a session that does not exist", async () => {
      const nonExistentSessionId = await cryptoService.generateUUID();

      const sessionNotFoundResponse = await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${nonExistentSessionId}/end`)
        .set(authHeader())
        .expect(404);

      expect(sessionNotFoundResponse.body).toEqual({});
    });

    test("Should return 409 when ending a session that already ended", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);
      const sessionId = startResponse.body.id;
      backdateSession(sessionId, MIN_SESSION_DURATION_SEC + 60);

      await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${sessionId}/end`)
        .set(authHeader())
        .expect(201);

      const alreadyEndedResponse = await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${sessionId}/end`)
        .set(authHeader())
        .expect(409);

      expect(alreadyEndedResponse.body.sessionId).toBe(sessionId);
    });

    test("Should return 409 when the session has no open segment", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);
      const sessionId = startResponse.body.id;
      backdateSession(sessionId, MIN_SESSION_DURATION_SEC + 60);

      const openSegment =
        await sessionRepository.findOpenSegmentBySessionId(sessionId);
      await sessionRepository.updateSegment({ ...openSegment!, endSec: 120 });

      const noOpenSegmentResponse = await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${sessionId}/end`)
        .set(authHeader())
        .expect(409);

      expect(noOpenSegmentResponse.body.sessionId).toBe(sessionId);
    });

    test("Should discard a session shorter than the minimum duration, without notifying", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);

      const discardedEndResponse = await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${startResponse.body.id}/end`)
        .set(authHeader())
        .expect(201);

      expect(discardedEndResponse.body).toEqual({ discarded: true });
      expect(notificationPort.notifications).toHaveLength(0);
    });
  });
});
