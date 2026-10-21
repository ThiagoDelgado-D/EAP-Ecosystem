import {
  CAPABILITY_CATALOG,
  type CapabilityKey,
  type EntitlementsProvider,
} from "@user/domain";
import type { UUID } from "domain-lib";

const EVERY_CAPABILITY: ReadonlySet<CapabilityKey> = new Set(
  CAPABILITY_CATALOG.map((definition) => definition.key),
);

export class ImplicitPlanEntitlementsProvider implements EntitlementsProvider {
  grantedTo(_userId: UUID): Promise<ReadonlySet<CapabilityKey>> {
    return Promise.resolve(new Set(EVERY_CAPABILITY));
  }
}
