import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { minutesLabel } from '@shared/utils/minutes-label';

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-activity.component.html',
})
export class RecentActivityComponent {
  readonly resources = input.required<LearningResource[]>();

  readonly minutesLabel = minutesLabel;

  dotColor(resource: LearningResource): string {
    switch (resource.status) {
      case 'Completed':
        return 'var(--color-accent)';
      case 'InProgress':
        return 'var(--tone-info, var(--color-accent))';
      default:
        return 'var(--tone-slate, var(--color-line-strong))';
    }
  }

  relativeLabel(resource: LearningResource): string {
    return relativeTime(resource.lastViewed ?? resource.updatedAt);
  }
}
