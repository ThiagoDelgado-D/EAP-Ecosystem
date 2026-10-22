import {
  CAPABILITY_KEY,
  CAPABILITY_STAGE,
  CAPABILITY_STATE,
  type Capabilities,
  type CapabilityKey,
  type CapabilityState,
} from '@features/auth/domain/auth.model';

export function capabilitiesIn(
  state: CapabilityState,
  keys: readonly CapabilityKey[],
): Capabilities {
  return Object.fromEntries(
    Object.values(CAPABILITY_KEY).map((key) => [
      key,
      {
        state: keys.includes(key) ? state : CAPABILITY_STATE.DISABLED,
        stage: CAPABILITY_STAGE.STABLE,
      },
    ]),
  ) as Capabilities;
}

export function capabilitiesEnabling(keys: readonly CapabilityKey[]): Capabilities {
  return capabilitiesIn(CAPABILITY_STATE.ENABLED, keys);
}
