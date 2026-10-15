import {
  DomainNotificationType,
  type ISessionRepository,
  type NotificationPort,
  type Segment,
  type Session,
} from "@pomodoro/domain";

export const MIN_SESSION_DURATION_SEC = 60;

export interface CloseSessionDependencies {
  sessionRepository: ISessionRepository;
  notificationPort: NotificationPort;
}

export type EndSessionResponseModel =
  | { discarded: true }
  | { discarded: false; session: Session; segments: Segment[] };

export const closeSession = async (
  { sessionRepository, notificationPort }: CloseSessionDependencies,
  session: Session,
  openSegment: Segment,
): Promise<EndSessionResponseModel> => {
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
