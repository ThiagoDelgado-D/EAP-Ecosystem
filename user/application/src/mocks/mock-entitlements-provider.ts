import type { UUID } from "domain-lib";
import { CAPABILITY_CATALOG, type CapabilityKey, type EntitlementsProvider } from "@user/domain";

export interface MockedEntitlementsProvider extends EntitlementsProvider {
  withheld: Set<CapabilityKey>;
}

export function mockEntitlementsProvider(): MockedEntitlementsProvider {
  const withheld = new Set<CapabilityKey>();

  return {
    withheld,

    grantedTo(_userId: UUID): Promise<ReadonlySet<CapabilityKey>> {
      return Promise.resolve(
        new Set(CAPABILITY_CATALOG.map(({ key }) => key).filter((key) => !withheld.has(key))),
      );
    },
  };
}
