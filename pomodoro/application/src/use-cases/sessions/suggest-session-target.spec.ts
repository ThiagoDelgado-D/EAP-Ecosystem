import { InvalidDataError, mockCryptoService, type UUID } from "domain-lib";
import {
  CandidateNodeEnergyLevel,
  CandidateNodeProgress,
} from "@pomodoro/domain";
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
    if (result instanceof InvalidDataError) throw result;

    expect(result[0].nodeId).toBe(nodeId);
    expect(result[0].why).toContain("continues your last session");
  });

  test("Should score candidates with no bonus when there is no session history yet", async () => {
    const nodeId = await cryptoService.generateUUID();

    candidateNodesPort.nodesByUser[requestingUserId] = [
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "Backend Fundamentals",
        nodeId,
        nodeTitle: "Hexagonal Architecture",
        progress: CandidateNodeProgress.PENDING,
        prerequisitesDone: true,
        resourceId: await cryptoService.generateUUID(),
      },
    ];

    const result = await suggestSessionTarget(deps(), {
      userId: requestingUserId,
    });

    if (result instanceof InvalidDataError) throw result;

    expect(result[0].nodeId).toBe(nodeId);
    expect(result[0].score).toBe(0);
    expect(result[0].why).toEqual([]);
  });

  test("Should forward the energy query through to the scoring", async () => {
    const matchingNodeId = await cryptoService.generateUUID();

    candidateNodesPort.nodesByUser[requestingUserId] = [
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "Backend Fundamentals",
        nodeId: await cryptoService.generateUUID(),
        nodeTitle: "Hexagonal Architecture",
        progress: CandidateNodeProgress.PENDING,
        prerequisitesDone: true,
        resourceId: await cryptoService.generateUUID(),
        resourceEnergyLevel: CandidateNodeEnergyLevel.MEDIUM,
      },
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "System Design Map",
        nodeId: matchingNodeId,
        nodeTitle: "Event Sourcing",
        progress: CandidateNodeProgress.PENDING,
        prerequisitesDone: true,
        resourceId: await cryptoService.generateUUID(),
        resourceEnergyLevel: CandidateNodeEnergyLevel.HIGH,
      },
    ];

    const result = await suggestSessionTarget(deps(), {
      userId: requestingUserId,
      energy: CandidateNodeEnergyLevel.HIGH,
    });
    if (result instanceof InvalidDataError) throw result;

    expect(result[0].nodeId).toBe(matchingNodeId);
    expect(result[0].why).toContain("fits high energy");
  });

  test("Should rank the path with more logged minutes above a quieter one", async () => {
    const activePathId = await cryptoService.generateUUID();
    const quietPathId = await cryptoService.generateUUID();
    const activePathNodeId = await cryptoService.generateUUID();

    candidateNodesPort.nodesByUser[requestingUserId] = [
      {
        pathId: quietPathId,
        pathTitle: "System Design Map",
        nodeId: await cryptoService.generateUUID(),
        nodeTitle: "CAP Theorem",
        progress: CandidateNodeProgress.PENDING,
        prerequisitesDone: true,
        resourceId: await cryptoService.generateUUID(),
      },
      {
        pathId: activePathId,
        pathTitle: "Backend Fundamentals",
        nodeId: activePathNodeId,
        nodeTitle: "Hexagonal Architecture",
        progress: CandidateNodeProgress.PENDING,
        prerequisitesDone: true,
        resourceId: await cryptoService.generateUUID(),
      },
    ];

    const activeSessionId = await cryptoService.generateUUID();

    sessionRepository.sessions.push({
      id: activeSessionId,
      userId: requestingUserId,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(),
      plannedMin: 25,
    });

    sessionRepository.segments.push({
      id: await cryptoService.generateUUID(),
      sessionId: activeSessionId,
      startSec: 0,
      endSec: 1500,
      targetKind: "node",
      learningPathId: activePathId,
      learningPathNodeId: activePathNodeId,
    });

    const result = await suggestSessionTarget(deps(), {
      userId: requestingUserId,
    });
    if (result instanceof InvalidDataError) throw result;

    expect(result[0].nodeId).toBe(activePathNodeId);
    expect(result[0].why).toContain("your most active path");
  });

  test("Should return every non-blocked candidate sorted by score, across multiple paths", async () => {
    const inProgressNodeId = await cryptoService.generateUUID();
    const pendingNodeId = await cryptoService.generateUUID();
    const stubNodeId = await cryptoService.generateUUID();

    candidateNodesPort.nodesByUser[requestingUserId] = [
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "System Design Map",
        nodeId: stubNodeId,
        nodeTitle: "Event Sourcing",
        progress: CandidateNodeProgress.PENDING,
        prerequisitesDone: true,
      },
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "TypeScript, Step by Step",
        nodeId: pendingNodeId,
        nodeTitle: "Decorators & Metadata",
        progress: CandidateNodeProgress.PENDING,
        prerequisitesDone: true,
        resourceId: await cryptoService.generateUUID(),
      },
      {
        pathId: await cryptoService.generateUUID(),
        pathTitle: "Backend Fundamentals",
        nodeId: inProgressNodeId,
        nodeTitle: "Hexagonal Architecture",
        progress: CandidateNodeProgress.IN_PROGRESS,
        prerequisitesDone: true,
        resourceId: await cryptoService.generateUUID(),
      },
    ];

    const result = await suggestSessionTarget(deps(), {
      userId: requestingUserId,
    });
    if (result instanceof InvalidDataError) throw result;

    expect(result.map((candidate) => candidate.nodeId)).toEqual([
      inProgressNodeId,
      pendingNodeId,
      stubNodeId,
    ]);
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
