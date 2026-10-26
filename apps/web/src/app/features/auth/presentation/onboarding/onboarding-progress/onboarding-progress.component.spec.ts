import { TestBed } from '@angular/core/testing';
import { OnboardingProgressComponent } from './onboarding-progress.component';

const STEP_COUNT = 4;
const CURRENT_STEP = 3;

describe('OnboardingProgressComponent', () => {
  test('fills the steps behind the learner, half the current one and none ahead', () => {
    const fixture = TestBed.createComponent(OnboardingProgressComponent);
    fixture.componentRef.setInput('current', CURRENT_STEP);
    fixture.componentRef.setInput('total', STEP_COUNT);
    fixture.detectChanges();

    expect(fixture.componentInstance.segments().map((segment) => segment.fill)).toEqual([
      100, 100, 50, 0,
    ]);
  });

  test('reports the current step and how many there are', () => {
    const fixture = TestBed.createComponent(OnboardingProgressComponent);
    fixture.componentRef.setInput('current', CURRENT_STEP);
    fixture.componentRef.setInput('total', STEP_COUNT);
    fixture.detectChanges();

    const progress: HTMLElement = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(progress.getAttribute('aria-valuenow')).toBe(`${CURRENT_STEP}`);
    expect(progress.getAttribute('aria-valuemax')).toBe(`${STEP_COUNT}`);
    expect(progress.textContent).toContain(`${CURRENT_STEP}/${STEP_COUNT}`);
  });
});
