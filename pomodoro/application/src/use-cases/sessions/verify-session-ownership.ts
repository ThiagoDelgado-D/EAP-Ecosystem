import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import type { ISessionRepository, Session } from "@pomodoro/domain";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";

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
