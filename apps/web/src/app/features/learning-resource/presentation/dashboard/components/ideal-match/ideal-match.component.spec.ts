import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { messageOf } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { AuthStore } from '@features/auth/application/auth.store';
import { capabilitiesEnabling } from '@features/auth/application/mocks/capabilities.fixture';
import { CAPABILITY_KEY, type CapabilityKey } from '@features/auth/domain/auth.model';
import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';
import { learner } from '@features/recommendation/application/mocks/learner.fixture';
import {
  pathStepRecommendation,
  resourceRecommendation,
} from '@features/recommendation/application/mocks/recommendation.fixture';
import { IdealMatchComponent } from './ideal-match.component';

const EMPTY_STATE_TEXT = 'Nothing fits this calibration yet';

function render(
  inputs: { recommendation?: ScoredRecommendation | null; secondary?: ScoredRecommendation[]; error?: string | null },
  enabledCapabilities: CapabilityKey[] = [CAPABILITY_KEY.POMODORO],
) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const authStore = TestBed.inject(AuthStore);
  authStore.currentUser.set(learner('Ada'));
  authStore.updateModulePreferences({
    enabledModules: [],
    capabilities: capabilitiesEnabling(enabledCapabilities),
  });
  const fixture = TestBed.createComponent(IdealMatchComponent);
  fixture.componentRef.setInput('recommendation', inputs.recommendation ?? null);
  fixture.componentRef.setInput('secondary', inputs.secondary ?? []);
  fixture.componentRef.setInput('error', inputs.error ?? null);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function primaryAction(element: HTMLElement): HTMLAnchorElement {
  return element.querySelector<HTMLAnchorElement>('a.btn-primary')!;
}

describe('IdealMatchComponent', () => {
  const ownershipChapter = resourceRecommendation('Ownership & Borrowing', 88);
  const lifetimesChapter = resourceRecommendation('Lifetimes in Depth', 61);
  const cleanArchitectureStep = pathStepRecommendation('Clean Architecture', 74);

  test('should show why recommendations failed instead of the empty state', () => {
    const offlineMessage = messageOf(offlineError());

    const element = render({ error: offlineMessage });

    expect(element.querySelector('[role="alert"]')?.textContent?.trim()).toBe(offlineMessage);
    expect(element.textContent).not.toContain(EMPTY_STATE_TEXT);
  });

  test('should show the empty state when nothing fits and nothing failed', () => {
    const element = render({});

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.textContent).toContain(EMPTY_STATE_TEXT);
  });

  test('should offer focusing on the top recommendation while Pomodoro is on', () => {
    const element = render({ recommendation: ownershipChapter });

    const action = primaryAction(element);

    expect(action.textContent?.trim()).toBe('Focus now');
    expect(action.getAttribute('href')).toBe(`/pomodoro?resource=${ownershipChapter.resourceId}`);
  });

  test('should open the top resource instead of focusing on it while Pomodoro is off', () => {
    const element = render({ recommendation: ownershipChapter }, []);

    const action = primaryAction(element);

    expect(action.textContent?.trim()).toBe('Open resource');
    expect(action.getAttribute('href')).toBe(`/resources/${ownershipChapter.resourceId}`);
  });

  test('should open a recommended path step inside its path while Pomodoro is off', () => {
    const element = render({ recommendation: cleanArchitectureStep }, [CAPABILITY_KEY.LEARNING_PATHS]);

    const action = primaryAction(element);

    expect(action.textContent?.trim()).toBe('Open step');
    expect(action.getAttribute('href')).toBe(
      `/paths/${cleanArchitectureStep.pathId}?node=${cleanArchitectureStep.nodeId}`,
    );
  });

  test('should open second choices instead of focusing on them while Pomodoro is off', () => {
    const element = render({ recommendation: ownershipChapter, secondary: [lifetimesChapter] }, []);

    const secondChoice = element.querySelector<HTMLAnchorElement>(`a[aria-label="Open ${lifetimesChapter.title}"]`);

    expect(secondChoice?.getAttribute('href')).toBe(`/resources/${lifetimesChapter.resourceId}`);
  });
});
