import {
  BaseError,
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import {
  DomainNotificationType,
  type ISessionRepository,
  type NotificationPort,
  type Segment,
  type Session,
} from "@pomodoro/domain";
import type { SessionNotFoundError } from "../../errors/session-not-found.js";
import type { SessionForbiddenError } from "../../errors/session-forbidden.js";
import type { SessionNotActiveError } from "../../errors/session-not-active.js";
import type { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { requireActiveSessionWithOpenSegment } from "./verify-session-ownership.js";

export const MIN_SESSION_DURATION_SEC = 60;

export interface EndSessionDependencies {
  sessionRepository: ISessionRepository;
  notificationPort: NotificationPort;
  currentUser: CurrentUser;
}

export interface EndSessionRequestModel {
  sessionId: UUID;
}

export type EndSessionResponseModel =
  | { discarded: true }
  | { discarded: false; session: Session; segments: Segment[] };

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
    return new InvalidDataError(validationResult.errors);
  }

  const guard = await requireActiveSessionWithOpenSegment(
    sessionRepository,
    validationResult.sessionId,
    currentUser,
  );
  if (guard instanceof BaseError) return guard;
  const { session, openSegment } = guard;

  const now = new Date();
  const boundaryAt = new Date(
    session.startedAt.getTime() + session.plannedMin * 60 * 1000,
  );
  const completedAt = now > boundaryAt ? boundaryAt : now;
  const elapsedSec = Math.floor(
    (completedAt.getTime() - session.startedAt.getTime()) / 1000,
  );

  await sessionRepository.updateSegment({
    ...openSegment,
    endSec: elapsedSec,
  });

  if (elapsedSec < MIN_SESSION_DURATION_SEC) {
    await sessionRepository.delete(session.id);
    return { discarded: true };
  }

  const completedSession: Session = { ...session, completedAt };
  await sessionRepository.update(completedSession);

  const segments = await sessionRepository.findSegmentsBySessionId(session.id);

  const minutes = Math.round(elapsedSec / 60);
  await notificationPort.notify({
    type: DomainNotificationType.SESSION_COMPLETED,
    title: "Focus session complete",
    body: `You focused for ${minutes} min.`,
    occurredAt: completedAt,
  });

  return { discarded: false, session: completedSession, segments };
};
