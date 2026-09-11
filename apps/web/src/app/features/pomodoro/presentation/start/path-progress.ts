import type { LearningPathNode } from '@features/learning-path/domain/learning-path.model';

export interface PathProgress {
  done: number;
  total: number;
  pct: number;
  stubs: number;
}

export function pathProgress(nodes: LearningPathNode[]): PathProgress {
  const total = nodes.length;
  const done = nodes.filter((n) => n.progress === 'done').length;
  const stubs = nodes.filter((n) => !n.learningResourceId).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100), stubs };
}
