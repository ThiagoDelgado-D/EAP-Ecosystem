import { Component, computed, inject, signal } from '@angular/core';
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
  imports: [FormsModule],
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
  readonly NODE_PROGRESS_LABELS = NODE_PROGRESS_LABELS;
  readonly RESOURCE_STATUS_LABELS = RESOURCE_STATUS_LABELS;

  private readonly filteredQuery = computed(() => this.query().trim().toLowerCase());

  readonly filteredReady = computed(() => this.filterEntries(this.picker.readyToLearn()));
  readonly filteredInProgress = computed(() => this.filterEntries(this.picker.inProgress()));
  readonly filteredPathGroups = computed(() => {
    const q = this.filteredQuery();
    return this.picker
      .allPaths()
      .map((group) => ({
        path: group.path,
        nodes: q
          ? group.nodes.filter(
              (n) => n.title.toLowerCase().includes(q) || group.path.title.toLowerCase().includes(q),
            )
          : group.nodes,
      }))
      .filter((group) => !q || group.nodes.length > 0);
  });
  readonly filteredLibrary = computed(() => {
    const q = this.filteredQuery();
    if (!q) return this.picker.library();
    return this.picker.library().filter((r) => r.title.toLowerCase().includes(q));
  });

  constructor() {
    void this.picker.load();
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

  private filterEntries(entries: PickerPathNode[]): PickerPathNode[] {
    const q = this.filteredQuery();
    if (!q) return entries;
    return entries.filter(
      (entry) => entry.node.title.toLowerCase().includes(q) || entry.path.title.toLowerCase().includes(q),
    );
  }
}
