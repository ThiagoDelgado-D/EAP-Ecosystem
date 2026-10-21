import { describe, expect, test } from "vitest";
import {
  CapabilityKey,
  CapabilityStage,
  CapabilityState,
  type CapabilityDefinition,
  type CapabilityPreferences,
} from "../entities/capability.js";
import { CAPABILITY_CATALOG } from "../entities/capability-catalog.js";
import { ModuleKey, OPTIONAL_MODULES } from "../entities/module.js";
import { resolveCapabilities } from "./resolve-capabilities.js";

const EVERY_CAPABILITY: ReadonlySet<CapabilityKey> = new Set(
  CAPABILITY_CATALOG.map((definition) => definition.key),
);

const grantedExcept = (...withheld: CapabilityKey[]): ReadonlySet<CapabilityKey> =>
  new Set([...EVERY_CAPABILITY].filter((key) => !withheld.includes(key)));

const EVERY_MODULE_ON: CapabilityPreferences = {
  enabledModules: OPTIONAL_MODULES,
  joinedBetaChannel: false,
};

const modulesOn = (...enabledModules: ModuleKey[]): CapabilityPreferences => ({
  enabledModules,
  joinedBetaChannel: false,
});

const BETA_CAPABILITY = CapabilityKey.POMODORO_WEEKLY_SUMMARY;

const CATALOG_WITH_A_BETA: readonly CapabilityDefinition[] = CAPABILITY_CATALOG.map(
  (definition) => ({
    key: definition.key,
    parent: definition.parent,
    requires: definition.requires,
    stage: definition.key === BETA_CAPABILITY ? CapabilityStage.BETA : definition.stage,
  }),
);

