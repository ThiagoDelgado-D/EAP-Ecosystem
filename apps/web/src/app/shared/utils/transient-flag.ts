import { signal, type Signal } from '@angular/core';

export interface TransientFlag {
  readonly active: Signal<boolean>;
  trigger(): void;
}

export function createTransientFlag(durationMs = 900): TransientFlag {
  const active = signal(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    active,
    trigger(): void {
      if (timeoutId !== null) clearTimeout(timeoutId);
      active.set(true);
      timeoutId = setTimeout(() => active.set(false), durationMs);
    },
  };
}
