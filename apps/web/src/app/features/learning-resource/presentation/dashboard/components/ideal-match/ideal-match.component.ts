import { Component, computed, input, signal } from '@angular/core';
import { RouterLink, type Params } from '@angular/router';
import { ScrambleComponent } from '@shared/components/scramble/scramble.component';
import { RevealDirective } from '@shared/components/reveal/reveal.directive';
import { LearningResource } from '@features/learning-resource/domain/learning-resource.model.js';
import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';
import { recommendedEntryQueryParams } from '@features/pomodoro/presentation/start/recommended-entry';

function hashHue(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i += 1) h = (h * 31 + (title.codePointAt(i) ?? 0)) % 360;
  return h;
}

function recKey(rec: ScoredRecommendation): string {
  return rec.resourceId ?? rec.nodeId ?? rec.title;
}

@Component({
  selector: 'app-ideal-match',
  standalone: true,
  imports: [RouterLink, ScrambleComponent, RevealDirective],
  templateUrl: './ideal-match.component.html',
})
export class IdealMatchComponent {
  readonly recommendation = input.required<ScoredRecommendation | null>();
  readonly resource = input<LearningResource | null>(null);
  readonly secondary = input<ScoredRecommendation[]>([]);
  readonly catalogMinutes = input(0);

  readonly discarded = signal<string[]>([]);

  readonly ranked = computed(() => {
    const top = this.recommendation();
    const all = top ? [top, ...this.secondary()] : [...this.secondary()];
    const skipped = new Set(this.discarded());
    return all.filter((rec) => !skipped.has(recKey(rec)));
  });

  readonly effectiveTop = computed(() => this.ranked()[0] ?? null);
  readonly effectiveSecondary = computed(() => this.ranked().slice(1));

  readonly displayResource = computed(() => {
    const rec = this.effectiveTop();
    const r = this.resource();
    const matched = r && rec && rec.resourceId === r.id ? r : null;
    const energyRaw = matched?.energyLevel ?? 'Medium';
    return {
      title: rec?.title ?? 'Quiet catalog',
      desc: matched?.notes ?? null,
      duration: matched?.estimatedDuration.value ?? null,
      resource: matched,
      score: rec?.score ?? null,
      why: rec?.why ?? [],
      kindLabel: 'Resource',
      energyLabel: energyRaw.toLowerCase(),
      difficulty: matched?.difficulty ?? '—',
    };
  });

  focusQueryParams(rec: ScoredRecommendation): Params {
    return recommendedEntryQueryParams(rec);
  }

  dismissTop(): void {
    const top = this.effectiveTop();
    if (!top) return;
    this.discarded.update((list) => [...list, recKey(top)]);
  }

  restoreDiscarded(): void {
    this.discarded.set([]);
  }

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
    return Math.max(1, ...this.effectiveSecondary().map((s) => s.score));
  }

  secondaryWidthPct(score: number): number {
    return Math.max(6, (score / this.maxSecondaryScore()) * 100);
  }

  coverStyle(title: string, score?: number): string {
    const hue = hashHue(title || 'eap');
    const tone =
      score === undefined
        ? 'var(--color-accent)'
        : score > 70
          ? 'var(--color-accent)'
          : score > 45
            ? 'var(--tone-ochre, var(--color-accent))'
            : 'var(--tone-ember, var(--color-accent))';
    return `--cover-h: ${hue}deg; --cover-a: ${tone};`;
  }
}
