import {
  createValidationSchema,
  positiveNumber,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import type { ISessionRepository, Session } from "@pomodoro/domain";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { verifySessionOwnership } from "./verify-session-ownership.js";

export const MAX_PLANNED_DURATION_MIN = 480;

export interface ExtendSessionDependencies {
  sessionRepository: ISessionRepository;
  currentUser: CurrentUser;
}

export interface ExtendSessionRequestModel {
  sessionId: UUID;
  minutes: number;
}

const extendSessionSchema = createValidationSchema<ExtendSessionRequestModel>({
  sessionId: uuidField("SessionId", { required: true }),
  minutes: positiveNumber("Minutes", { integer: true }),
});

export const extendSession = async (
  { sessionRepository, currentUser }: ExtendSessionDependencies,
  request: ExtendSessionRequestModel,
): Promise<
  | Session
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
> => {
  const validationResult = extendSessionSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const validatedData = validationResult;

  const session = await verifySessionOwnership(
    sessionRepository,
    validatedData.sessionId,
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

  const extended: Session = {
    ...session,
    plannedMin: Math.min(
      MAX_PLANNED_DURATION_MIN,
      session.plannedMin + validatedData.minutes,
    ),
  };
  await sessionRepository.update(extended);

  return extended;
};
