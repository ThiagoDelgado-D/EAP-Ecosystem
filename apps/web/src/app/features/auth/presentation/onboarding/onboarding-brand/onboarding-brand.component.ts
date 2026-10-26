import { Component } from '@angular/core';
import { BrandMarkComponent } from '@shared/components/brand-mark/brand-mark.component';

@Component({
  selector: 'app-onboarding-brand',
  standalone: true,
  imports: [BrandMarkComponent],
  templateUrl: './onboarding-brand.component.html',
  styles: `
    .texture {
      position: absolute;
      inset: -6%;
      background:
        radial-gradient(circle at 22% 30%, var(--wash-1), transparent 42%),
        radial-gradient(circle at 78% 64%, var(--wash-2), transparent 40%),
        radial-gradient(var(--color-line-strong) 1px, transparent 1.2px), var(--color-surface-inset);
      background-size:
        auto,
        auto,
        22px 22px,
        auto;
      animation: eap-drift 22s ease-in-out infinite alternate;
    }

    .veil {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        color-mix(in oklab, var(--color-surface-base) 10%, transparent),
        color-mix(in oklab, var(--color-surface-base) 88%, transparent)
      );
    }

    @media (prefers-reduced-motion: reduce) {
      .texture {
        animation: none;
      }
    }
  `,
})
export class OnboardingBrandComponent {
  readonly steps = [
    "Tell us what you're after and how you study.",
    'We turn on what helps and keep the rest out of your way.',
    'Every choice comes with its reason, and you can redo it anytime.',
  ];
}
