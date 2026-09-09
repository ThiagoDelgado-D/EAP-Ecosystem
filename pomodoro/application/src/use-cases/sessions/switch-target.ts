import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CryptoService,
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

export interface SwitchTargetDependencies {
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
  learningPathMembershipPort: LearningPathMembershipPort;
}

export interface SwitchTargetRequestModel {
  userId: UUID;
  sessionId: UUID;
  target: SegmentTargetInput;
}

export interface SwitchTargetResponseModel {
  closedSegment: Segment;
  openedSegment: Segment;
}

const switchTargetSchema = createValidationSchema<
  Pick<SwitchTargetRequestModel, "userId" | "sessionId">
>({
  userId: uuidField("UserId", { required: true }),
  sessionId: uuidField("SessionId", { required: true }),
});

export const switchTarget = async (
  {
    sessionRepository,
    cryptoService,
    learningPathMembershipPort,
  }: SwitchTargetDependencies,
  request: SwitchTargetRequestModel,
): Promise<
  | SwitchTargetResponseModel
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
  | NoOpenSegmentError
  | AmbiguousPathTargetError
> => {
  const validationResult = switchTargetSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const validatedData = validationResult;

  const session = await verifySessionOwnership(
    sessionRepository,
    validatedData.sessionId,
    validatedData.userId,
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

  const resolvedTarget = await resolveSegmentTarget(
    { learningPathMembershipPort },
    request.target,
  );

  if (resolvedTarget instanceof AmbiguousPathTargetError) {
    return resolvedTarget;
  }

  const openSegment = await sessionRepository.findOpenSegmentBySessionId(
    session.id,
  );
  if (!openSegment) {
    return new NoOpenSegmentError(session.id);
  }

  const elapsedSec = Math.floor(
    (Date.now() - session.startedAt.getTime()) / 1000,
  );

  const closedSegment = await sessionRepository.updateSegment({
    ...openSegment,
    endSec: elapsedSec,
  });

  const newSegmentId = await cryptoService.generateUUID();
  const openedSegment = await sessionRepository.saveSegment({
    id: newSegmentId,
    sessionId: session.id,
    startSec: elapsedSec,
    ...resolvedTarget,
  });

  return { closedSegment, openedSegment };
};
