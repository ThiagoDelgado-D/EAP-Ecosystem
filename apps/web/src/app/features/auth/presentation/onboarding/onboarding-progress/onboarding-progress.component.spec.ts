import { TestBed } from '@angular/core/testing';
import { OnboardingProgressComponent } from './onboarding-progress.component';

const STEP_COUNT = 4;
const CURRENT_STEP = 3;

describe('OnboardingProgressComponent', () => {
  test('shows one mark per step and reports the current one', () => {
    const fixture = TestBed.createComponent(OnboardingProgressComponent);
    fixture.componentRef.setInput('current', CURRENT_STEP);
    fixture.componentRef.setInput('total', STEP_COUNT);
    fixture.detectChanges();

    const progress: HTMLElement = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(progress.children).toHaveLength(STEP_COUNT);
    expect(progress.getAttribute('aria-valuenow')).toBe(`${CURRENT_STEP}`);
    expect(progress.getAttribute('aria-valuemax')).toBe(`${STEP_COUNT}`);
    expect(progress.children[CURRENT_STEP - 1].classList).toContain('bg-accent');
  });
});
