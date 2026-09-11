import type { LearningPathNode } from '@features/learning-path/domain/learning-path.model';
import { pathProgress } from './path-progress';

const now = new Date('2026-09-11T10:00:00.000Z');

function buildNode(progress: LearningPathNode['progress'], learningResourceId?: string): LearningPathNode {
  return {
    id: crypto.randomUUID(),
    pathId: crypto.randomUUID(),
    title: 'Node',
    progress,
    learningResourceId,
    createdAt: now,
    updatedAt: now,
  } as LearningPathNode;
}

describe('pathProgress', () => {
  test('should return zeroed progress for a path with no nodes', () => {
    expect(pathProgress([])).toEqual({ done: 0, total: 0, pct: 0, stubs: 0 });
  });

  test('should count done nodes, stub nodes, and round the completion percentage', () => {
    const nodes: LearningPathNode[] = [
      buildNode('done', crypto.randomUUID()),
      buildNode('in_progress', crypto.randomUUID()),
      buildNode('pending'),
    ];

    expect(pathProgress(nodes)).toEqual({ done: 1, total: 3, pct: 33, stubs: 1 });
  });
});
