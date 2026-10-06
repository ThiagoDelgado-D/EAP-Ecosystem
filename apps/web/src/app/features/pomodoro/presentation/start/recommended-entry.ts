import type { ParamMap, Params } from '@angular/router';
import type { PickerPathGroup } from '@features/pomodoro/application/pomodoro-picker.model';
import type { LearningResource } from '@features/learning-resource/domain/learning-resource.model';
import {
  MAX_PLANNED_DURATION_MIN,
  SEGMENT_TARGET_KIND,
  type SegmentTarget,
} from '@features/pomodoro/domain/pomodoro.model';

export const RECOMMENDED_ENTRY_PARAM = {
  RESOURCE: 'resource',
  PATH: 'path',
  NODE: 'node',
} as const;

export function resolveRecommendedTarget(
  params: ParamMap,
  groups: PickerPathGroup[],
  library: LearningResource[],
): SegmentTarget | null {
  const resourceId = params.get(RECOMMENDED_ENTRY_PARAM.RESOURCE);
  if (resourceId) {
    if (!library.some((resource) => resource.id === resourceId)) return null;
    return { kind: SEGMENT_TARGET_KIND.RESOURCE, resourceId };
  }

  const pathId = params.get(RECOMMENDED_ENTRY_PARAM.PATH);
  const nodeId = params.get(RECOMMENDED_ENTRY_PARAM.NODE);
  if (!pathId || !nodeId) return null;

  const node = groups.find((group) => group.path.id === pathId)?.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  return {
    kind: SEGMENT_TARGET_KIND.NODE,
    learningPathId: pathId,
    learningPathNodeId: nodeId,
    resourceId: node.learningResourceId ?? undefined,
  };
}

export function estimatedMinutesFor(
  target: SegmentTarget,
  library: LearningResource[],
): number | undefined {
  if (target.kind === SEGMENT_TARGET_KIND.FREE || !target.resourceId) return undefined;
  return library.find((resource) => resource.id === target.resourceId)?.estimatedDuration.value;
}

export function recommendedDurationMin(input: {
  estimatedMin?: number;
  availableMin?: number;
  defaultMin: number;
}): number {
  const known = [input.estimatedMin, input.availableMin].filter(
    (minutes): minutes is number => minutes !== undefined && minutes > 0,
  );
  const minutes = known.length > 0 ? Math.min(...known) : input.defaultMin;
  return Math.min(MAX_PLANNED_DURATION_MIN, Math.round(minutes));
}

export function recommendedEntryQueryParams(candidate: {
  resourceId?: string;
  pathId?: string;
  nodeId?: string;
}): Params {
  if (candidate.pathId && candidate.nodeId) {
    return {
      [RECOMMENDED_ENTRY_PARAM.PATH]: candidate.pathId,
      [RECOMMENDED_ENTRY_PARAM.NODE]: candidate.nodeId,
    };
  }
  if (candidate.resourceId) return { [RECOMMENDED_ENTRY_PARAM.RESOURCE]: candidate.resourceId };
  return {};
}
