import {
  createValidationSchema,
  optionalString,
  positiveNumber,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CryptoService,
  type UUID,
} from "domain-lib";
import type {
  ISessionRepository,
  LearningPathMembershipPort,
  Session,
} from "@pomodoro/domain";
import { SessionAlreadyActiveError } from "../../errors/session-already-active.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";
import {
  resolveSegmentTarget,
  type SegmentTargetInput,
} from "./resolve-segment-target.js";

export interface StartSessionDependencies {
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
  learningPathMembershipPort: LearningPathMembershipPort;
}

export interface StartSessionRequestModel {
  userId: UUID;
  plannedMin: number;
  intent?: string;
  target: SegmentTargetInput;
}

const startSessionSchema = createValidationSchema<
  Pick<StartSessionRequestModel, "userId" | "plannedMin" | "intent">
>({
  userId: uuidField("UserId", { required: true }),
  plannedMin: positiveNumber("PlannedMin", { integer: true }),
  intent: optionalString("Intent", { maxLength: 500 }),
});

export const startSession = async (
  {
    sessionRepository,
    cryptoService,
    learningPathMembershipPort,
  }: StartSessionDependencies,
  request: StartSessionRequestModel,
): Promise<
  | Session
  | InvalidDataError
  | SessionAlreadyActiveError
  | AmbiguousPathTargetError
> => {
  const validationResult = await startSessionSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const validatedData = validationResult;

  const activeSession = await sessionRepository.findActiveByUserId(
    validatedData.userId,
  );
  if (activeSession) {
    return new SessionAlreadyActiveError(activeSession.id);
  }

  const resolvedTarget = await resolveSegmentTarget(
    { learningPathMembershipPort },
    request.target,
  );
  if (resolvedTarget instanceof AmbiguousPathTargetError) {
    return resolvedTarget;
  }

  const sessionId = await cryptoService.generateUUID();
  const now = new Date();

  const session: Session = {
    id: sessionId,
    userId: validatedData.userId,
    startedAt: now,
    intent: validatedData.intent,
    plannedMin: validatedData.plannedMin,
  };
  await sessionRepository.save(session);

  const segmentId = await cryptoService.generateUUID();
  await sessionRepository.saveSegment({
    id: segmentId,
    sessionId,
    startSec: 0,
    ...resolvedTarget,
  });

  return session;
};
