import type { ISessionRepository } from "@user/domain";
import { ForbiddenError } from "domain-lib";
import { SessionNotFoundError } from "../../errors/session-not-found.js";

export interface RevokeSessionDependencies {
  sessionRepository: ISessionRepository;
}

export interface RevokeSessionRequest {
  userId: string;
  sessionId: string;
}

export const revokeSession = async (
  { sessionRepository }: RevokeSessionDependencies,
  request: RevokeSessionRequest,
): Promise<void | SessionNotFoundError | ForbiddenError> => {
  const session = await sessionRepository.findById(request.sessionId);

  if (!session) return new SessionNotFoundError();
  if (session.userId !== request.userId) return new ForbiddenError();

  await sessionRepository.revoke(request.sessionId);
};
