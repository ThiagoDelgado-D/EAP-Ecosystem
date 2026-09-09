import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import {
  DomainNotificationType,
  type ISessionRepository,
  type NotificationPort,
  type Segment,
  type Session,
} from "@pomodoro/domain";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { verifySessionOwnership } from "./verify-session-ownership.js";

export const MIN_SESSION_DURATION_SEC = 60;

export interface EndSessionDependencies {
  sessionRepository: ISessionRepository;
  notificationPort: NotificationPort;
}

export interface EndSessionRequestModel {
  userId: UUID;
  sessionId: UUID;
}

export type EndSessionResponseModel =
  | { discarded: true }
  | { discarded: false; session: Session; segments: Segment[] };

const endSessionSchema = createValidationSchema<EndSessionRequestModel>({
  userId: uuidField("UserId", { required: true }),
  sessionId: uuidField("SessionId", { required: true }),
});

export const endSession = async (
  { sessionRepository, notificationPort }: EndSessionDependencies,
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

  const openSegment = await sessionRepository.findOpenSegmentBySessionId(
    session.id,
  );

  if (!openSegment) {
    return new NoOpenSegmentError(session.id);
  }

  const now = new Date();
  const elapsedSec = Math.floor(
    (now.getTime() - session.startedAt.getTime()) / 1000,
  );

  await sessionRepository.updateSegment({
    ...openSegment,
    endSec: elapsedSec,
  });

  if (elapsedSec < MIN_SESSION_DURATION_SEC) {
    await sessionRepository.delete(session.id);
    return { discarded: true };
  }

  const completedSession: Session = { ...session, completedAt: now };
  await sessionRepository.update(completedSession);

  const segments = await sessionRepository.findSegmentsBySessionId(session.id);

  const minutes = Math.round(elapsedSec / 60);
  await notificationPort.notify({
    type: DomainNotificationType.SESSION_COMPLETED,
    title: "Focus session complete",
    body: `You focused for ${minutes} min.`,
    occurredAt: now,
  });

  return { discarded: false, session: completedSession, segments };
};
