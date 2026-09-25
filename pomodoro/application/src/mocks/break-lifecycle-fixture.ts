import { BaseError, mockCryptoService, mockCurrentUser, type CurrentUser, type UUID } from "domain-lib";
import type { Break } from "@pomodoro/domain";
import { mockBreakRepository } from "./mock-break-repository.js";
import { mockSessionRepository } from "./mock-session-repository.js";
import { mockNotificationPort } from "./mock-notification-port.js";
import { startBreak } from "../use-cases/sessions/start-break.js";

export interface BreakLifecycleFixture {
  cryptoService: ReturnType<typeof mockCryptoService>;
  breakRepository: ReturnType<typeof mockBreakRepository>;
  sessionRepository: ReturnType<typeof mockSessionRepository>;
  notificationPort: ReturnType<typeof mockNotificationPort>;
  currentUser: CurrentUser;
  requestingUserId: UUID;
  startActiveBreak: () => Promise<Break>;
}

export async function createBreakLifecycleFixture(): Promise<BreakLifecycleFixture> {
  const cryptoService = mockCryptoService();
  const breakRepository = mockBreakRepository();
  const sessionRepository = mockSessionRepository();
  const notificationPort = mockNotificationPort();
  const currentUser = await mockCurrentUser(cryptoService);
  const requestingUserId = currentUser.id;

  const startActiveBreak = async (): Promise<Break> => {
    const activeBreak = await startBreak(
      { breakRepository, sessionRepository, cryptoService, notificationPort, currentUser },
    );
    if (activeBreak instanceof BaseError) throw activeBreak;
    return activeBreak;
  };

  return {
    cryptoService,
    breakRepository,
    sessionRepository,
    notificationPort,
    currentUser,
    requestingUserId,
    startActiveBreak,
  };
}
