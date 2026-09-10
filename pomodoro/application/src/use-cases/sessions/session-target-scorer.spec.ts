import { mockCryptoService, type UUID } from "domain-lib";
import {
  CandidateNodeEnergyLevel,
  CandidateNodeProgress,
  type CandidateNode,
} from "@pomodoro/domain";
import { beforeEach, describe, expect, test } from "vitest";
import { scoreCandidates, type ScoringContext } from "./session-target-scorer.js";

describe("scoreCandidates", () => {
  let cryptoService: ReturnType<typeof mockCryptoService>;
  let defaultPathId: UUID;
  let baseContext: ScoringContext;

  beforeEach(async () => {
    cryptoService = mockCryptoService();
    defaultPathId = await cryptoService.generateUUID();
    baseContext = { momentumByPathId: new Map(), maxMomentumSeconds: 1 };
  });

  const buildCandidate = async (
    overrides: Partial<CandidateNode> = {},
  ): Promise<CandidateNode> => ({
    pathId: defaultPathId,
    pathTitle: "Backend Fundamentals",
    nodeId: await cryptoService.generateUUID(),
    nodeTitle: "Hexagonal Architecture",
    progress: CandidateNodeProgress.PENDING,
    prerequisitesDone: true,
    ...overrides,
  });

  test("Should exclude a node that is already done", async () => {
    const doneNode = await buildCandidate({
      progress: CandidateNodeProgress.DONE,
    });
    expect(scoreCandidates([doneNode], baseContext)).toEqual([]);
  });

  test("Should exclude a node whose prerequisites are not done", async () => {
    const blockedNode = await buildCandidate({ prerequisitesDone: false });
    expect(scoreCandidates([blockedNode], baseContext)).toEqual([]);
  });

  test("Should score an in-progress node above a pending one", async () => {
    const inProgressNode = await buildCandidate({
      progress: CandidateNodeProgress.IN_PROGRESS,
    });
    const pendingNode = await buildCandidate();

    const result = scoreCandidates([pendingNode, inProgressNode], baseContext);
    expect(result[0]!.nodeId).toBe(inProgressNode.nodeId);
    expect(result[0]!.why).toContain("already open");
  });

  test("Should score the node that continues the last session", async () => {
    const continuedNode = await buildCandidate();
    const otherNode = await buildCandidate();
    const context: ScoringContext = {
      ...baseContext,
      lastSessionNodeId: continuedNode.nodeId,
    };

    const result = scoreCandidates([otherNode, continuedNode], context);
    expect(result[0]!.nodeId).toBe(continuedNode.nodeId);
    expect(result[0]!.why).toContain("continues your last session");
  });

  test("Should score a node whose resource matches the requested energy", async () => {
    const matchingNode = await buildCandidate({
      resourceId: await cryptoService.generateUUID(),
      resourceEnergyLevel: CandidateNodeEnergyLevel.HIGH,
    });
    const nonMatchingNode = await buildCandidate({
      resourceId: await cryptoService.generateUUID(),
      resourceEnergyLevel: CandidateNodeEnergyLevel.MEDIUM,
    });
    const context: ScoringContext = {
      ...baseContext,
      energy: CandidateNodeEnergyLevel.HIGH,
    };

    const result = scoreCandidates([nonMatchingNode, matchingNode], context);
    expect(result[0]!.nodeId).toBe(matchingNode.nodeId);
    expect(result[0]!.why).toContain("fits high energy");
  });

  test("Should penalize a high-energy resource when the user asked for low energy", async () => {
    const highEnergyNode = await buildCandidate({
      resourceId: await cryptoService.generateUUID(),
      resourceEnergyLevel: CandidateNodeEnergyLevel.HIGH,
    });
    const lowEnergyNode = await buildCandidate({
      resourceId: await cryptoService.generateUUID(),
      resourceEnergyLevel: CandidateNodeEnergyLevel.LOW,
    });
    const context: ScoringContext = {
      ...baseContext,
      energy: CandidateNodeEnergyLevel.LOW,
    };

    const result = scoreCandidates([highEnergyNode, lowEnergyNode], context);
    expect(result[0]!.nodeId).toBe(lowEnergyNode.nodeId);
  });

  test("Should favor the path with the most momentum", async () => {
    const activePathId = await cryptoService.generateUUID();
    const quietPathId = await cryptoService.generateUUID();
    const activePathNode = await buildCandidate({ pathId: activePathId });
    const quietPathNode = await buildCandidate({ pathId: quietPathId });
    const context: ScoringContext = {
      ...baseContext,
      momentumByPathId: new Map([
        [activePathId, 1800],
        [quietPathId, 300],
      ]),
      maxMomentumSeconds: 1800,
    };

    const result = scoreCandidates([quietPathNode, activePathNode], context);
    expect(result[0]!.nodeId).toBe(activePathNode.nodeId);
    expect(result[0]!.why).toContain("your most active path");
  });

  test("Should penalize a stub node with no resource yet", async () => {
    const stubNode = await buildCandidate({ resourceId: undefined });
    const linkedNode = await buildCandidate({
      resourceId: await cryptoService.generateUUID(),
    });

    const result = scoreCandidates([stubNode, linkedNode], baseContext);
    expect(result[0]!.nodeId).toBe(linkedNode.nodeId);
    expect(result.find((c) => c.nodeId === stubNode.nodeId)!.why).toContain(
      "no resource yet",
    );
  });

  test("Should sort candidates by score descending", async () => {
    const highScoreNode = await buildCandidate({
      progress: CandidateNodeProgress.IN_PROGRESS,
    });
    const lowScoreNode = await buildCandidate({ resourceId: undefined });

    const result = scoreCandidates([lowScoreNode, highScoreNode], baseContext);
    expect(result.map((c) => c.nodeId)).toEqual([
      highScoreNode.nodeId,
      lowScoreNode.nodeId,
    ]);
  });
});
