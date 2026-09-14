import {
  DomainNotificationType,
  type Break,
  type IBreakRepository,
  type NotificationPort,
} from "@pomodoro/domain";
import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CryptoService,
  type UUID,
} from "domain-lib";
import { BreakAlreadyActiveError } from "../../errors/break-already-active.js";
import { DEFAULT_BREAK_DURATION_SEC } from "./start-break.js";

export interface StartBreakPersistedDependencies {
  breakRepository: IBreakRepository;
  cryptoService: CryptoService;
  notificationPort: NotificationPort;
}

export interface StartBreakPersistedRequestModel {
  userId: UUID;
}

const startBreakPersistedSchema =
  createValidationSchema<StartBreakPersistedRequestModel>({
    userId: uuidField("UserId", { required: true }),
  });

export const startBreakPersisted = async (
  {
    breakRepository,
    cryptoService,
    notificationPort,
  }: StartBreakPersistedDependencies,
  request: StartBreakPersistedRequestModel,
): Promise<Break | InvalidDataError | BreakAlreadyActiveError> => {
  const validationResult = startBreakPersistedSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId } = validationResult;

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
