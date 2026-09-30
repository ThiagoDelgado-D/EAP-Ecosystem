import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';

function minutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

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

  minutesLabel(minutes: number): string {
    return minutesLabel(minutes);
  }

  relativeLabel(resource: LearningResource): string {
    return relativeTime(resource.lastViewed ?? resource.updatedAt);
  }
}
