import type { RecommendationSourcesPort } from "@recommendation/domain";
import {
  CapabilityKey,
  CapabilityState,
  type EntitlementsProvider,
  type IUserRepository,
} from "@user/domain";
import { resolveLearnerCapabilities } from "@user/application";
import type { UUID } from "domain-lib";

export class CapabilityRecommendationSourcesAdapter implements RecommendationSourcesPort {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly entitlementsProvider: EntitlementsProvider,
  ) {}

  async allowsPathSteps(userId: UUID): Promise<boolean> {
    const learner = await this.userRepository.findById(userId);
    if (!learner) return false;

    const capabilities = await resolveLearnerCapabilities(this.entitlementsProvider, learner);

    return (
      capabilities[CapabilityKey.RECOMMENDATION_PATH_STEPS].state === CapabilityState.ENABLED
    );
  }
}
