import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CurrentUser,
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
  currentUser: CurrentUser,
): Promise<Session | SessionNotFoundError | SessionForbiddenError> => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) return new SessionNotFoundError();
  if (session.userId !== currentUser.id) return new SessionForbiddenError();
  return session;
};

const sessionIdentitySchema = createValidationSchema<{
  sessionId: UUID;
}>({
  sessionId: uuidField("SessionId", { required: true }),
});

export const validateAndVerifySessionOwnership = async (
  sessionRepository: ISessionRepository,
  currentUser: CurrentUser,
  request: { sessionId: UUID },
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
    currentUser,
  );
};

export const requireActiveSessionWithOpenSegment = async (
  sessionRepository: ISessionRepository,
  sessionId: UUID,
  currentUser: CurrentUser,
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
    currentUser,
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
  currentUser: CurrentUser,
  request: { sessionId: UUID },
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
    currentUser,
  );
};
