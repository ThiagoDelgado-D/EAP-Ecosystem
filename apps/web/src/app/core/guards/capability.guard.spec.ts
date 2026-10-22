import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import {
  capabilitiesEnabling,
  capabilitiesIn,
} from '@features/auth/application/mocks/capabilities.fixture';
import {
  CAPABILITY_KEY,
  CAPABILITY_STATE,
  type Capabilities,
} from '@features/auth/domain/auth.model';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import { capabilityGuard } from './capability.guard';

const DASHBOARD_URL = '/dashboard';
const LOCKED_LEARNING_PATHS = capabilitiesIn(CAPABILITY_STATE.LOCKED, [
  CAPABILITY_KEY.LEARNING_PATHS,
]);

function signInWith(capabilities: Capabilities) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  TestBed.inject(AuthStore).currentUser.set({ ...learner('Ada'), capabilities });
}

function runLearningPathsGuard() {
  return TestBed.runInInjectionContext(() =>
    capabilityGuard(CAPABILITY_KEY.LEARNING_PATHS)({} as never, {} as never),
  );
}

function expectRedirectToDashboard(result: ReturnType<typeof runLearningPathsGuard>) {
  expect(result).toBeInstanceOf(UrlTree);
  expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(DASHBOARD_URL);
}

describe('capabilityGuard', () => {
  test('should let the learner in when the capability is enabled', () => {
    signInWith(capabilitiesEnabling([CAPABILITY_KEY.LEARNING_PATHS]));

    expect(runLearningPathsGuard()).toBe(true);
  });

  test('should send the learner to the dashboard when the capability is turned off', () => {
    signInWith(capabilitiesEnabling([CAPABILITY_KEY.POMODORO]));

    expectRedirectToDashboard(runLearningPathsGuard());
  });

  test('should send the learner to the dashboard when the capability is locked', () => {
    signInWith(LOCKED_LEARNING_PATHS);

    expectRedirectToDashboard(runLearningPathsGuard());
  });
});
