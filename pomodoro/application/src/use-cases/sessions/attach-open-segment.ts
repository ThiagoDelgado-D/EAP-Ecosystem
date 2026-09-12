import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import type {
  ISessionRepository,
  LearningPathMembershipPort,
  Segment,
} from "@pomodoro/domain";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";
import {
  resolveSegmentTarget,
  type SegmentTargetInput,
} from "./resolve-segment-target.js";
import { verifySessionOwnership } from "./verify-session-ownership.js";

export interface AttachOpenSegmentDependencies {
  sessionRepository: ISessionRepository;
  learningPathMembershipPort: LearningPathMembershipPort;
}

export interface AttachOpenSegmentRequestModel {
  userId: UUID;
  sessionId: UUID;
  target: SegmentTargetInput;
}

export interface AttachOpenSegmentResponseModel {
  segment: Segment;
}

const attachOpenSegmentSchema = createValidationSchema<
  Pick<AttachOpenSegmentRequestModel, "userId" | "sessionId">
>({
  userId: uuidField("UserId", { required: true }),
  sessionId: uuidField("SessionId", { required: true }),
});

export const attachOpenSegment = async (
  { sessionRepository, learningPathMembershipPort }: AttachOpenSegmentDependencies,
  request: AttachOpenSegmentRequestModel,
): Promise<
  | AttachOpenSegmentResponseModel
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
  | NoOpenSegmentError
  | AmbiguousPathTargetError
> => {
  const validationResult = attachOpenSegmentSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const session = await verifySessionOwnership(
    sessionRepository,
    request.sessionId,
    request.userId,
  );
  if (
    session instanceof SessionNotFoundError ||
    session instanceof SessionForbiddenError
  ) {
    return session;
  }
  if (session.completedAt) {
    return new SessionNotActiveError(session.id);
  }

  const openSegment = await sessionRepository.findOpenSegmentBySessionId(
    session.id,
  );
  if (!openSegment) {
    return new NoOpenSegmentError(session.id);
  }

  const resolvedTarget = await resolveSegmentTarget(
    { learningPathMembershipPort },
    request.target,
  );
  if (resolvedTarget instanceof AmbiguousPathTargetError) {
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
