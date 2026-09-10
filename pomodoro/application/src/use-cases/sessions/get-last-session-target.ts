import {
  createValidationSchema,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import {
  SegmentTargetKind,
  type ISessionRepository,
  type NodeSegment,
} from "@pomodoro/domain";

export interface GetLastSessionTargetDependencies {
  sessionRepository: ISessionRepository;
}

export interface GetLastSessionTargetRequestModel {
  userId: UUID;
}

export interface LastSessionTargetResponseModel {
  learningPathId: UUID;
  learningPathNodeId: UUID;
  resourceId?: UUID;
}

const getLastSessionTargetSchema =
  createValidationSchema<GetLastSessionTargetRequestModel>({
    userId: uuidField("UserId", { required: true }),
  });

export const getLastSessionTarget = async (
  { sessionRepository }: GetLastSessionTargetDependencies,
  request: GetLastSessionTargetRequestModel,
): Promise<LastSessionTargetResponseModel | null | InvalidDataError> => {
  const validationResult = getLastSessionTargetSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const { userId } = validationResult;

  const lastSession = await sessionRepository.findMostRecentByUserId(userId);
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
