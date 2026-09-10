import type { UUID } from "domain-lib";
import {
  CandidateNodeEnergyLevel,
  CandidateNodeProgress,
  type CandidateNode,
} from "@pomodoro/domain";

export interface ScoringContext {
  energy?: CandidateNodeEnergyLevel;
  lastSessionNodeId?: UUID;
  momentumByPathId: Map<UUID, number>;
  maxMomentumSeconds: number;
}

export interface ScoredCandidate {
  pathId: UUID;
  pathTitle: string;
  nodeId: UUID;
  nodeTitle: string;
  resourceId?: UUID;
  score: number;
  why: string[];
}

const IN_PROGRESS_SCORE = 50;
const CONTINUES_LAST_SESSION_SCORE = 34;
const ENERGY_MATCH_SCORE = 16;
const LOW_ENERGY_MISMATCH_PENALTY = -14;
const MAX_MOMENTUM_SCORE = 14;
const NO_RESOURCE_PENALTY = -6;

interface SignalResult {
  points: number;
  reason?: string;
}

type Signal = (
  candidate: CandidateNode,
  context: ScoringContext,
) => SignalResult | null;

const alreadyOpenSignal: Signal = (candidate) =>
  candidate.progress === CandidateNodeProgress.IN_PROGRESS
    ? { points: IN_PROGRESS_SCORE, reason: "already open" }
    : null;

const continuesLastSessionSignal: Signal = (candidate, context) =>
  context.lastSessionNodeId === candidate.nodeId
    ? {
        points: CONTINUES_LAST_SESSION_SCORE,
        reason: "continues your last session",
      }
    : null;

const energyMatchSignal: Signal = (candidate, context) => {
  if (!context.energy) return null;
  if (candidate.resourceEnergyLevel === context.energy) {
    return {
      points: ENERGY_MATCH_SCORE,
      reason: `fits ${context.energy} energy`,
    };
  }
  if (
    context.energy === CandidateNodeEnergyLevel.LOW &&
    candidate.resourceEnergyLevel === CandidateNodeEnergyLevel.HIGH
  ) {
    return { points: LOW_ENERGY_MISMATCH_PENALTY };
  }
  return null;
};

const pathMomentumSignal: Signal = (candidate, context) => {
  const seconds = context.momentumByPathId.get(candidate.pathId) ?? 0;
  if (seconds <= 0) return null;
  return {
    points: Math.round((seconds / context.maxMomentumSeconds) * MAX_MOMENTUM_SCORE),
    reason: seconds === context.maxMomentumSeconds ? "your most active path" : undefined,
  };
};

const noResourceYetSignal: Signal = (candidate) =>
  candidate.resourceId ? null : { points: NO_RESOURCE_PENALTY, reason: "no resource yet" };

const SIGNALS: Signal[] = [
  alreadyOpenSignal,
  continuesLastSessionSignal,
  energyMatchSignal,
  pathMomentumSignal,
  noResourceYetSignal,
];

const scoreCandidate = (
  candidate: CandidateNode,
  context: ScoringContext,
): ScoredCandidate => {
  let score = 0;
  const why: string[] = [];

  for (const signal of SIGNALS) {
    const result = signal(candidate, context);
    if (!result) continue;
    score += result.points;
    if (result.reason) why.push(result.reason);
  }

  return {
    pathId: candidate.pathId,
    pathTitle: candidate.pathTitle,
    nodeId: candidate.nodeId,
    nodeTitle: candidate.nodeTitle,
    resourceId: candidate.resourceId,
    score,
    why,
  };
};

export const scoreCandidates = (
  candidates: CandidateNode[],
  context: ScoringContext,
): ScoredCandidate[] =>
  candidates
    .filter((candidate) => candidate.progress !== CandidateNodeProgress.DONE)
    .filter((candidate) => candidate.prerequisitesDone)
    .map((candidate) => scoreCandidate(candidate, context))
    .sort((a, b) => b.score - a.score);
