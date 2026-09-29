import { Component, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrambleComponent } from '@shared/components/scramble/scramble.component';
import {
  LearningResource,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model.js';
import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';

function hashHue(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i += 1) h = (h * 31 + title.charCodeAt(i)) % 360;
  return h;
}

@Component({
  selector: 'app-ideal-match',
  standalone: true,
  imports: [RouterLink, ScrambleComponent],
  templateUrl: './ideal-match.component.html',
})
export class IdealMatchComponent {
  readonly recommendation = input.required<ScoredRecommendation | null>();
  readonly resource = input<LearningResource | null>(null);
  readonly mentalState = input.required<MentalStateType>();
  readonly secondary = input<ScoredRecommendation[]>([]);

  readonly displayResource = computed(() => {
    const rec = this.recommendation();
    const r = this.resource();
    const energyRaw = r?.energyLevel ?? 'Medium';
    return {
      title: rec?.title ?? r?.title ?? 'Quiet catalog',
      desc: r?.notes ?? null,
      duration: r?.estimatedDuration.value ?? null,
      resource: r,
      url: r?.url ?? null,
      score: rec?.score ?? null,
      why: rec?.why ?? [],
      kindLabel: 'Resource',
      energyLabel: energyRaw.toLowerCase(),
      difficulty: r?.difficulty ?? '—',
    };
  });

  readonly ringR = 30;
  readonly ringC = 2 * Math.PI * 30;

  ringTone(): string {
    const score = this.displayResource().score ?? 0;
    if (score > 70) return 'var(--color-accent)';
    if (score > 45) return 'var(--tone-ochre, var(--color-accent))';
    return 'var(--tone-ember, var(--color-accent))';
  }

  ringOffset(): number {
    const score = this.displayResource().score ?? 0;
    const pct = Math.max(0, Math.min(1, score / 100));
    return this.ringC * (1 - pct);
  }

  maxSecondaryScore(): number {
    return Math.max(1, ...this.secondary().map((s) => s.score));
  }

  secondaryWidthPct(score: number): number {
    return Math.max(6, (score / this.maxSecondaryScore()) * 100);
  }

  coverStyle(title: string): string {
    const hue = hashHue(title || 'eap');
    return `--cover-h: ${hue}deg; --cover-a: var(--color-accent);`;
  }
}
