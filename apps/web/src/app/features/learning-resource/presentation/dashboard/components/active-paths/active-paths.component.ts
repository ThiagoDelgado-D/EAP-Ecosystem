import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningPathService } from '@features/learning-path/application/learning-path.service';
import type {
  LearningPathNode,
  LearningPathWithNodes,
} from '@features/learning-path/domain/learning-path.model';

function sortedNodes(entry: LearningPathWithNodes): LearningPathNode[] {
  return [...entry.nodes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
      .pathsWithNodes()
      .map((entry) => ({ entry, nodes: sortedNodes(entry) }))
      .filter(({ nodes }) => nodes.length > 0 && nodes.some((node) => node.progress !== 'done'))
      .slice(0, 3),
  );

  progressPct(nodes: LearningPathNode[]): number {
    if (nodes.length === 0) return 0;
    const done = nodes.filter((node) => node.progress === 'done').length;
    return Math.round((done / nodes.length) * 100);
  }

  doneCount(nodes: LearningPathNode[]): number {
    return nodes.filter((node) => node.progress === 'done').length;
  }

  nextNode(nodes: LearningPathNode[]): LearningPathNode | null {
    return nodes.find((node) => node.progress !== 'done') ?? null;
  }
}
