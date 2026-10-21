import { beforeEach, describe, expect, test } from "vitest";
import { mockCryptoService, type UUID } from "domain-lib";
import { CapabilityKey, CapabilityState, ModuleKey, OPTIONAL_MODULES } from "@user/domain";
import { mockEntitlementsProvider } from "../mocks/mock-entitlements-provider.js";
import { resolveLearnerCapabilities } from "./resolve-learner-capabilities.js";

describe("resolveLearnerCapabilities", () => {
  let entitlementsProvider: ReturnType<typeof mockEntitlementsProvider>;
  let learnerId: UUID;

  beforeEach(async () => {
    entitlementsProvider = mockEntitlementsProvider();
    learnerId = await mockCryptoService().generateUUID();
  });

  test("Should disable the modules the learner turned off", async () => {
    const capabilities = await resolveLearnerCapabilities(entitlementsProvider, {
      id: learnerId,
      enabledModules: [ModuleKey.POMODORO],
    });

    expect(capabilities[CapabilityKey.LEARNING_PATHS].state).toBe(CapabilityState.DISABLED);
    expect(capabilities[CapabilityKey.POMODORO].state).toBe(CapabilityState.ENABLED);
  });

  test("Should lock what the learner's entitlements don't grant", async () => {
    entitlementsProvider.withheld.add(CapabilityKey.RECOMMENDATION_CALIBRATION);

    const capabilities = await resolveLearnerCapabilities(entitlementsProvider, {
      id: learnerId,
      enabledModules: [...OPTIONAL_MODULES],
    });

    expect(capabilities[CapabilityKey.RECOMMENDATION_CALIBRATION].state).toBe(
      CapabilityState.LOCKED,
    );
  });

  test("Should treat every learner as outside the beta channel until the opt-in is stored", async () => {
    const capabilities = await resolveLearnerCapabilities(entitlementsProvider, {
      id: learnerId,
      enabledModules: [...OPTIONAL_MODULES],
    });

    expect(capabilities[CapabilityKey.BETA_CHANNEL].state).toBe(CapabilityState.DISABLED);
  });
});
