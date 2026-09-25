import type { CurrentUser } from "domain-lib";
import {
  DomainNotificationType,
  type ISessionRepository,
  type NotificationPort,
  type Segment,
  type Session,
} from "@pomodoro/domain";

export interface GetActiveSessionDependencies {
  sessionRepository: ISessionRepository;
  notificationPort: NotificationPort;
  currentUser: CurrentUser;
}

export interface ActiveSessionResult {
  session: Session;
  segments: Segment[];
}

export interface AutoClosedSessionResult {
  autoClosed: true;
  session: Session;
  segments: Segment[];
}

export type GetActiveSessionResponseModel =
  | ActiveSessionResult
  | AutoClosedSessionResult;

export const getActiveSession = async (
  { sessionRepository, notificationPort, currentUser }: GetActiveSessionDependencies,
): Promise<GetActiveSessionResponseModel | null> => {
  const session = await sessionRepository.findActiveByUserId(currentUser.id);
  if (!session) return null;

  const boundarySec = session.plannedMin * 60;
  const boundaryAt = new Date(
    session.startedAt.getTime() + boundarySec * 1000,
  );

  if (new Date() <= boundaryAt) {
    const segments = await sessionRepository.findSegmentsBySessionId(
      session.id,
    );
    return { session, segments };
  }

  const openSegment = await sessionRepository.findOpenSegmentBySessionId(
    session.id,
  );
  if (openSegment) {
    await sessionRepository.updateSegment({
      ...openSegment,
      endSec: boundarySec,
    });
  }

  const closedSession: Session = {
    ...session,
    completedAt: boundaryAt,
    autoCompleted: true,
  };
  await sessionRepository.update(closedSession);

  const segments = await sessionRepository.findSegmentsBySessionId(
    session.id,
  );

  await notificationPort.notify({
    type: DomainNotificationType.SESSION_COMPLETED,
    title: "Focus session auto-completed",
    body: `Session reached its planned ${session.plannedMin} min with no response and was closed automatically.`,
    occurredAt: boundaryAt,
  });

  return { autoClosed: true, session: closedSession, segments };
};
