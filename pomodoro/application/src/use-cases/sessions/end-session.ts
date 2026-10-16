import {
  BaseError,
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import type { ISessionRepository, NotificationPort } from "@pomodoro/domain";
import type { SessionNotFoundError } from "../../errors/session-not-found.js";
import type { SessionForbiddenError } from "../../errors/session-forbidden.js";
import type { SessionNotActiveError } from "../../errors/session-not-active.js";
import type { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { requireActiveSessionWithOpenSegment } from "./verify-session-ownership.js";
import { closeSession, type EndSessionResponseModel } from "./close-session.js";

export { MIN_SESSION_DURATION_SEC, type EndSessionResponseModel } from "./close-session.js";

export interface EndSessionDependencies {
  sessionRepository: ISessionRepository;
  notificationPort: NotificationPort;
  currentUser: CurrentUser;
}

export interface EndSessionRequestModel {
  sessionId: UUID;
}

const endSessionSchema = createValidationSchema<EndSessionRequestModel>({
  sessionId: uuidField("SessionId", { required: true }),
});

export const endSession = async (
  { sessionRepository, notificationPort, currentUser }: EndSessionDependencies,
  request: EndSessionRequestModel,
): Promise<
  | EndSessionResponseModel
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
  | NoOpenSegmentError
> => {
  const validationResult = endSessionSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.context.fields);
  }

  const guard = await requireActiveSessionWithOpenSegment(
    sessionRepository,
    validationResult.sessionId,
    currentUser,
  );
  if (guard instanceof BaseError) return guard;
  const { session, openSegment } = guard;

  return closeSession({ sessionRepository, notificationPort }, session, openSegment);
};
