import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";
import { jest } from "@jest/globals";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should be defined", () => {
    expect(controller).toBeDefined();
  });

  test("should return health status", () => {
    const result = controller.check();
    expect(result).toHaveProperty("status", "ok");
    expect(result).toHaveProperty("timestamp");
  });
});
