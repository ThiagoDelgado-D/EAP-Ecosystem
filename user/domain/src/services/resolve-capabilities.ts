import {
  CapabilityKey,
  CapabilityStage,
  CapabilityState,
  type Capabilities,
  type CapabilityDefinition,
  type CapabilityPreferences,
} from "../entities/capability.js";
import { isOptionalModule } from "../entities/module.js";

const STATE_SEVERITY: Record<CapabilityState, number> = {
  [CapabilityState.ENABLED]: 0,
  [CapabilityState.DISABLED]: 1,
  [CapabilityState.LOCKED]: 2,
};

const worstOf = (states: CapabilityState[]): CapabilityState =>
  states.reduce(
    (worst, state) => (STATE_SEVERITY[state] > STATE_SEVERITY[worst] ? state : worst),
    CapabilityState.ENABLED,
  );

const isTurnedOff = (
  key: CapabilityKey,
  preferences: CapabilityPreferences,
): boolean => {
  if (key === CapabilityKey.BETA_CHANNEL) return !preferences.joinedBetaChannel;
  if (!isOptionalModule(key)) return false;

  return !preferences.enabledModules.includes(key);
};

const requirementsOf = (definition: CapabilityDefinition): CapabilityKey[] => {
  if (definition.stage === CapabilityStage.BETA) {
    return [...definition.requires, CapabilityKey.BETA_CHANNEL];
  }

  return [...definition.requires];
};

export const resolveCapabilities = (
  catalog: readonly CapabilityDefinition[],
  granted: ReadonlySet<CapabilityKey>,
  preferences: CapabilityPreferences,
): Capabilities => {
  const definitions = new Map(catalog.map((definition) => [definition.key, definition]));
  const resolved = new Map<CapabilityKey, CapabilityState>();

  const stateOf = (key: CapabilityKey): CapabilityState => {
    const known = resolved.get(key);
    if (known) return known;

    const definition = definitions.get(key);
    if (!definition) return CapabilityState.LOCKED;

    const state = resolveDefinition(definition);
    resolved.set(key, state);
    return state;
  };

  const resolveDefinition = (definition: CapabilityDefinition): CapabilityState => {
    if (definition.parent) {
      const parentState = stateOf(definition.parent);
      if (parentState !== CapabilityState.ENABLED) return parentState;
    }

    if (!granted.has(definition.key)) return CapabilityState.LOCKED;

    const requiredState = worstOf(requirementsOf(definition).map(stateOf));
    if (requiredState !== CapabilityState.ENABLED) return requiredState;

    if (isTurnedOff(definition.key, preferences)) return CapabilityState.DISABLED;

    return CapabilityState.ENABLED;
  };

  const capabilities = {} as Capabilities;
  for (const definition of catalog) {
    capabilities[definition.key] = {
      state: stateOf(definition.key),
      stage: definition.stage,
    };
  }

  return capabilities;
};
