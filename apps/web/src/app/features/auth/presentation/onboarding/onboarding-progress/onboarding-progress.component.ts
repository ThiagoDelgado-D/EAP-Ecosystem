import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-onboarding-progress',
  standalone: true,
  template: `
    <div
      class="flex justify-center items-center gap-2 mt-5"
      role="progressbar"
      aria-label="Onboarding progress"
      [attr.aria-valuenow]="current()"
      aria-valuemin="1"
      [attr.aria-valuemax]="total()"
    >
      @for (step of steps(); track step) {
        <div
          class="h-1.5 rounded-full transition-[width,background-color] duration-200"
          [class]="step === current() ? 'w-6 bg-accent' : 'w-1.5 bg-surface-overlay'"
        ></div>
      }
    </div>
  `,
})
export class OnboardingProgressComponent {
  readonly current = input.required<number>();
  readonly total = input.required<number>();

  readonly steps = computed(() => Array.from({ length: this.total() }, (_, index) => index + 1));
}
