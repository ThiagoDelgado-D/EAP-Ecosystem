import {
  createValidationSchema,
  dateField,
  optionalDate,
  ValidationError,
  InvalidDataError,
  type CurrentUser,
} from "domain-lib";
import type { ISessionRepository, Segment, Session } from "@pomodoro/domain";

export interface GetSessionHistoryDependencies {
  sessionRepository: ISessionRepository;
  currentUser: CurrentUser;
}

export interface GetSessionHistoryRequestModel {
  since: Date;
  until?: Date;
}

export interface SessionHistoryResponseModel {
  sessions: Session[];
  segments: Segment[];
}

const getSessionHistorySchema =
  createValidationSchema<GetSessionHistoryRequestModel>({
    since: dateField("Since", { required: true }),
    until: optionalDate("Until"),
  });

export const getSessionHistory = async (
  { sessionRepository, currentUser }: GetSessionHistoryDependencies,
  request: GetSessionHistoryRequestModel,
): Promise<SessionHistoryResponseModel | InvalidDataError> => {
  const validationResult = getSessionHistorySchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }
  const { since, until } = validationResult;

  const [sessions, segments] = await Promise.all([
    sessionRepository.findByUserIdBetween(currentUser.id, since, until),
    sessionRepository.findSegmentsByUserIdBetween(currentUser.id, since, until),
  ]);

  return { sessions, segments };
};
