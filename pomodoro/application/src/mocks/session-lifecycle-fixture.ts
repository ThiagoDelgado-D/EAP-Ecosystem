import { BaseError, mockCryptoService, mockCurrentUser, type CurrentUser, type UUID } from "domain-lib";
import { SegmentTargetKind, type LearningPathMembership, type Session } from "@pomodoro/domain";
import { mockLearningPathMembershipPort } from "./mock-learning-path-membership-port.js";
import { mockSessionRepository } from "./mock-session-repository.js";
import { startSession } from "../use-cases/sessions/start-session.js";

export interface SessionLifecycleFixture {
  cryptoService: ReturnType<typeof mockCryptoService>;
  sessionRepository: ReturnType<typeof mockSessionRepository>;
  membershipPort: ReturnType<typeof mockLearningPathMembershipPort>;
  currentUser: CurrentUser;
  requestingUserId: UUID;
  cleanArchitectureResourceId: UUID;
  startFreeSession: () => Promise<Session>;
}

export async function createSessionLifecycleFixture(): Promise<SessionLifecycleFixture> {
  const cryptoService = mockCryptoService();
  const sessionRepository = mockSessionRepository();
  const currentUser = await mockCurrentUser(cryptoService);
  const requestingUserId = currentUser.id;
  const cleanArchitectureResourceId = await cryptoService.generateUUID();

  const pathsSharingCleanArchitecture: LearningPathMembership[] = [
    {
      pathId: await cryptoService.generateUUID(),
      pathTitle: "Frontend Architecture Mastery",
      nodeId: await cryptoService.generateUUID(),
    },
    {
      pathId: await cryptoService.generateUUID(),
      pathTitle: "System Design Prep",
      nodeId: await cryptoService.generateUUID(),
    },
  ];
  const membershipPort = mockLearningPathMembershipPort({
    [cleanArchitectureResourceId]: pathsSharingCleanArchitecture,
  });

  const startFreeSession = async (): Promise<Session> => {
    const session = await startSession(
      { sessionRepository, cryptoService, learningPathMembershipPort: membershipPort, currentUser },
      { plannedMin: 25, target: { kind: SegmentTargetKind.FREE } },
    );
    if (session instanceof BaseError) throw session;
    return session;
  };

  return {
    cryptoService,
    sessionRepository,
    membershipPort,
    currentUser,
    requestingUserId,
    cleanArchitectureResourceId,
    startFreeSession,
  };
}
