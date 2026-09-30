import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningPathService } from '@features/learning-path/application/learning-path.service';
import type { LearningPath } from '@features/learning-path/domain/learning-path.model';

function trailDotState(index: number, doneCount: number): number {
  if (index < doneCount) return 2;
  if (index === doneCount) return 1;
  return 0;
}

@Component({
  selector: 'app-active-paths',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './active-paths.component.html',
})
export class ActivePathsComponent {
  private readonly pathService = inject(LearningPathService);

  readonly activePaths = computed(() =>
    this.pathService
      .paths()
      .filter((path) => (path.stats?.done ?? 0) < (path.stats?.total ?? 0))
      .slice(0, 3),
  );

  progressPct(path: LearningPath): number {
    const total = path.stats?.total ?? 0;
    if (total === 0) return 0;
    return Math.round(((path.stats?.done ?? 0) / total) * 100);
  }

  trailDots(path: LearningPath): number[] {
    const total = Math.min(8, Math.max(1, path.stats?.total ?? 0));
    const done = path.stats?.done ?? 0;
    return Array.from({ length: total }, (_, i) => trailDotState(i, done));
  }
}
