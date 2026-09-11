import {
  createValidationSchema,
  uuidField,
  ValidationError,
  InvalidDataError,
  type UUID,
} from "domain-lib";
import type { ISessionRepository, Segment, Session } from "@pomodoro/domain";

export interface GetActiveSessionDependencies {
  sessionRepository: ISessionRepository;
}

export interface GetActiveSessionRequestModel {
  userId: UUID;
}

export type GetActiveSessionResponseModel =
  | { session: Session; segments: Segment[] }
  | null;

const getActiveSessionSchema = createValidationSchema<GetActiveSessionRequestModel>({
  userId: uuidField("UserId", { required: true }),
});

export const getActiveSession = async (
  { sessionRepository }: GetActiveSessionDependencies,
  request: GetActiveSessionRequestModel,
): Promise<GetActiveSessionResponseModel | InvalidDataError> => {
  const validationResult = getActiveSessionSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const session = await sessionRepository.findActiveByUserId(
    validationResult.userId,
  );
  if (!session) return null;

  const segments = await sessionRepository.findSegmentsBySessionId(session.id);
  return { session, segments };
};
