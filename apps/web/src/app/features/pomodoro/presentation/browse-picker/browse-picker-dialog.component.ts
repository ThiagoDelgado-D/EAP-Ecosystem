import { Component, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { LearningPathRepository } from '@features/learning-path/domain/learning-path.repository';
import { LearningPathHttpRepository } from '@features/learning-path/infrastructure/learning-path-http.repository';
import { LearningResourceRepository } from '@features/learning-resource/domain/learning-resource.repository';
import { LearningResourceHttpRepository } from '@features/learning-resource/infrastructure/learning-resource-http.repository';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import { SEGMENT_TARGET_KIND, type SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { PickerPathNode } from '@features/pomodoro/application/pomodoro-picker.model';
import type { NodeProgress } from '@features/learning-path/domain/learning-path.model';

export type BrowsePickerTab = 'ready' | 'in-progress' | 'all-paths' | 'library';

export const NODE_PROGRESS_LABELS: Record<NodeProgress, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
};

@Component({
  selector: 'app-browse-picker-dialog',
  standalone: true,
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
  readonly NODE_PROGRESS_LABELS = NODE_PROGRESS_LABELS;

  constructor() {
    void this.picker.load();
  }

  selectTab(tab: BrowsePickerTab): void {
    this.activeTab.set(tab);
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
