import type { ISessionRepository } from "@user/domain";
import {
  createValidationSchema,
  uuidField,
  ForbiddenError,
  InvalidDataError,
  ValidationError,
} from "domain-lib";
import { SessionNotFoundError } from "../../errors/session-not-found.js";

export interface RevokeSessionDependencies {
  sessionRepository: ISessionRepository;
}

export interface RevokeSessionRequest {
  userId: string;
  sessionId: string;
}

const revokeSessionSchema = createValidationSchema<Pick<RevokeSessionRequest, "sessionId">>({
  sessionId: uuidField("SessionId", { required: true }),
});

export const revokeSession = async (
  { sessionRepository }: RevokeSessionDependencies,
  request: RevokeSessionRequest,
): Promise<void | InvalidDataError | SessionNotFoundError | ForbiddenError> => {
  const validationResult = revokeSessionSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const session = await sessionRepository.findById(validationResult.sessionId);

  if (!session) return new SessionNotFoundError();
  if (session.userId !== request.userId) return new ForbiddenError();

  await sessionRepository.revoke(validationResult.sessionId);
};
