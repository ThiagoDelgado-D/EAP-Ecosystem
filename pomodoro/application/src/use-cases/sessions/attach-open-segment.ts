import { BaseError, InvalidDataError, type CurrentUser, type UUID } from "domain-lib";
import type {
  ISessionRepository,
  LearningPathMembershipPort,
  Segment,
} from "@pomodoro/domain";
import type { SessionNotFoundError } from "../../errors/session-not-found.js";
import type { SessionForbiddenError } from "../../errors/session-forbidden.js";
import type { SessionNotActiveError } from "../../errors/session-not-active.js";
import type { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";
import { SegmentTargetForbiddenError } from "../../errors/segment-target-forbidden.js";
import {
  resolveSegmentTarget,
  type SegmentTargetInput,
} from "./resolve-segment-target.js";
import { validateAndRequireActiveSessionWithOpenSegment } from "./verify-session-ownership.js";

export interface AttachOpenSegmentDependencies {
  sessionRepository: ISessionRepository;
  learningPathMembershipPort: LearningPathMembershipPort;
  currentUser: CurrentUser;
}

export interface AttachOpenSegmentRequestModel {
  sessionId: UUID;
  target: SegmentTargetInput;
}

export interface AttachOpenSegmentResponseModel {
  segment: Segment;
}

export const attachOpenSegment = async (
  {
    sessionRepository,
    learningPathMembershipPort,
    currentUser,
  }: AttachOpenSegmentDependencies,
  request: AttachOpenSegmentRequestModel,
): Promise<
  | AttachOpenSegmentResponseModel
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
  | NoOpenSegmentError
  | AmbiguousPathTargetError
  | SegmentTargetForbiddenError
> => {
  const guard = await validateAndRequireActiveSessionWithOpenSegment(
    sessionRepository,
    currentUser,
    request,
  );
  if (guard instanceof BaseError) return guard;
  const { openSegment } = guard;

  const resolvedTarget = await resolveSegmentTarget(
    { learningPathMembershipPort, currentUser },
    request.target,
  );
  if (
    resolvedTarget instanceof AmbiguousPathTargetError ||
    resolvedTarget instanceof SegmentTargetForbiddenError
  ) {
    return resolvedTarget;
  }

  const segment = await sessionRepository.updateSegment({
    id: openSegment.id,
    sessionId: openSegment.sessionId,
    startSec: openSegment.startSec,
    ...resolvedTarget,
  });

  return { segment };
};
