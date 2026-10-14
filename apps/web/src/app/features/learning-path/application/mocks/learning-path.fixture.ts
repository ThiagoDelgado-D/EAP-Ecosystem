import {
  NODE_PROGRESS,
  PATH_MODE,
  PATH_SOURCE,
  type LearningPath,
  type LearningPathNode,
} from '@features/learning-path/domain/learning-path.model';

export function pathFixture(title: string): LearningPath {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    title,
    mode: PATH_MODE.SEQUENTIAL,
    source: PATH_SOURCE.MANUAL,
    createdAt: now,
    updatedAt: now,
  };
}

export function nodeFixture(pathId: string, title: string, order: number): LearningPathNode {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    pathId,
    title,
    order,
    progress: NODE_PROGRESS.PENDING,
    x: 0,
    y: 0,
    createdAt: now,
    updatedAt: now,
  };
}
