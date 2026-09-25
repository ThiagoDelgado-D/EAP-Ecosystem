import {
  createValidationSchema,
  InvalidDataError,
  positiveNumber,
  ValidationError,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import { SegmentTargetKind, type ISessionRepository } from "@pomodoro/domain";

export const DEFAULT_MOMENTUM_WINDOW_DAYS = 7;

export interface GetPathMomentumDependencies {
  sessionRepository: ISessionRepository;
  currentUser: CurrentUser;
}

export interface GetPathMomentumRequestModel {
  days?: number;
}

export interface PathMomentumResponseModel {
  learningPathId: UUID;
  totalSeconds: number;
}

const getPathMomentumSchema = createValidationSchema<
  Pick<GetPathMomentumRequestModel, "days">
>({
  days: positiveNumber("Days", { integer: true, required: false }),
});

export const getPathMomentum = async (
  { sessionRepository, currentUser }: GetPathMomentumDependencies,
  request: GetPathMomentumRequestModel,
): Promise<PathMomentumResponseModel[] | InvalidDataError> => {
  const validationResult = getPathMomentumSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { days } = validationResult;

  const since = new Date(
    Date.now() - (days ?? DEFAULT_MOMENTUM_WINDOW_DAYS) * 24 * 60 * 60 * 1000,
  );

  const segments = await sessionRepository.findSegmentsByUserIdBetween(
    currentUser.id,
    since,
  );

  const totals = new Map<UUID, number>();

  for (const segment of segments) {
    if (segment.targetKind !== SegmentTargetKind.NODE) continue;
    if (segment.endSec === undefined) continue;
    const duration = segment.endSec - segment.startSec;
    totals.set(
      segment.learningPathId,
      (totals.get(segment.learningPathId) ?? 0) + duration,
    );
  }

  return [...totals.entries()]
    .map(([learningPathId, totalSeconds]) => ({ learningPathId, totalSeconds }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
};
