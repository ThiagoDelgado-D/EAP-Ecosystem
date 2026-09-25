import { InvalidDataError, type CurrentUser, type UUID } from "domain-lib";
import type {
  ISessionRepository,
  LearningPathMembershipPort,
  Segment,
} from "@pomodoro/domain";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotCompletedError } from "../../errors/session-not-completed.js";
import { SegmentsAlreadyAttributedError } from "../../errors/segments-already-attributed.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";
import { SegmentTargetForbiddenError } from "../../errors/segment-target-forbidden.js";
import {
  resolveSegmentTarget,
  type SegmentTargetInput,
} from "./resolve-segment-target.js";
import { validateAndVerifySessionOwnership } from "./verify-session-ownership.js";

export interface AttributeSessionDependencies {
  sessionRepository: ISessionRepository;
  learningPathMembershipPort: LearningPathMembershipPort;
  currentUser: CurrentUser;
}

export interface AttributeSessionRequestModel {
  sessionId: UUID;
  target: SegmentTargetInput;
}

export interface AttributeSessionResponseModel {
  segments: Segment[];
}

export const attributeSession = async (
  { sessionRepository, learningPathMembershipPort, currentUser }: AttributeSessionDependencies,
  request: AttributeSessionRequestModel,
): Promise<
  | AttributeSessionResponseModel
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotCompletedError
  | SegmentsAlreadyAttributedError
  | AmbiguousPathTargetError
  | SegmentTargetForbiddenError
> => {
  const session = await validateAndVerifySessionOwnership(
    sessionRepository,
    currentUser,
    request,
  );
  if (
    session instanceof InvalidDataError ||
    session instanceof SessionNotFoundError ||
    session instanceof SessionForbiddenError
  ) {
    return session;
  }
  if (!session.completedAt) {
    return new SessionNotCompletedError(session.id);
  }

  const segments = await sessionRepository.findSegmentsBySessionId(session.id);
  const allLoose = segments.every((segment) => segment.targetKind === "free");
  if (!allLoose) {
    return new SegmentsAlreadyAttributedError(session.id);
  }

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

  const updated = await Promise.all(
    segments.map((segment) =>
      sessionRepository.updateSegment({
        id: segment.id,
        sessionId: segment.sessionId,
        startSec: segment.startSec,
        endSec: segment.endSec,
        ...resolvedTarget,
      }),
    ),
  );

  return { segments: updated };
};
