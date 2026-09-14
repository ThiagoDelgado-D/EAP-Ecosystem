import { BaseError, mockCryptoService, type UUID } from "domain-lib";
import type { Break } from "@pomodoro/domain";
import { mockBreakRepository } from "./mock-break-repository.js";
import { mockNotificationPort } from "./mock-notification-port.js";
import { startBreak } from "../use-cases/sessions/start-break.js";

export interface BreakLifecycleFixture {
  cryptoService: ReturnType<typeof mockCryptoService>;
  breakRepository: ReturnType<typeof mockBreakRepository>;
  notificationPort: ReturnType<typeof mockNotificationPort>;
  requestingUserId: UUID;
  startActiveBreak: () => Promise<Break>;
}

export async function createBreakLifecycleFixture(): Promise<BreakLifecycleFixture> {
  const cryptoService = mockCryptoService();
  const breakRepository = mockBreakRepository();
  const notificationPort = mockNotificationPort();
  const requestingUserId = await cryptoService.generateUUID();

  const startActiveBreak = async (): Promise<Break> => {
    const activeBreak = await startBreak(
      { breakRepository, cryptoService, notificationPort },
      { userId: requestingUserId },
    );
    if (activeBreak instanceof BaseError) throw activeBreak;
    return activeBreak;
  };

  return {
    cryptoService,
    breakRepository,
    notificationPort,
    requestingUserId,
    startActiveBreak,
  };
}
