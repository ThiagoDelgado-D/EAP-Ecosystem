import type { LearningPathNode } from '@features/learning-path/domain/learning-path.model';

export interface NodeFormDialogData {
  pathId: string;
  /** Present when editing an existing node; absent when adding a new one. */
  node?: LearningPathNode;
}
