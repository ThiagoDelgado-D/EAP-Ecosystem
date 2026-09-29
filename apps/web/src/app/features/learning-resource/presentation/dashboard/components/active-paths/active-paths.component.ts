import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningPathService } from '@features/learning-path/application/learning-path.service';
import type { LearningPath } from '@features/learning-path/domain/learning-path.model';

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
}
