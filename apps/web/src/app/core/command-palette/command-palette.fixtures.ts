import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import type {
  LearningPath,
  LearningPathNode,
  LearningPathWithNodes,
} from '@features/learning-path/domain/learning-path.model';

const now = new Date('2026-10-05T10:00:00.000Z');

export function commandPaletteFixtures() {
  const rustBookResource: LearningResource = {
    id: crypto.randomUUID(),
    title: 'The Rust Programming Language',
    url: 'https://www.doc.rust-lang.org/book/',
    difficulty: 'Medium',
    energyLevel: 'High',
    status: 'InProgress',
    estimatedDuration: { value: 600, isEstimated: true },
    topicIds: [],
    typeId: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const kubernetesTalkResource: LearningResource = {
    id: crypto.randomUUID(),
    title: 'Intro to Kubernetes',
    url: 'https://youtube.com/watch?v=kubernetes-intro',
    difficulty: 'Low',
    energyLevel: 'Low',
    status: 'Pending',
    estimatedDuration: { value: 45, isEstimated: false },
    topicIds: [],
    typeId: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const rustPath: LearningPath = {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    title: 'Rust for Backend Engineers',
    mode: 'sequential',
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  };

  const ownershipNode: LearningPathNode = {
    id: crypto.randomUUID(),
    pathId: rustPath.id,
    title: 'Ownership & Borrowing',
    learningResourceId: rustBookResource.id,
    progress: 'done',
    createdAt: now,
    updatedAt: now,
  };

  const traitObjectsStubNode: LearningPathNode = {
    id: crypto.randomUUID(),
    pathId: rustPath.id,
    title: 'Trait Objects',
    learningResourceId: null,
    progress: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const rustPathWithNodes: LearningPathWithNodes = {
    path: rustPath,
    nodes: [ownershipNode, traitObjectsStubNode],
    edges: [],
  };

  return {
    rustBookResource,
    kubernetesTalkResource,
    rustPath,
    ownershipNode,
    traitObjectsStubNode,
    rustPathWithNodes,
  };
}
