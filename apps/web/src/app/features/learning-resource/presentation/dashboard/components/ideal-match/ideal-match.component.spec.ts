import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { messageOf } from '@core/errors/error-messages';
import { offlineError } from '@core/errors/mocks/offline-error.fixture';
import { signInLearnerWith } from '@features/auth/application/mocks/signed-in-learner';
import { CAPABILITY_KEY, type CapabilityKey } from '@features/auth/domain/auth.model';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { learningResourceFixture } from '@features/pomodoro/presentation/start/recommended-entry.fixtures';
import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';
import {
  pathStepRecommendation,
  resourceRecommendation,
} from '@features/recommendation/application/mocks/recommendation.fixture';
import { IdealMatchComponent } from './ideal-match.component';

const EMPTY_STATE_TEXT = 'Nothing fits this calibration yet';

function render(
  inputs: {
    recommendation?: ScoredRecommendation | null;
    resource?: LearningResource | null;
    secondary?: ScoredRecommendation[];
    error?: string | null;
  },
  enabledCapabilities: CapabilityKey[] = [CAPABILITY_KEY.POMODORO],
) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  signInLearnerWith(enabledCapabilities);
  const fixture = TestBed.createComponent(IdealMatchComponent);
  fixture.componentRef.setInput('recommendation', inputs.recommendation ?? null);
  fixture.componentRef.setInput('resource', inputs.resource ?? null);
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

  test('should offer the top resource details only next to focusing on it', () => {
    const borrowCheckerChapter = learningResourceFixture('The Borrow Checker', 30);
    const borrowCheckerRecommendation: ScoredRecommendation = {
      resourceId: borrowCheckerChapter.id,
      title: borrowCheckerChapter.title,
      score: 80,
      why: [],
    };
    const openDetails = (element: HTMLElement) =>
      Array.from(element.querySelectorAll('a')).find((link) => link.textContent?.trim() === 'Open details');

    const withPomodoro = render({ recommendation: borrowCheckerRecommendation, resource: borrowCheckerChapter });
    TestBed.resetTestingModule();
    const withoutPomodoro = render({ recommendation: borrowCheckerRecommendation, resource: borrowCheckerChapter }, []);

    expect(openDetails(withPomodoro)?.getAttribute('href')).toBe(`/resources/${borrowCheckerChapter.id}`);
    expect(openDetails(withoutPomodoro)).toBeUndefined();
  });
});
