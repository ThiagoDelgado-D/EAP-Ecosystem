import { TestBed } from '@angular/core/testing';
import { AuthStore } from '@features/auth/application/auth.store';
import type { CapabilityKey } from '@features/auth/domain/auth.model';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { capabilitiesEnabling } from './capabilities.fixture';

export function signInLearnerWith(enabledCapabilities: readonly CapabilityKey[]): void {
  const authStore = TestBed.inject(AuthStore);
  authStore.currentUser.set(learner('Ada'));
  authStore.updateModulePreferences({
    enabledModules: [],
    capabilities: capabilitiesEnabling(enabledCapabilities),
  });
}
