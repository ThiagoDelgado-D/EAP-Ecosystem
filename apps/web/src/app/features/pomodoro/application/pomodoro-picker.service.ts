import { Injectable, computed, inject, signal } from '@angular/core';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import type { LearningPathWithNodes } from '@features/learning-path/domain/learning-path.model';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import type { PickerPathGroup, PickerPathNode } from './pomodoro-picker.model';

@Injectable()
export class PomodoroPickerService {
  private readonly learningPathRepository = inject(LearningPathRepository);
  private readonly learningResourceRepository = inject(LearningResourceRepository);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly pathsWithNodes = signal<LearningPathWithNodes[]>([]);
  readonly library = signal<LearningResource[]>([]);

  readonly readyToLearn = computed<PickerPathNode[]>(() => {
    const result: PickerPathNode[] = [];
    for (const { path, nodes, edges } of this.pathsWithNodes()) {
      const doneNodeIds = new Set(
        nodes.filter((node) => node.progress === 'done').map((node) => node.id),
      );
      for (const node of nodes) {
        if (node.progress !== 'pending') continue;
        const prerequisites = edges.filter((edge) => edge.targetNodeId === node.id);
        const unblocked = prerequisites.every((edge) => doneNodeIds.has(edge.sourceNodeId));
        if (unblocked) result.push({ path, node });
      }
    }
    return result;
  });

  readonly inProgress = computed<PickerPathNode[]>(() => {
    const result: PickerPathNode[] = [];
    for (const { path, nodes } of this.pathsWithNodes()) {
      for (const node of nodes) {
        if (node.progress === 'in_progress') result.push({ path, node });
      }
    }
    return result;
  });

  readonly allPaths = computed<PickerPathGroup[]>(() =>
    this.pathsWithNodes().map(({ path, nodes }) => ({ path, nodes })),
  );

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [pathsWithNodes, resources] = await Promise.all([
        this.learningPathRepository.getAllWithNodes(),
        this.learningResourceRepository.getAll(),
      ]);
      this.pathsWithNodes.set(pathsWithNodes);
      this.library.set(resources);
    } catch {
      this.error.set('We could not load the available material.');
    } finally {
      this.loading.set(false);
    }
  }
}
