import {
  createValidationSchema,
  InvalidDataError,
  positiveNumber,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { SegmentTargetKind, type ISessionRepository } from "@pomodoro/domain";

export const DEFAULT_MOMENTUM_WINDOW_DAYS = 7;

export interface GetPathMomentumDependencies {
  sessionRepository: ISessionRepository;
}

export interface GetPathMomentumRequestModel {
  userId: UUID;
  days?: number;
}

export interface PathMomentumResponseModel {
  learningPathId: UUID;
  totalSeconds: number;
}

const getPathMomentumSchema = createValidationSchema<
  Pick<GetPathMomentumRequestModel, "userId" | "days">
>({
  userId: uuidField("UserId", { required: true }),
  days: positiveNumber("Days", { integer: true, required: false }),
});

export const getPathMomentum = async (
  { sessionRepository }: GetPathMomentumDependencies,
  request: GetPathMomentumRequestModel,
): Promise<PathMomentumResponseModel[] | InvalidDataError> => {
  const validationResult = getPathMomentumSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { userId, days } = validationResult;

  const since = new Date(
    Date.now() - (days ?? DEFAULT_MOMENTUM_WINDOW_DAYS) * 24 * 60 * 60 * 1000,
  );

  const segments = await sessionRepository.findSegmentsByUserIdSince(
    userId,
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
