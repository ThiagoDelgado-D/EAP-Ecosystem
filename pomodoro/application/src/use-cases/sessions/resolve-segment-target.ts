import type { CurrentUser, UUID } from "domain-lib";
import {
  SegmentTargetKind,
  type LearningPathMembershipPort,
  type Segment,
} from "@pomodoro/domain";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";
import { SegmentTargetForbiddenError } from "../../errors/segment-target-forbidden.js";

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

export function segmentToResolvedTarget(segment: Segment): ResolvedSegmentTarget {
  if (segment.targetKind === SegmentTargetKind.NODE) {
    return {
      targetKind: SegmentTargetKind.NODE,
      learningPathId: segment.learningPathId,
      learningPathNodeId: segment.learningPathNodeId,
      resourceId: segment.resourceId,
    };
  }
  if (segment.targetKind === SegmentTargetKind.RESOURCE) {
    return { targetKind: SegmentTargetKind.RESOURCE, resourceId: segment.resourceId };
  }
  return { targetKind: SegmentTargetKind.FREE };
}

export interface ResolveSegmentTargetDependencies {
  learningPathMembershipPort: LearningPathMembershipPort;
  currentUser: CurrentUser;
}

export const resolveSegmentTarget = async (
  { learningPathMembershipPort, currentUser }: ResolveSegmentTargetDependencies,
  input: SegmentTargetInput,
): Promise<
  ResolvedSegmentTarget | AmbiguousPathTargetError | SegmentTargetForbiddenError
> => {
  if (input.kind === SegmentTargetKind.FREE) {
    return { targetKind: SegmentTargetKind.FREE };
  }

  if (input.kind === SegmentTargetKind.NODE) {
    const owned = await learningPathMembershipPort.verifyNodeOwnership(
      input.learningPathId,
      input.learningPathNodeId,
      currentUser.id,
    );
    if (!owned) {
      return new SegmentTargetForbiddenError();
    }
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
      currentUser.id,
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
    currentUser.id,
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
