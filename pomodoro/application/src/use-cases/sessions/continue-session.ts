import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type CryptoService,
  type UUID,
} from "domain-lib";
import type { ISessionRepository, Segment, Session } from "@pomodoro/domain";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";
import { SessionNotActiveError } from "../../errors/session-not-active.js";
import { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { verifySessionOwnership } from "./verify-session-ownership.js";
import { segmentToResolvedTarget } from "./resolve-segment-target.js";

export interface ContinueSessionDependencies {
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
}

export interface ContinueSessionRequestModel {
  userId: UUID;
  sessionId: UUID;
}

export interface ContinueSessionResponseModel {
  closedSession: Session;
  session: Session;
  segments: Segment[];
}

const continueSessionSchema = createValidationSchema<ContinueSessionRequestModel>({
  userId: uuidField("UserId", { required: true }),
  sessionId: uuidField("SessionId", { required: true }),
});

export const continueSession = async (
  { sessionRepository, cryptoService }: ContinueSessionDependencies,
  request: ContinueSessionRequestModel,
): Promise<
  | ContinueSessionResponseModel
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
  | NoOpenSegmentError
> => {
  const validationResult = continueSessionSchema(request);
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

  const boundarySec = session.plannedMin * 60;
  const boundaryAt = new Date(
    session.startedAt.getTime() + boundarySec * 1000,
  );

  await sessionRepository.updateSegment({
    ...openSegment,
    endSec: boundarySec,
  });

  const closedSession: Session = {
    ...session,
    completedAt: boundaryAt,
    autoCompleted: false,
  };
  await sessionRepository.update(closedSession);

  const newSessionId = await cryptoService.generateUUID();
  const newSession: Session = {
    id: newSessionId,
    userId: session.userId,
    startedAt: boundaryAt,
    intent: session.intent,
    plannedMin: session.plannedMin,
  };
  await sessionRepository.save(newSession);

  const newSegmentId = await cryptoService.generateUUID();
  const newSegment: Segment = {
    id: newSegmentId,
    sessionId: newSessionId,
    startSec: 0,
    ...segmentToResolvedTarget(openSegment),
  };
  await sessionRepository.saveSegment(newSegment);

  return { closedSession, session: newSession, segments: [newSegment] };
};
