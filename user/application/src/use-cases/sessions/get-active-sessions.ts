import type { ISessionRepository, Session } from "@user/domain";

export interface GetActiveSessionsDependencies {
  sessionRepository: ISessionRepository;
}

export interface GetActiveSessionsRequest {
  userId: string;
}

export interface GetActiveSessionsResponse {
  sessions: Pick<
    Session,
    "id" | "userAgent" | "ipAddress" | "createdAt" | "expiresAt"
  >[];
}

export const getActiveSessions = async (
  { sessionRepository }: GetActiveSessionsDependencies,
  request: GetActiveSessionsRequest,
): Promise<GetActiveSessionsResponse> => {
  const sessions = await sessionRepository.findActiveByUserId(request.userId);

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })),
  };
};
