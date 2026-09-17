import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import type { ISessionRepository, Segment, Session } from "@pomodoro/domain";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";

export const verifySessionOwnership = async (
  sessionRepository: ISessionRepository,
  sessionId: UUID,
  userId: UUID,
): Promise<Session | SessionNotFoundError | SessionForbiddenError> => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) return new SessionNotFoundError();
  if (session.userId !== userId) return new SessionForbiddenError();
  return session;
};

const sessionIdentitySchema = createValidationSchema<{
  userId: UUID;
  sessionId: UUID;
}>({
  userId: uuidField("UserId", { required: true }),
  sessionId: uuidField("SessionId", { required: true }),
});

export const validateAndVerifySessionOwnership = async (
  sessionRepository: ISessionRepository,
  request: { userId: UUID; sessionId: UUID },
): Promise<
  Session | InvalidDataError | SessionNotFoundError | SessionForbiddenError
> => {
  const validationResult = sessionIdentitySchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  return verifySessionOwnership(
    sessionRepository,
    validationResult.sessionId,
    validationResult.userId,
  );
};

export const requireActiveSessionWithOpenSegment = async (
  sessionRepository: ISessionRepository,
  sessionId: UUID,
  userId: UUID,
): Promise<
  | { session: Session; openSegment: Segment }
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
  | NoOpenSegmentError
> => {
  const session = await verifySessionOwnership(
    sessionRepository,
    sessionId,
    userId,
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

  return { session, openSegment };
};

export const validateAndRequireActiveSessionWithOpenSegment = async (
  sessionRepository: ISessionRepository,
  request: { userId: UUID; sessionId: UUID },
): Promise<
  | { session: Session; openSegment: Segment }
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
  | NoOpenSegmentError
> => {
  const validationResult = sessionIdentitySchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  return requireActiveSessionWithOpenSegment(
    sessionRepository,
    validationResult.sessionId,
    validationResult.userId,
  );
};
