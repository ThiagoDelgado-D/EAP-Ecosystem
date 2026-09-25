import type { CurrentUser, UUID } from "domain-lib";
import {
  SegmentTargetKind,
  type ISessionRepository,
  type NodeSegment,
} from "@pomodoro/domain";

export interface GetLastSessionTargetDependencies {
  sessionRepository: ISessionRepository;
  currentUser: CurrentUser;
}

export interface LastSessionTargetResponseModel {
  learningPathId: UUID;
  learningPathNodeId: UUID;
  resourceId?: UUID;
}

export const getLastSessionTarget = async (
  { sessionRepository, currentUser }: GetLastSessionTargetDependencies,
): Promise<LastSessionTargetResponseModel | null> => {
  const lastSession = await sessionRepository.findMostRecentByUserId(currentUser.id);
  if (!lastSession) return null;

  const segments = await sessionRepository.findSegmentsBySessionId(
    lastSession.id,
  );

  const nodeSegment = segments.find(
    (segment): segment is NodeSegment =>
      segment.targetKind === SegmentTargetKind.NODE,
  );

  if (!nodeSegment) return null;

  return {
    learningPathId: nodeSegment.learningPathId,
    learningPathNodeId: nodeSegment.learningPathNodeId,
    resourceId: nodeSegment.resourceId,
  };
};
