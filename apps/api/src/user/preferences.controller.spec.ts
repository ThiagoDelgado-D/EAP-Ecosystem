import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  CAPABILITY_CATALOG,
  CapabilityKey,
  CapabilityState,
  DEFAULT_APPEARANCE,
  DEFAULT_ENABLED_MODULES,
  ModuleKey,
  type User,
} from "@user/domain";
import { generateEmail } from "@user/application";
import { createUserTestApp, type UserTestApp } from "./user-module.fixture.js";

describe("PreferencesController (integration)", () => {
  let app: INestApplication;
  let userRepo: UserTestApp["userRepo"];
  let learner: User;
  let learnerToken: string;

  beforeAll(async () => {
    let cryptoService: UserTestApp["cryptoService"];
    let jwtService: UserTestApp["jwtService"];
    ({ app, userRepo, cryptoService, jwtService } = await createUserTestApp());

    learner = {
      id: await cryptoService.generateUUID(),
      email: generateEmail(),
      firstName: "Ana",
      lastName: "Learner",
      userName: null,
      enabled: true,
      onboardingCompleted: true,
      enabledModules: [ModuleKey.POMODORO],
      widgetConfig: [],
      appearance: { ...DEFAULT_APPEARANCE },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
});
