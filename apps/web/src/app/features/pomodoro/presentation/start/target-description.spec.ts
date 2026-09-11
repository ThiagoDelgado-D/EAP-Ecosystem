import type { LearningPath, LearningPathNode } from '@features/learning-path/domain/learning-path.model';
import type { PickerPathGroup } from '@features/pomodoro/application/pomodoro-picker.model';
import { describeTarget, pathsForResource } from './target-description';

const now = new Date('2026-09-11T10:00:00.000Z');

function buildPath(id: string, title: string): LearningPath {
  return {
    id,
    userId: crypto.randomUUID(),
    title,
    mode: 'sequential',
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  };
}

function buildNode(id: string, pathId: string, title: string, learningResourceId?: string): LearningPathNode {
  return {
    id,
    pathId,
    title,
    progress: 'pending',
    learningResourceId,
    createdAt: now,
    updatedAt: now,
  } as LearningPathNode;
}

describe('describeTarget', () => {
  test('should describe a null target and a free target as case 1', () => {
    expect(describeTarget(null, [])).toEqual({ caseNo: 1, label: 'Free focus', isFree: true, isStub: false });
    expect(describeTarget({ kind: 'free' }, [])).toEqual({
      caseNo: 1,
      label: 'Free focus',
      isFree: true,
      isStub: false,
    });
  });

  test('should describe a resource target as case 2', () => {
    expect(describeTarget({ kind: 'resource', resourceId: crypto.randomUUID() }, [])).toEqual({
      caseNo: 2,
      label: 'Resource',
      isFree: false,
      isStub: false,
    });
  });

  test('should describe a node with a linked resource as case 3', () => {
    const pathId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();
    const resourceId = crypto.randomUUID();
    const groups: PickerPathGroup[] = [
      { path: buildPath(pathId, 'Rust for Backend Engineers'), nodes: [buildNode(nodeId, pathId, 'Trait Objects', resourceId)] },
    ];

    expect(describeTarget({ kind: 'node', learningPathId: pathId, learningPathNodeId: nodeId }, groups)).toEqual({
      caseNo: 3,
      label: 'Path node',
      isFree: false,
      isStub: false,
    });
  });

  test('should describe a node with no linked resource as case 4 (stub)', () => {
    const pathId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();
    const groups: PickerPathGroup[] = [
      { path: buildPath(pathId, 'Rust for Backend Engineers'), nodes: [buildNode(nodeId, pathId, 'Async Runtimes')] },
    ];

    expect(describeTarget({ kind: 'node', learningPathId: pathId, learningPathNodeId: nodeId }, groups)).toEqual({
      caseNo: 4,
      label: 'Path node · stub',
      isFree: false,
      isStub: true,
    });
  });
});

describe('pathsForResource', () => {
  test('should find every path node linked to a given resource', () => {
    const resourceId = crypto.randomUUID();
    const cleanArchPathId = crypto.randomUUID();
    const systemDesignPathId = crypto.randomUUID();
    const cleanArchNodeId = crypto.randomUUID();
    const systemDesignNodeId = crypto.randomUUID();

    const groups: PickerPathGroup[] = [
      {
        path: buildPath(cleanArchPathId, 'Frontend Architecture Mastery'),
        nodes: [buildNode(cleanArchNodeId, cleanArchPathId, 'Clean Architecture', resourceId)],
      },
      {
        path: buildPath(systemDesignPathId, 'System Design Prep'),
        nodes: [buildNode(systemDesignNodeId, systemDesignPathId, 'Clean Architecture', resourceId)],
      },
    ];

    const result = pathsForResource(groups, resourceId);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.path.id)).toEqual([cleanArchPathId, systemDesignPathId]);
  });

  test('should return an empty array when the resource is not linked to any node', () => {
    const groups: PickerPathGroup[] = [
      { path: buildPath(crypto.randomUUID(), 'Rust for Backend Engineers'), nodes: [] },
    ];

    expect(pathsForResource(groups, crypto.randomUUID())).toEqual([]);
  });
});
