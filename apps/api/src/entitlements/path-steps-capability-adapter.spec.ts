import {
  generateUser,
  mockEntitlementsProvider,
  mockUserRepository,
} from "@user/application";
import { CapabilityKey, ModuleKey, type User } from "@user/domain";
import { CryptoServiceImpl } from "infrastructure-lib";
import { CapabilityRecommendationSourcesAdapter } from "./capability-recommendation-sources-adapter.js";

describe("CapabilityRecommendationSourcesAdapter", () => {
  const cryptoService = new CryptoServiceImpl();
  let userRepository: ReturnType<typeof mockUserRepository>;
  let entitlementsProvider: ReturnType<typeof mockEntitlementsProvider>;
  let adapter: CapabilityRecommendationSourcesAdapter;

  const saveLearnerWithModules = async (enabledModules: ModuleKey[]): Promise<User> => {
    const learner = generateUser({ enabledModules });
    await userRepository.save(learner);
    return learner;
  };

  beforeEach(() => {
    userRepository = mockUserRepository();
    entitlementsProvider = mockEntitlementsProvider();
    adapter = new CapabilityRecommendationSourcesAdapter(userRepository, entitlementsProvider);
  });

  test("Should allow path steps for a learner with Learning Paths and Recommendations on", async () => {
    const learner = await saveLearnerWithModules([
      ModuleKey.LEARNING_PATHS,
      ModuleKey.RECOMMENDATION,
    ]);

    expect(await adapter.allowsPathSteps(learner.id)).toBe(true);
  });

  test("Should not allow path steps for a learner who turned Learning Paths off", async () => {
    const learner = await saveLearnerWithModules([ModuleKey.RECOMMENDATION]);

    expect(await adapter.allowsPathSteps(learner.id)).toBe(false);
  });

  test("Should not allow path steps when the learner's plan doesn't grant them", async () => {
    const learner = await saveLearnerWithModules([
      ModuleKey.LEARNING_PATHS,
      ModuleKey.RECOMMENDATION,
    ]);
    entitlementsProvider.withheld.add(CapabilityKey.RECOMMENDATION_PATH_STEPS);

    expect(await adapter.allowsPathSteps(learner.id)).toBe(false);
  });

  test("Should not allow path steps for a learner that doesn't exist", async () => {
    const unknownLearnerId = await cryptoService.generateUUID();

    expect(await adapter.allowsPathSteps(unknownLearnerId)).toBe(false);
  });
});
