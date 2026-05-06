import type { ISessionRepository } from "@user/domain";

export interface RevokeAllOtherSessionsDependencies {
  sessionRepository: ISessionRepository;
}

export interface RevokeAllOtherSessionsRequest {
  userId: string;
  /** ID of the current session to preserve. */
  currentSessionId: string;
}

export const revokeAllOtherSessions = async (
  { sessionRepository }: RevokeAllOtherSessionsDependencies,
  request: RevokeAllOtherSessionsRequest,
): Promise<void> => {
  await sessionRepository.revokeAllByUserIdExcept(
    request.userId,
    request.currentSessionId,
  );
};