describe("resolveCapabilities", () => {
  test("Should resolve every capability in the catalog with its stage", () => {
    const capabilities = resolveCapabilities(CAPABILITY_CATALOG, EVERY_CAPABILITY, EVERY_MODULE_ON);

    for (const definition of CAPABILITY_CATALOG) {
      expect(capabilities[definition.key].stage).toBe(definition.stage);
    }
  });

  test("Should enable every stable capability when everything is granted and every module is on", () => {
    const capabilities = resolveCapabilities(CAPABILITY_CATALOG, EVERY_CAPABILITY, EVERY_MODULE_ON);

    for (const definition of CAPABILITY_CATALOG) {
      if (definition.key === CapabilityKey.BETA_CHANNEL) continue;

      expect(capabilities[definition.key].state).toBe(CapabilityState.ENABLED);
    }
  });

  test("Should keep the resource library enabled even with every optional module off", () => {
    const capabilities = resolveCapabilities(CAPABILITY_CATALOG, EVERY_CAPABILITY, modulesOn());

    expect(capabilities[CapabilityKey.RESOURCE_LIBRARY].state).toBe(CapabilityState.ENABLED);
    expect(capabilities[CapabilityKey.RESOURCE_LIBRARY_URL_IMPORT].state).toBe(
      CapabilityState.ENABLED,
    );
  });

  test("Should disable a module the learner turned off, along with its capabilities", () => {
    const capabilities = resolveCapabilities(
      CAPABILITY_CATALOG,
      EVERY_CAPABILITY,
      modulesOn(ModuleKey.LEARNING_PATHS, ModuleKey.RECOMMENDATION),
    );

    expect(capabilities[CapabilityKey.POMODORO].state).toBe(CapabilityState.DISABLED);
    expect(capabilities[CapabilityKey.POMODORO_BREAKS].state).toBe(CapabilityState.DISABLED);
    expect(capabilities[CapabilityKey.POMODORO_PATH_FOCUS].state).toBe(CapabilityState.DISABLED);
  });

  test("Should disable only the bridges into a provider module the learner turned off", () => {
    const capabilities = resolveCapabilities(
      CAPABILITY_CATALOG,
      EVERY_CAPABILITY,
      modulesOn(ModuleKey.POMODORO, ModuleKey.RECOMMENDATION),
    );

    expect(capabilities[CapabilityKey.POMODORO_PATH_FOCUS].state).toBe(CapabilityState.DISABLED);
    expect(capabilities[CapabilityKey.RECOMMENDATION_PATH_STEPS].state).toBe(
      CapabilityState.DISABLED,
    );
    expect(capabilities[CapabilityKey.POMODORO].state).toBe(CapabilityState.ENABLED);
    expect(capabilities[CapabilityKey.POMODORO_BREAKS].state).toBe(CapabilityState.ENABLED);
    expect(capabilities[CapabilityKey.RECOMMENDATION].state).toBe(CapabilityState.ENABLED);
  });

  test("Should lock a capability the learner's entitlements don't include", () => {
    const capabilities = resolveCapabilities(
      CAPABILITY_CATALOG,
      grantedExcept(CapabilityKey.LEARNING_PATHS_GRAPH),
      EVERY_MODULE_ON,
    );

    expect(capabilities[CapabilityKey.LEARNING_PATHS_GRAPH].state).toBe(CapabilityState.LOCKED);
    expect(capabilities[CapabilityKey.LEARNING_PATHS].state).toBe(CapabilityState.ENABLED);
  });

  test("Should lock every capability under a module that isn't granted", () => {
    const capabilities = resolveCapabilities(
      CAPABILITY_CATALOG,
      grantedExcept(CapabilityKey.RECOMMENDATION),
      EVERY_MODULE_ON,
    );

    expect(capabilities[CapabilityKey.RECOMMENDATION].state).toBe(CapabilityState.LOCKED);
    expect(capabilities[CapabilityKey.RECOMMENDATION_CALIBRATION].state).toBe(
      CapabilityState.LOCKED,
    );
    expect(capabilities[CapabilityKey.POMODORO_SUGGESTION].state).toBe(CapabilityState.LOCKED);
  });

  test("Should show a locked module as locked even after the learner turned it off", () => {
    const capabilities = resolveCapabilities(
      CAPABILITY_CATALOG,
      grantedExcept(CapabilityKey.LEARNING_PATHS),
      modulesOn(ModuleKey.POMODORO, ModuleKey.RECOMMENDATION),
    );

    expect(capabilities[CapabilityKey.LEARNING_PATHS].state).toBe(CapabilityState.LOCKED);
    expect(capabilities[CapabilityKey.POMODORO_PATH_FOCUS].state).toBe(CapabilityState.LOCKED);
  });

  test("Should hide a locked bridge when its own module is turned off", () => {
    const capabilities = resolveCapabilities(
      CAPABILITY_CATALOG,
      grantedExcept(CapabilityKey.LEARNING_PATHS),
      modulesOn(ModuleKey.RECOMMENDATION),
    );

    expect(capabilities[CapabilityKey.POMODORO_PATH_FOCUS].state).toBe(CapabilityState.DISABLED);
  });

  test("Should leave the beta channel disabled for a learner who hasn't joined", () => {
    const capabilities = resolveCapabilities(CAPABILITY_CATALOG, EVERY_CAPABILITY, EVERY_MODULE_ON);

    expect(capabilities[CapabilityKey.BETA_CHANNEL].state).toBe(CapabilityState.DISABLED);
  });

  test("Should hide a beta capability from a learner who hasn't joined the beta channel", () => {
    const capabilities = resolveCapabilities(CATALOG_WITH_A_BETA, EVERY_CAPABILITY, EVERY_MODULE_ON);

    expect(capabilities[BETA_CAPABILITY].state).toBe(CapabilityState.DISABLED);
    expect(capabilities[BETA_CAPABILITY].stage).toBe(CapabilityStage.BETA);
  });

  test("Should enable a beta capability for a learner who joined the beta channel", () => {
    const capabilities = resolveCapabilities(CATALOG_WITH_A_BETA, EVERY_CAPABILITY, {
      enabledModules: OPTIONAL_MODULES,
      joinedBetaChannel: true,
    });

    expect(capabilities[CapabilityKey.BETA_CHANNEL].state).toBe(CapabilityState.ENABLED);
    expect(capabilities[BETA_CAPABILITY].state).toBe(CapabilityState.ENABLED);
  });

  test("Should lock a beta capability when the learner isn't allowed into the beta channel", () => {
    const capabilities = resolveCapabilities(
      CATALOG_WITH_A_BETA,
      grantedExcept(CapabilityKey.BETA_CHANNEL),
      EVERY_MODULE_ON,
    );

    expect(capabilities[CapabilityKey.BETA_CHANNEL].state).toBe(CapabilityState.LOCKED);
    expect(capabilities[BETA_CAPABILITY].state).toBe(CapabilityState.LOCKED);
  });
});
