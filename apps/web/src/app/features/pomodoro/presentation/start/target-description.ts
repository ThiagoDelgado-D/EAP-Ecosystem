import type { SegmentTarget } from '@features/pomodoro/domain/pomodoro.model';
import type { PickerPathGroup } from '@features/pomodoro/application/pomodoro-picker.model';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';

export interface TargetDescription {
  caseNo: 1 | 2 | 3 | 4;
  label: string;
  isFree: boolean;
  isStub: boolean;
}

export function describeTarget(
  target: SegmentTarget | null,
  groups: PickerPathGroup[],
): TargetDescription {
  if (!target || target.kind === 'free') {
    return { caseNo: 1, label: 'Free focus', isFree: true, isStub: false };
  }
  if (target.kind === 'resource') {
    return { caseNo: 2, label: 'Resource', isFree: false, isStub: false };
  }
  const node = groups
    .find((g) => g.path.id === target.learningPathId)
    ?.nodes.find((n) => n.id === target.learningPathNodeId);
  const stub = !node?.learningResourceId;
  return {
    caseNo: stub ? 4 : 3,
    label: stub ? 'Path node · stub' : 'Path node',
    isFree: false,
    isStub: stub,
  };
}

export interface TargetLabel {
  title: string;
  subtitle?: string;
}

export function describeTargetLabel(
  target: SegmentTarget,
  groups: PickerPathGroup[],
  library: LearningResource[],
): TargetLabel {
  if (target.kind === 'free') return { title: 'Free focus', subtitle: 'No material attached' };
  if (target.kind === 'resource') {
    const resource = library.find((r) => r.id === target.resourceId);
    return { title: resource?.title ?? 'Resource' };
  }
  const group = groups.find((g) => g.path.id === target.learningPathId);
  const node = group?.nodes.find((n) => n.id === target.learningPathNodeId);
  return { title: node?.title ?? 'Path step', subtitle: group?.path.title };
}

export interface ResourcePathMembership {
  path: PickerPathGroup['path'];
  node: PickerPathGroup['nodes'][number];
}

export function pathsForResource(groups: PickerPathGroup[], resourceId: string): ResourcePathMembership[] {
  const out: ResourcePathMembership[] = [];
  for (const group of groups) {
    for (const node of group.nodes) {
      if (node.learningResourceId === resourceId) out.push({ path: group.path, node });
    }
  }
  return out;
}
