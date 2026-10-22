import {
  CAPABILITY_STAGE,
  CAPABILITY_STATE,
  type Capabilities,
  type CapabilityKey,
} from '@features/auth/domain/auth.model';

export function capabilitiesEnabling(keys: readonly CapabilityKey[]): Capabilities {
  return Object.fromEntries(
    keys.map((key) => [key, { state: CAPABILITY_STATE.ENABLED, stage: CAPABILITY_STAGE.STABLE }]),
  );
}
