import type { LearningPath, LearningPathNode } from '@features/learning-path/domain/learning-path.model';

export interface PickerPathNode {
  path: LearningPath;
  node: LearningPathNode;
}

export interface PickerPathGroup {
  path: LearningPath;
  nodes: LearningPathNode[];
}
