import {
  CapabilityState,
  type CapabilityKey,
  type EntitlementsProvider,
  type IUserRepository,
} from "@user/domain";
import { resolveLearnerCapabilities } from "@user/application";
import type { UUID } from "domain-lib";

export class PathStepsCapabilityAdapter {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly entitlementsProvider: EntitlementsProvider,
    private readonly pathStepsCapability: CapabilityKey,
  ) {}

  async allowsPathSteps(userId: UUID): Promise<boolean> {
    const learner = await this.userRepository.findById(userId);
    if (!learner) return false;

    const capabilities = await resolveLearnerCapabilities(this.entitlementsProvider, learner);

    return capabilities[this.pathStepsCapability].state === CapabilityState.ENABLED;
  }
}
