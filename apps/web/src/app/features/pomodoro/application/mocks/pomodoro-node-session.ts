import type { PomodoroSessionStore } from '@features/pomodoro/application/pomodoro-session.store';
import type { PomodoroPickerService } from '@features/pomodoro/application/pomodoro-picker.service';
import type { MockedLearningPathRepository } from '@features/learning-path/application/mocks/mock-learning-path.repository';

export async function startPathNodeSession(
  ctx: {
    component: { picker: PomodoroPickerService };
    store: PomodoroSessionStore;
    learningPathRepository: MockedLearningPathRepository;
  },
  options: { pathTitle: string; pathMode?: 'sequential' | 'graph'; nodeTitle: string; resourceId?: string },
) {
  const pathId = crypto.randomUUID();
  const nodeId = crypto.randomUUID();
  const now = new Date();
  ctx.learningPathRepository.paths = [
    { id: pathId, userId: crypto.randomUUID(), title: options.pathTitle, mode: options.pathMode ?? 'sequential', source: 'manual', createdAt: now, updatedAt: now },
  ];
  ctx.learningPathRepository.nodes = [
    { id: nodeId, pathId, title: options.nodeTitle, learningResourceId: options.resourceId, progress: 'pending', createdAt: now, updatedAt: now },
  ];
  await ctx.component.picker.load();
  await ctx.store.start({
    plannedMin: 25,
    target: { kind: 'node', learningPathId: pathId, learningPathNodeId: nodeId, resourceId: options.resourceId },
  });
  return { pathId, nodeId };
}
