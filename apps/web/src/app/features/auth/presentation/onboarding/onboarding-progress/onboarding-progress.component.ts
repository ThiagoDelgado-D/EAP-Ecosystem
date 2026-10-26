import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-onboarding-progress',
  standalone: true,
  template: `
    <div
      class="flex items-center gap-3"
      role="progressbar"
      aria-label="Onboarding progress"
      [attr.aria-valuenow]="current()"
      aria-valuemin="1"
      [attr.aria-valuemax]="total()"
    >
      @for (segment of segments(); track segment.step) {
        <span class="relative h-1 flex-1 overflow-hidden rounded-full bg-line-soft">
          <span
            class="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-700"
            [style.width.%]="segment.fill"
          ></span>
        </span>
      }
      <span class="tnum shrink-0 text-[0.7rem] text-ink-dim">{{ current() }}/{{ total() }}</span>
    </div>
  `,
})
export class OnboardingProgressComponent {
  readonly current = input.required<number>();
  readonly total = input.required<number>();

  readonly segments = computed(() =>
    Array.from({ length: this.total() }, (_, index) => {
      const step = index + 1;
      if (step < this.current()) return { step, fill: 100 };
      if (step === this.current()) return { step, fill: 50 };
      return { step, fill: 0 };
    }),
  );
}
