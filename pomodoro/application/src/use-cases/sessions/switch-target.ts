import { BaseError, InvalidDataError, type CryptoService, type CurrentUser, type UUID } from "domain-lib";
import type {
  ISessionRepository,
  LearningPathMembershipPort,
  Segment,
} from "@pomodoro/domain";
import type { SessionNotFoundError } from "../../errors/session-not-found.js";
import type { SessionForbiddenError } from "../../errors/session-forbidden.js";
import type { SessionNotActiveError } from "../../errors/session-not-active.js";
import type { NoOpenSegmentError } from "../../errors/no-open-segment.js";
import { AmbiguousPathTargetError } from "../../errors/ambiguous-path-target.js";
import { SegmentTargetForbiddenError } from "../../errors/segment-target-forbidden.js";
import {
  resolveSegmentTarget,
  type SegmentTargetInput,
} from "./resolve-segment-target.js";
import { validateAndRequireActiveSessionWithOpenSegment } from "./verify-session-ownership.js";

export interface SwitchTargetDependencies {
  sessionRepository: ISessionRepository;
  cryptoService: CryptoService;
  learningPathMembershipPort: LearningPathMembershipPort;
  currentUser: CurrentUser;
}

export interface SwitchTargetRequestModel {
  sessionId: UUID;
  target: SegmentTargetInput;
}

export interface SwitchTargetResponseModel {
  closedSegment: Segment;
  openedSegment: Segment;
}

export const switchTarget = async (
  {
    sessionRepository,
    cryptoService,
    learningPathMembershipPort,
    currentUser,
  }: SwitchTargetDependencies,
  request: SwitchTargetRequestModel,
): Promise<
  | SwitchTargetResponseModel
  | InvalidDataError
  | SessionNotFoundError
  | SessionForbiddenError
  | SessionNotActiveError
  | NoOpenSegmentError
  | AmbiguousPathTargetError
  | SegmentTargetForbiddenError
> => {
  const guard = await validateAndRequireActiveSessionWithOpenSegment(
    sessionRepository,
    currentUser,
    request,
  );
  if (guard instanceof BaseError) return guard;
  const { session, openSegment } = guard;

  const resolvedTarget = await resolveSegmentTarget(
    { learningPathMembershipPort, currentUser },
    request.target,
  );

  if (
    resolvedTarget instanceof AmbiguousPathTargetError ||
    resolvedTarget instanceof SegmentTargetForbiddenError
  ) {
    return resolvedTarget;
  }

  const elapsedSec = Math.floor(
    (Date.now() - session.startedAt.getTime()) / 1000,
  );

  const closedSegment = await sessionRepository.updateSegment({
    ...openSegment,
    endSec: elapsedSec,
  });

  const newSegmentId = await cryptoService.generateUUID();
  const openedSegment = await sessionRepository.saveSegment({
    id: newSegmentId,
    sessionId: session.id,
    startSec: elapsedSec,
    ...resolvedTarget,
  });

  return { closedSegment, openedSegment };
};
