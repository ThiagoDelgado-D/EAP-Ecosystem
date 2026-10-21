import { beforeEach, describe, expect, test } from "vitest";
import {
  CAPABILITY_CATALOG,
  CapabilityKey,
  CapabilityState,
  OPTIONAL_MODULES,
  resolveCapabilities,
} from "@user/domain";
import { mockCryptoService, type UUID } from "domain-lib";
import { ImplicitPlanEntitlementsProvider } from "./implicit-plan-entitlements-provider.js";

describe("ImplicitPlanEntitlementsProvider", () => {
  let provider: ImplicitPlanEntitlementsProvider;
  let learnerId: UUID;
  let otherLearnerId: UUID;

  beforeEach(async () => {
    const cryptoService = mockCryptoService();
    provider = new ImplicitPlanEntitlementsProvider();
    learnerId = await cryptoService.generateUUID();
    otherLearnerId = await cryptoService.generateUUID();
  });

  test("Should grant every capability in the catalog", async () => {
    const granted = await provider.grantedTo(learnerId);

    expect([...granted].sort()).toEqual(CAPABILITY_CATALOG.map(({ key }) => key).sort());
  });

  test("Should grant the same capabilities to every learner", async () => {
    const granted = await provider.grantedTo(learnerId);
    const grantedToOther = await provider.grantedTo(otherLearnerId);

    expect([...grantedToOther].sort()).toEqual([...granted].sort());
  });

  test("Should let every learner into the beta channel", async () => {
    const granted = await provider.grantedTo(learnerId);

    expect(granted.has(CapabilityKey.BETA_CHANNEL)).toBe(true);
  });

  test("Should never leave a capability locked once resolved", async () => {
    const granted = await provider.grantedTo(learnerId);

    const capabilities = resolveCapabilities(CAPABILITY_CATALOG, granted, {
      enabledModules: OPTIONAL_MODULES,
      joinedBetaChannel: true,
    });

    for (const { state } of Object.values(capabilities)) {
      expect(state).not.toBe(CapabilityState.LOCKED);
    }
  });

  test("Should not let a change to one learner's grant reach another learner's", async () => {
    const granted = await provider.grantedTo(learnerId);
    (granted as Set<CapabilityKey>).delete(CapabilityKey.POMODORO);

    const grantedToOther = await provider.grantedTo(otherLearnerId);

    expect(grantedToOther.has(CapabilityKey.POMODORO)).toBe(true);
  });
});
