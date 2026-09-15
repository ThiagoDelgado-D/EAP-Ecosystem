import {
  createValidationSchema,
  dateField,
  optionalDate,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import type { ISessionRepository, Segment, Session } from "@pomodoro/domain";

export interface GetSessionHistoryDependencies {
  sessionRepository: ISessionRepository;
}

export interface GetSessionHistoryRequestModel {
  userId: UUID;
  since: Date;
  until?: Date;
}

export interface SessionHistoryResponseModel {
  sessions: Session[];
  segments: Segment[];
}

const getSessionHistorySchema =
  createValidationSchema<GetSessionHistoryRequestModel>({
    userId: uuidField("UserId", { required: true }),
    since: dateField("Since", { required: true }),
    until: optionalDate("Until"),
  });

export const getSessionHistory = async (
  { sessionRepository }: GetSessionHistoryDependencies,
  request: GetSessionHistoryRequestModel,
): Promise<SessionHistoryResponseModel | InvalidDataError> => {
  const validationResult = getSessionHistorySchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const { userId, since, until } = validationResult;

  const [sessions, segments] = await Promise.all([
    sessionRepository.findByUserIdBetween(userId, since, until),
    sessionRepository.findSegmentsByUserIdBetween(userId, since, until),
  ]);

  return { sessions, segments };
};
