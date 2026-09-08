import { Component, input, computed } from '@angular/core';
import {
  EnergyLevel,
  LearningResource,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model.js';
import { EnumBadgeComponent } from '@shared/components/enum-badge/enum-badge.component';
import { MENTAL_STATE_BADGE_OPTIONS } from '@shared/components/enum-badge/enum-badge-options.js';

// Hardcoded fallback used when the API has no matching resource yet
// or when the backend recommendation endpoint is not implemented (v0.5.0)
const FALLBACK_RESOURCES: Record<EnergyLevel, { title: string; desc: string; duration: number }> = {
  Low: {
    title: 'JavaScript Quick Tips & Best Practices',
    desc: 'Light review of modern JS patterns, array methods, and clean code fundamentals...',
    duration: 20,
  },
  Medium: {
    title: 'Neural Network Architecture & Depth Optimization',
    desc: 'Master the intricacies of multi-layer perceptrons and the mathematical foundations of...',
    duration: 45,
  },
  High: {
    title: 'Distributed Systems Design & CQRS Patterns',
    desc: 'Deep dive into event sourcing, command-query separation, and eventual consistency...',
    duration: 180,
  },
};

@Component({
  selector: 'app-ideal-match',
  standalone: true,
  imports: [EnumBadgeComponent],
  templateUrl: './ideal-match.component.html',
})
export class IdealMatchComponent {
  readonly resource = input.required<LearningResource | null>();
  readonly energyLevel = input.required<EnergyLevel>();
  readonly mentalState = input.required<MentalStateType>();

  readonly mentalStateOptions = MENTAL_STATE_BADGE_OPTIONS;

  readonly displayResource = computed(() => {
    const r = this.resource();
    if (r) {
      return {
        title: r.title,
        desc: r.notes ?? 'No description available.',
        duration: r.estimatedDuration.value,
        imageUrl: r.imageUrl ?? null,
        url: r.url ?? null,
      };
    }
    // Fallback: use hardcoded data so the UI is never empty
    const fallback = FALLBACK_RESOURCES[this.energyLevel()];
    return { ...fallback, imageUrl: null, url: null };
  });

  readonly energyBadgeLabel = computed(() => `Recommended for ${this.energyLevel()} Energy`);
}
