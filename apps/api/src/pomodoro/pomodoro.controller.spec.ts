import {
  mockLearningPathMembershipPort,
  mockNotificationPort,
  mockSessionRepository,
  MIN_SESSION_DURATION_SEC,
} from "@pomodoro/application";
import { SegmentTargetKind, DomainNotificationType } from "@pomodoro/domain";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { mockJwtService, type MockedJwtService, type UUID } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import { getRepositoryToken } from "@nestjs/typeorm";
import { SegmentEntity, SessionEntity } from "@pomodoro/infrastructure";
import { LearningPathNodeEntity } from "@learning-resource/infrastructure";
import { PomodoroModule } from "./pomodoro.module.js";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";

describe("PomodoroController (integration)", () => {
  let app: INestApplication;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let membershipPort: ReturnType<typeof mockLearningPathMembershipPort>;
  let notificationPort: ReturnType<typeof mockNotificationPort>;
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
      .overrideProvider("IPomodoroSessionRepository")
      .useValue(sessionRepository)
      .overrideProvider("ILearningPathMembershipPort")
      .useValue(membershipPort)
      .overrideProvider("INotificationPort")
      .useValue(notificationPort)
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

  afterEach(() => {
    sessionRepository.reset();
    membershipPort.reset();
    notificationPort.reset();
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
      await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(401);
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

      const segment = sessionRepository.segments.find(
        (s) => s.sessionId === startResponse.body.id,
      );
      expect(segment).toMatchObject({
        targetKind: SegmentTargetKind.NODE,
        learningPathId: pathId,
        learningPathNodeId: nodeId,
        resourceId,
      });
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

  describe("Error cases", () => {
    test("Should return 400 when plannedMin is missing on start", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ target: { kind: "free" } })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining("plannedMin")]),
      );
    });

    test("Should return 409 when starting a session while one is already active", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(409);

      expect(response.body.activeSessionId).toBeDefined();
    });

    test("Should return 409 when a resource target has more than one path membership", async () => {
      const resourceId = await cryptoService.generateUUID();
      membershipPort.memberships[resourceId] = [
        {
          pathId: await cryptoService.generateUUID(),
          pathTitle: "Backend Fundamentals",
          nodeId: await cryptoService.generateUUID(),
        },
        {
          pathId: await cryptoService.generateUUID(),
          pathTitle: "System Design Map",
          nodeId: await cryptoService.generateUUID(),
        },
      ];

      const response = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "resource", resourceId } })
        .expect(409);

      expect(response.body.candidates).toHaveLength(2);
    });

    test("Should return 403 when a different user tries to switch target", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/v1/pomodoro/sessions/${startResponse.body.id}/target`)
        .set(authHeader(intruderToken))
        .send({ target: { kind: "free" } })
        .expect(403);
    });

    test("Should return 404 when ending a session that does not exist", async () => {
      const nonExistentSessionId = await cryptoService.generateUUID();

      await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${nonExistentSessionId}/end`)
        .set(authHeader())
        .expect(404);
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

      await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${sessionId}/end`)
        .set(authHeader())
        .expect(409);
    });

    test("Should return 409 when the session has no open segment", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);
      const sessionId = startResponse.body.id;
      backdateSession(sessionId, MIN_SESSION_DURATION_SEC + 60);

      const openSegment = await sessionRepository.findOpenSegmentBySessionId(sessionId);
      await sessionRepository.updateSegment({ ...openSegment!, endSec: 120 });

      await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${sessionId}/end`)
        .set(authHeader())
        .expect(409);
    });

    test("Should discard a session shorter than the minimum duration, without notifying", async () => {
      const startResponse = await request(app.getHttpServer())
        .post("/api/v1/pomodoro/sessions")
        .set(authHeader())
        .send({ plannedMin: 25, target: { kind: "free" } })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pomodoro/sessions/${startResponse.body.id}/end`)
        .set(authHeader())
        .expect(201);

      expect(response.body).toEqual({ discarded: true });
      expect(notificationPort.notifications).toHaveLength(0);
    });
  });
});
