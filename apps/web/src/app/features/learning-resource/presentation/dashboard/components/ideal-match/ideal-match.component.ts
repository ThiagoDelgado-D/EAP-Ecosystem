import { Component, input, computed } from '@angular/core';
import {
  LearningResource,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model.js';
import type { ScoredRecommendation } from '@features/recommendation/domain/recommendation.model';
import { EnumBadgeComponent } from '@shared/components/enum-badge/enum-badge.component';
import { MENTAL_STATE_BADGE_OPTIONS } from '@shared/components/enum-badge/enum-badge-options.js';

@Component({
  selector: 'app-ideal-match',
  standalone: true,
  imports: [EnumBadgeComponent],
  templateUrl: './ideal-match.component.html',
})
export class IdealMatchComponent {
  readonly recommendation = input.required<ScoredRecommendation | null>();
  readonly resource = input<LearningResource | null>(null);
  readonly mentalState = input.required<MentalStateType>();

  readonly mentalStateOptions = MENTAL_STATE_BADGE_OPTIONS;

  readonly displayResource = computed(() => {
    const rec = this.recommendation();
    const r = this.resource();
    return {
      title: rec?.title ?? r?.title ?? 'No suggestion yet',
      desc: r?.notes ?? null,
      duration: r?.estimatedDuration.value ?? null,
      imageUrl: r?.imageUrl ?? null,
      url: r?.url ?? null,
      score: rec?.score ?? null,
      why: rec?.why ?? [],
    };
  });
}
