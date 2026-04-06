import { Component, input, computed } from '@angular/core';
import {
  EnergyLevel,
  LearningResource,
  MentalStateType,
} from '@features/learning-resource/domain/learning-resource.model.js';

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

const MENTAL_STATE_LABELS: Record<MentalStateType, string> = {
  deep_focus: 'Deep Focus',
  light_read: 'Light Read',
  creative: 'Creative',
  quick_op: 'Quick Op',
  review: 'Review',
};

@Component({
  selector: 'app-ideal-match',
  standalone: true,
  templateUrl: './ideal-match.component.html',
})
export class IdealMatchComponent {
  readonly resource = input.required<LearningResource | null>();
  readonly energyLevel = input.required<EnergyLevel>();
  readonly mentalState = input.required<MentalStateType>();

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
  readonly mentalStateLabel = computed(() => MENTAL_STATE_LABELS[this.mentalState()]);
}
