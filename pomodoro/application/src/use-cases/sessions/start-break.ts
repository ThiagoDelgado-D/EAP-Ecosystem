import {
  DomainNotificationType,
  type Break,
  type IBreakRepository,
  type ISessionRepository,
  type NotificationPort,
} from "@pomodoro/domain";
import { type CryptoService, type CurrentUser } from "domain-lib";
import { BreakAlreadyActiveError } from "../../errors/break-already-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { closeSession } from "./close-session.js";

export const DEFAULT_BREAK_DURATION_SEC = 300;

export interface StartBreakDependencies {
  breakRepository: IBreakRepository;
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
  notificationPort: NotificationPort;
  currentUser: CurrentUser;
}

export const startBreak = async ({
  breakRepository,
  sessionRepository,
  cryptoService,
  notificationPort,
  currentUser,
}: StartBreakDependencies): Promise<
  Break | BreakAlreadyActiveError | NoOpenSegmentError
> => {
  const { id: userId } = currentUser;

  const activeBreak = await breakRepository.findActiveByUserId(userId);
  if (activeBreak) {
    return new BreakAlreadyActiveError(activeBreak.id);
  }

  const activeSession = await sessionRepository.findActiveByUserId(userId);
  if (activeSession) {
    const openSegment = await sessionRepository.findOpenSegmentBySessionId(
      activeSession.id,
    );
    if (!openSegment) {
      return new NoOpenSegmentError(activeSession.id);
    }
    await closeSession({ sessionRepository, notificationPort }, activeSession, openSegment);
  }

  const breakId = await cryptoService.generateUUID();
  const now = new Date();

  const newBreak: Break = {
    id: breakId,
    userId,
    startedAt: now,
    durationSec: DEFAULT_BREAK_DURATION_SEC,
  };
  await breakRepository.save(newBreak);

  const minutes = Math.round(DEFAULT_BREAK_DURATION_SEC / 60);
  await notificationPort.notify({
    type: DomainNotificationType.BREAK_STARTED,
    title: "Break started",
    body: `Take a ${minutes} min break.`,
    occurredAt: now,
  });

  return newBreak;
};
