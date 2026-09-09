import type { UUID } from "domain-lib";
import type { ISessionRepository, Session } from "@pomodoro/domain";
import { SessionNotFoundError } from "../../errors/session-not-found.js";
import { SessionForbiddenError } from "../../errors/session-forbidden.js";

export const verifySessionOwnership = async (
  sessionRepository: ISessionRepository,
  sessionId: UUID,
  userId: UUID,
): Promise<Session | SessionNotFoundError | SessionForbiddenError> => {
  const session = await sessionRepository.findById(sessionId);
  if (!session) return new SessionNotFoundError();
  if (session.userId !== userId) return new SessionForbiddenError();
  return session;
};
