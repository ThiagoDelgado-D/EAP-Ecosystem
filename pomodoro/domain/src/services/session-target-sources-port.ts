import type { UUID } from "domain-lib";

export interface SessionTargetSourcesPort {
  allowsPathSteps(userId: UUID): Promise<boolean>;
}
