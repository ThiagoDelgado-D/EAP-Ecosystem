import {
  generateUser,
  mockEntitlementsProvider,
  mockUserRepository,
} from "@user/application";
import { CapabilityKey, ModuleKey, type User } from "@user/domain";
import { CryptoServiceImpl } from "infrastructure-lib";
import { PathStepsCapabilityAdapter } from "./path-steps-capability-adapter.js";

describe("PathStepsCapabilityAdapter", () => {
  const cryptoService = new CryptoServiceImpl();
  let userRepository: ReturnType<typeof mockUserRepository>;
  let entitlementsProvider: ReturnType<typeof mockEntitlementsProvider>;

  const saveLearnerWithModules = async (enabledModules: ModuleKey[]): Promise<User> => {
    const learner = generateUser({ enabledModules });
    await userRepository.save(learner);
    return learner;
  };

  const adapterFor = (pathStepsCapability: CapabilityKey) =>
    new PathStepsCapabilityAdapter(userRepository, entitlementsProvider, pathStepsCapability);

  beforeEach(() => {
    userRepository = mockUserRepository();
    entitlementsProvider = mockEntitlementsProvider();
  });

  describe("for recommendations", () => {
    const adapter = () => adapterFor(CapabilityKey.RECOMMENDATION_PATH_STEPS);

    test("Should allow path steps for a learner with Learning Paths and Recommendations on", async () => {
      const learner = await saveLearnerWithModules([
        ModuleKey.LEARNING_PATHS,
        ModuleKey.RECOMMENDATION,
      ]);

      expect(await adapter().allowsPathSteps(learner.id)).toBe(true);
    });

    test("Should not allow path steps for a learner who turned Learning Paths off", async () => {
      const learner = await saveLearnerWithModules([ModuleKey.RECOMMENDATION]);

      expect(await adapter().allowsPathSteps(learner.id)).toBe(false);
    });

    test("Should not allow path steps when the learner's plan doesn't grant them", async () => {
      const learner = await saveLearnerWithModules([
        ModuleKey.LEARNING_PATHS,
        ModuleKey.RECOMMENDATION,
      ]);
      entitlementsProvider.withheld.add(CapabilityKey.RECOMMENDATION_PATH_STEPS);

      expect(await adapter().allowsPathSteps(learner.id)).toBe(false);
    });

    test("Should not allow path steps for a learner that doesn't exist", async () => {
      const unknownLearnerId = await cryptoService.generateUUID();

      expect(await adapter().allowsPathSteps(unknownLearnerId)).toBe(false);
    });
  });

  describe("for Pomodoro", () => {
    const adapter = () => adapterFor(CapabilityKey.POMODORO_PATH_FOCUS);

    test("Should allow path steps for a learner with Learning Paths and Pomodoro on", async () => {
      const learner = await saveLearnerWithModules([
        ModuleKey.LEARNING_PATHS,
        ModuleKey.POMODORO,
        ModuleKey.RECOMMENDATION,
      ]);

      expect(await adapter().allowsPathSteps(learner.id)).toBe(true);
    });

    test("Should not allow path steps for a learner who turned Learning Paths off", async () => {
      const learner = await saveLearnerWithModules([ModuleKey.POMODORO]);

      expect(await adapter().allowsPathSteps(learner.id)).toBe(false);
    });

    test("Should allow path steps even with Recommendations off", async () => {
      const learner = await saveLearnerWithModules([ModuleKey.LEARNING_PATHS, ModuleKey.POMODORO]);

      expect(await adapter().allowsPathSteps(learner.id)).toBe(true);
    });
  });
});
