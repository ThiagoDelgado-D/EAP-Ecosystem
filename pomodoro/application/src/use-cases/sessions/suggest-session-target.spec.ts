import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import { CandidateNodeEnergyLevel, CandidateNodeProgress } from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import {
  mockCandidateNodesPort,
  mockSessionRepository,
} from "../../mocks/index.js";
import { suggestSessionTarget } from "./suggest-session-target.js";

describe("suggestSessionTarget", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let sessionRepository: ReturnType<typeof mockSessionRepository>;
  let candidateNodesPort: ReturnType<typeof mockCandidateNodesPort>;
  let requestingUserId: UUID;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    sessionRepository = mockSessionRepository();
    candidateNodesPort = mockCandidateNodesPort();
    requestingUserId = await cryptoService.generateUUID();
  });

  const deps = () => ({ sessionRepository, candidateNodesPort });

  test("Should return an empty array when the user has no candidates", async () => {
    const result = await suggestSessionTarget(deps(), {
      userId: requestingUserId,
    });
    expect(result).toEqual([]);
  });

  test("Should combine the candidate port, last session, and momentum into a scored list", async () => {
    const pathId = await cryptoService.generateUUID();
    const nodeId = await cryptoService.generateUUID();
    candidateNodesPort.nodesByUser[requestingUserId] = [
      {
        pathId,
        pathTitle: "Backend Fundamentals",
        nodeId,
        nodeTitle: "Hexagonal Architecture",
        progress: CandidateNodeProgress.PENDING,
        prerequisitesDone: true,
      },
    ];

    const sessionId = await cryptoService.generateUUID();
    sessionRepository.sessions.push({
      id: sessionId,
      userId: requestingUserId,
      startedAt: new Date(Date.now() - 3600 * 1000),
      completedAt: new Date(),
      plannedMin: 25,
    });
    sessionRepository.segments.push({
      id: await cryptoService.generateUUID(),
      sessionId,
      startSec: 0,
      endSec: 1500,
      targetKind: "node",
      learningPathId: pathId,
      learningPathNodeId: nodeId,
    });

    const result = await suggestSessionTarget(deps(), {
      userId: requestingUserId,
    });
    expect(result[0]!.nodeId).toBe(nodeId);
    expect(result[0]!.why).toContain("continues your last session");
  });

  test("Should return InvalidDataError when userId is missing", async () => {
    const result = await suggestSessionTarget(deps(), {} as never);
    expect(result).toBeInstanceOf(InvalidDataError);
  });

  test("Should return InvalidDataError when energy is not a known level", async () => {
    const result = await suggestSessionTarget(deps(), {
      userId: requestingUserId,
      energy: "extreme" as CandidateNodeEnergyLevel,
    });
    expect(result).toBeInstanceOf(InvalidDataError);
  });
});
