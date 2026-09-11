import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { RESOURCE_STATUS_LABELS } from '@features/learning-resource/domain/learning-resource.constants';
import { SEGMENT_TARGET_KIND, type SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import { filterLibraryResources, filterPickerNodes, filterPickerPathGroups, firstTabWithResults } from '@features/pomodoro/application/picker-search';
import type { PickerPathNode } from '@features/pomodoro/application/pomodoro-picker.model';
import type { LearningPathNode, NodeProgress } from '@features/learning-path/domain/learning-path.model';
import { pathColor } from '../start/path-color';

export type BrowsePickerTab = 'ready' | 'in-progress' | 'all-paths' | 'library';

export const NODE_PROGRESS_LABELS: Record<NodeProgress, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
};

@Component({
  selector: 'app-browse-picker-dialog',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  providers: [
    PomodoroPickerService,
    { provide: LearningPathRepository, useClass: LearningPathHttpRepository },
    { provide: LearningResourceRepository, useClass: LearningResourceHttpRepository },
  ],
  templateUrl: './browse-picker-dialog.component.html',
})
export class BrowsePickerDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<BrowsePickerDialogComponent, SegmentTarget | undefined>);
  readonly picker = inject(PomodoroPickerService);

  readonly activeTab = signal<BrowsePickerTab>('ready');
  readonly query = signal('');
  readonly RESOURCE_STATUS_LABELS = RESOURCE_STATUS_LABELS;

  readonly filteredReady = computed(() => filterPickerNodes(this.picker.readyToLearn(), this.query()));
  readonly filteredInProgress = computed(() => filterPickerNodes(this.picker.inProgress(), this.query()));
  readonly filteredPathGroups = computed(() => filterPickerPathGroups(this.picker.allPaths(), this.query()));
  readonly filteredLibrary = computed(() => filterLibraryResources(this.picker.library(), this.query()));

  constructor() {
    void this.picker.load();

    effect(() => {
      if (!this.query().trim()) return;
      const next = firstTabWithResults(this.activeTab(), {
        ready: this.filteredReady().length,
        'in-progress': this.filteredInProgress().length,
        'all-paths': this.filteredPathGroups().reduce((count, group) => count + group.nodes.length, 0),
        library: this.filteredLibrary().length,
      });
      if (next) this.activeTab.set(next);
    });
  }

  selectTab(tab: BrowsePickerTab): void {
    this.activeTab.set(tab);
  }

  clearQuery(): void {
    this.query.set('');
  }

  pathColor(pathId: string): string {
    return pathColor(pathId);
  }

  isStub(node: LearningPathNode): boolean {
    return !node.learningResourceId;
  }

  nodeProgressLabel(progress: NodeProgress): string {
    return NODE_PROGRESS_LABELS[progress];
  }

  progressPillClass(progress: NodeProgress | LearningResource['status']): string {
    if (progress === 'done' || progress === 'Completed') return 'text-status-done bg-status-done/10 border-status-done/30';
    if (progress === 'in_progress' || progress === 'InProgress') {
      return 'text-status-in-progress bg-status-in-progress/10 border-status-in-progress/30';
    }
    return 'text-status-pending bg-status-pending/10 border-status-pending/30';
  }

  nodeSubtitle(path: { title: string }, node: LearningPathNode): string {
    if (!node.learningResourceId) return `${path.title} · no resource linked`;
    const resource = this.picker.library().find((r) => r.id === node.learningResourceId);
    if (!resource) return path.title;
    return `${path.title} · ${resource.estimatedDuration.value}min`;
  }

  pickNode({ path, node }: PickerPathNode): void {
    this.dialogRef.close({
      kind: SEGMENT_TARGET_KIND.NODE,
      learningPathId: path.id,
      learningPathNodeId: node.id,
      resourceId: node.learningResourceId ?? undefined,
    });
  }

  pickResource(resource: LearningResource): void {
    this.dialogRef.close({ kind: SEGMENT_TARGET_KIND.RESOURCE, resourceId: resource.id });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
