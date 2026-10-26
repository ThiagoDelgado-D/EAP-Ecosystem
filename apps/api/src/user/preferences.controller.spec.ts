import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  CAPABILITY_CATALOG,
  CapabilityKey,
  CapabilityState,
  DEFAULT_ENABLED_MODULES,
  ModuleKey,
  composeSetup,
  type User,
} from "@user/domain";
import { generateIntakeAnswers, generateUser } from "@user/application";
import { createUserTestApp, type UserTestApp } from "./user-module.fixture.js";

describe("PreferencesController (integration)", () => {
  let app: INestApplication;
  let userRepo: UserTestApp["userRepo"];
  let learner: User;
  let learnerToken: string;

  beforeAll(async () => {
    let jwtService: UserTestApp["jwtService"];
    ({ app, userRepo, jwtService } = await createUserTestApp());

    learner = generateUser({ enabledModules: [ModuleKey.POMODORO] });
    learnerToken = await jwtService.sign({ sub: learner.id });
  });

  beforeEach(async () => {
    await userRepo.save({ ...learner });
  });

  afterAll(async () => await app.close());

  afterEach(() => userRepo.reset());

  const authHeader = () => ({ Authorization: `Bearer ${learnerToken}` });

  describe("GET /api/v1/preferences/modules", () => {
    test("Should return every capability in the catalog with its state and stage", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/preferences/modules")
        .set(authHeader())
        .expect(200);

      for (const definition of CAPABILITY_CATALOG) {
        expect(response.body.capabilities[definition.key]).toEqual({
          state: expect.any(String),
          stage: definition.stage,
        });
      }
    });

    test("Should resolve capabilities from the learner's stored modules", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/preferences/modules")
        .set(authHeader())
        .expect(200);

      expect(response.body.enabledModules).toEqual([ModuleKey.POMODORO]);
      expect(response.body.capabilities[CapabilityKey.POMODORO].state).toBe(
        CapabilityState.ENABLED,
      );
      expect(response.body.capabilities[CapabilityKey.POMODORO_PATH_FOCUS].state).toBe(
        CapabilityState.DISABLED,
      );
    });
  });

  describe("PATCH /api/v1/preferences/modules", () => {
    test("Should return capabilities that follow the new modules", async () => {
      const response = await request(app.getHttpServer())
        .patch("/api/v1/preferences/modules")
        .set(authHeader())
        .send({ enabledModules: [ModuleKey.LEARNING_PATHS] })
        .expect(200);

      expect(response.body.capabilities[CapabilityKey.LEARNING_PATHS].state).toBe(
        CapabilityState.ENABLED,
      );
      expect(response.body.capabilities[CapabilityKey.POMODORO].state).toBe(
        CapabilityState.DISABLED,
      );
    });
  });

  describe("POST /api/v1/preferences/reset", () => {
    test("Should return every module enabled again", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/preferences/reset")
        .set(authHeader())
        .expect(200);

      for (const module of DEFAULT_ENABLED_MODULES) {
        expect(response.body.capabilities[module].state).toBe(CapabilityState.ENABLED);
      }
    });
  });

  describe("GET /api/v1/preferences/intake", () => {
    test("Should return the learner's stored answers", async () => {
      const intake = generateIntakeAnswers();
      await userRepo.save({ ...learner, intake });

      const response = await request(app.getHttpServer())
        .get("/api/v1/preferences/intake")
        .set(authHeader())
        .expect(200);

      expect(response.body).toEqual({ intake });
    });

    test("Should return no answers when the learner skipped the intake", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/preferences/intake")
        .set(authHeader())
        .expect(200);

      expect(response.body).toEqual({ intake: null });
    });
  });

  describe("POST /api/v1/preferences/intake/preview", () => {
    test("Should return the setup composed from the answers", async () => {
      const intake = generateIntakeAnswers();

      const response = await request(app.getHttpServer())
        .post("/api/v1/preferences/intake/preview")
        .set(authHeader())
        .send(intake)
        .expect(200);

      expect(response.body).toEqual(composeSetup(intake));
    });

    test("Should not change the learner's stored setup", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/preferences/intake/preview")
        .set(authHeader())
        .send(generateIntakeAnswers())
        .expect(200);

      const stored = await userRepo.findById(learner.id);
      expect(stored!.enabledModules).toEqual(learner.enabledModules);
      expect(stored!.intake).toEqual(learner.intake);
    });

    test("Should reject answers without any goal", async () => {
      const { studyStyle } = generateIntakeAnswers();

      await request(app.getHttpServer())
        .post("/api/v1/preferences/intake/preview")
        .set(authHeader())
        .send({ goals: [], studyStyle })
        .expect(400);
    });

    test("Should reject a goal the intake doesn't offer", async () => {
      const { studyStyle } = generateIntakeAnswers();
      const unknownGoal = ModuleKey.POMODORO;

      await request(app.getHttpServer())
        .post("/api/v1/preferences/intake/preview")
        .set(authHeader())
        .send({ goals: [unknownGoal], studyStyle })
        .expect(400);
    });
  });
});
