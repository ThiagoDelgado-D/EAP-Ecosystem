import {
  DomainNotificationType,
  type Break,
  type IBreakRepository,
  type NotificationPort,
} from "@pomodoro/domain";
import { type CryptoService, type CurrentUser } from "domain-lib";
import { BreakAlreadyActiveError } from "../../errors/break-already-active.js";

export const DEFAULT_BREAK_DURATION_SEC = 300;

export interface StartBreakDependencies {
  breakRepository: IBreakRepository;
  cryptoService: CryptoService;
  notificationPort: NotificationPort;
  currentUser: CurrentUser;
}

export const startBreak = async (
  { breakRepository, cryptoService, notificationPort, currentUser }: StartBreakDependencies,
): Promise<Break | BreakAlreadyActiveError> => {
  const { id: userId } = currentUser;

  const activeBreak = await breakRepository.findActiveByUserId(userId);
  if (activeBreak) {
    return new BreakAlreadyActiveError(activeBreak.id);
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
