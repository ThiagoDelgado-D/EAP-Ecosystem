import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, type Params } from '@angular/router';
import { AuthStore } from '@features/auth/application/auth.store';
import { CAPABILITY_KEY } from '@features/auth/domain/auth.model';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { recommendedEntryQueryParams } from '@features/pomodoro/presentation/start/recommended-entry';

@Component({
  selector: 'app-continue-resources',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './continue-resources.component.html',
})
export class ContinueResourcesComponent {
  readonly resources = input.required<LearningResource[]>();
  readonly topicColorById = input<Record<string, string>>({});
  private readonly authStore = inject(AuthStore);

  readonly showPomodoro = computed(() => this.authStore.isEnabled(CAPABILITY_KEY.POMODORO));
  readonly emptyHint = computed(() => {
    const source = this.authStore.isEnabled(CAPABILITY_KEY.RECOMMENDATION) ? 'the engine' : 'your resources';
    const next = this.showPomodoro() ? 'start a 25-minute block' : 'mark it in progress';
    return `Nothing in progress yet. Pick something from ${source} and ${next}.`;
  });

  resumeQueryParams(resource: LearningResource): Params {
    return recommendedEntryQueryParams({ resourceId: resource.id });
  }

  coverStyle(resource: LearningResource): string {
    const color = resource.topicIds
      .map((id) => this.topicColorById()[id])
      .find((c): c is string => !!c);
    if (color) return `--cover-h: 135deg; --cover-a: ${color};`;
    return this.hashCover(resource.title);
  }

  private hashCover(title: string): string {
    let h = 0;
    for (let i = 0; i < title.length; i += 1) h = (h * 31 + (title.codePointAt(i) ?? 0)) % 360;
    return `--cover-h: ${h}deg; --cover-a: var(--color-accent);`;
  }

  lastViewedLabel(resource: LearningResource): string {
    if (!resource.lastViewed) return 'Not opened yet';
    const days = Math.floor((Date.now() - resource.lastViewed.getTime()) / 86_400_000);
    if (days <= 0) return 'Opened today';
    if (days === 1) return 'Opened yesterday';
    return `Opened ${days} days ago`;
  }
}
