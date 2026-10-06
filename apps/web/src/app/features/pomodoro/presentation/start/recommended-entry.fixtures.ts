import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import type { PickerPathGroup } from '@features/pomodoro/application/pomodoro-picker.model';

const createdAt = new Date('2026-10-06T10:00:00.000Z');

export function learningResourceFixture(title: string, estimatedMin: number): LearningResource {
  return {
    id: crypto.randomUUID(),
    title,
    difficulty: 'Medium',
    energyLevel: 'Medium',
    status: 'Pending',
    estimatedDuration: { value: estimatedMin, isEstimated: true },
    topicIds: [],
    typeId: crypto.randomUUID(),
    createdAt,
    updatedAt: createdAt,
  };
}

export function pathGroupFixture(
  pathTitle: string,
  nodes: { title: string; learningResourceId?: string }[],
): PickerPathGroup {
  const pathId = crypto.randomUUID();
  return {
    path: {
      id: pathId,
      userId: crypto.randomUUID(),
      title: pathTitle,
      mode: 'sequential',
      source: 'manual',
      createdAt,
      updatedAt: createdAt,
    },
    nodes: nodes.map((node) => ({
      id: crypto.randomUUID(),
      pathId,
      title: node.title,
      learningResourceId: node.learningResourceId,
      progress: 'pending',
      createdAt,
      updatedAt: createdAt,
    })),
  };
}
