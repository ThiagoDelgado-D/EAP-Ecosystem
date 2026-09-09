import type { UUID } from "domain-lib";
import {
  SegmentTargetKind,
  type LearningPathMembershipPort,
} from "@pomodoro/domain";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";

export type SegmentTargetInput =
  | { kind: typeof SegmentTargetKind.FREE }
  | {
      kind: typeof SegmentTargetKind.RESOURCE;
      resourceId: UUID;
      learningPathId?: UUID;
    }
  | {
      kind: typeof SegmentTargetKind.NODE;
      learningPathId: UUID;
      learningPathNodeId: UUID;
      resourceId?: UUID;
    };

export type ResolvedSegmentTarget =
  | { targetKind: typeof SegmentTargetKind.FREE }
  | { targetKind: typeof SegmentTargetKind.RESOURCE; resourceId: UUID }
  | {
      targetKind: typeof SegmentTargetKind.NODE;
      learningPathId: UUID;
      learningPathNodeId: UUID;
      resourceId?: UUID;
    };

export interface ResolveSegmentTargetDependencies {
  learningPathMembershipPort: LearningPathMembershipPort;
}

export const resolveSegmentTarget = async (
  { learningPathMembershipPort }: ResolveSegmentTargetDependencies,
  input: SegmentTargetInput,
): Promise<ResolvedSegmentTarget | AmbiguousPathTargetError> => {
  if (input.kind === SegmentTargetKind.FREE) {
    return { targetKind: SegmentTargetKind.FREE };
  }

  if (input.kind === SegmentTargetKind.NODE) {
    return {
      targetKind: SegmentTargetKind.NODE,
      learningPathId: input.learningPathId,
      learningPathNodeId: input.learningPathNodeId,
      resourceId: input.resourceId,
    };
  }

  if (input.learningPathId) {
    const memberships = await learningPathMembershipPort.findPathsForResource(
      input.resourceId,
    );
    const match = memberships.find((m) => m.pathId === input.learningPathId);
    if (match) {
      return {
        targetKind: SegmentTargetKind.NODE,
        learningPathId: match.pathId,
        learningPathNodeId: match.nodeId,
        resourceId: input.resourceId,
      };
    }
    return {
      targetKind: SegmentTargetKind.RESOURCE,
      resourceId: input.resourceId,
    };
  }

  const memberships = await learningPathMembershipPort.findPathsForResource(
    input.resourceId,
  );

  if (memberships.length === 0) {
    return {
      targetKind: SegmentTargetKind.RESOURCE,
      resourceId: input.resourceId,
    };
  }

  if (memberships.length === 1) {
    const [membership] = memberships;
    return {
      targetKind: SegmentTargetKind.NODE,
      learningPathId: membership!.pathId,
      learningPathNodeId: membership!.nodeId,
      resourceId: input.resourceId,
    };
  }

  return new AmbiguousPathTargetError(memberships);
};
