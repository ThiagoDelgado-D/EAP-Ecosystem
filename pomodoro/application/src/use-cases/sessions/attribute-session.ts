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
import { SessionNotCompletedError } from "../../errors/session-not-completed.js";
import { SegmentsAlreadyAttributedError } from "../../errors/segments-already-attributed.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";
import {
  resolveSegmentTarget,
  type SegmentTargetInput,
} from "./resolve-segment-target.js";
import { verifySessionOwnership } from "./verify-session-ownership.js";

export interface AttributeSessionDependencies {
  sessionRepository: ISessionRepository;
  learningPathMembershipPort: LearningPathMembershipPort;
}

export interface AttributeSessionRequestModel {
  userId: UUID;
  sessionId: UUID;
  target: SegmentTargetInput;
}

export interface AttributeSessionResponseModel {
  segments: Segment[];
}

const attributeSessionSchema = createValidationSchema<
  Pick<AttributeSessionRequestModel, "userId" | "sessionId">
>({
  userId: uuidField("UserId", { required: true }),
  sessionId: uuidField("SessionId", { required: true }),
});

export const attributeSession = async (
  { sessionRepository, learningPathMembershipPort }: AttributeSessionDependencies,
  request: AttributeSessionRequestModel,
): Promise<
  | AttributeSessionResponseModel
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotCompletedError
  | SegmentsAlreadyAttributedError
  | AmbiguousPathTargetError
> => {
  const validationResult = attributeSessionSchema(request);
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
  if (!session.completedAt) {
    return new SessionNotCompletedError(session.id);
  }

  const segments = await sessionRepository.findSegmentsBySessionId(session.id);
  const allLoose = segments.every((segment) => segment.targetKind === "free");
  if (!allLoose) {
    return new SegmentsAlreadyAttributedError(session.id);
  }

  const resolvedTarget = await resolveSegmentTarget(
    { learningPathMembershipPort },
    request.target,
  );
  if (resolvedTarget instanceof AmbiguousPathTargetError) {
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
