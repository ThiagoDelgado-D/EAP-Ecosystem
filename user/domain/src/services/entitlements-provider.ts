import type { UUID } from "domain-lib";
import type { CapabilityKey } from "../entities/capability.js";

export interface EntitlementsProvider {
  grantedTo(userId: UUID): Promise<ReadonlySet<CapabilityKey>>;
}
