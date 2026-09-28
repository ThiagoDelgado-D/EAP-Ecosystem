import type { UUID } from "domain-lib";
import {
  EnergyLevel,
  type MentalState,
  type RecommendationContext,
  type LearningResourceCandidate,
  type LearningPathNodeCandidate,
} from "@recommendation/domain";

export interface RecommendationCandidate {
  resourceId?: UUID;
  nodeId?: UUID;
  pathId?: UUID;
  pathTitle?: string;
  title: string;
  energyLevel?: EnergyLevel;
  mentalState?: MentalState;
  estimatedMinutes?: number;
  lastViewed?: Date;
  isNextInActivePath: boolean;
}

export interface ScoredRecommendation {
  resourceId?: UUID;
  nodeId?: UUID;
  pathId?: UUID;
  title: string;
  score: number;
  why: string[];
}

const ENERGY_MATCH_SCORE = 20;
const ENERGY_MISMATCH_PENALTY = -10;
const MENTAL_STATE_MATCH_SCORE = 15;
const TIME_FIT_SCORE = 15;
const TIME_OVER_BUDGET_PENALTY = -10;
const ACTIVE_PATH_RELEVANCE_SCORE = 25;
export const ABANDONMENT_DAYS_THRESHOLD = 7;
const ABANDONMENT_DAYS_CAP = 30;
const ABANDONMENT_MAX_PENALTY = -20;

interface SignalResult {
  points: number;
  reason?: string;
}

type Signal = (
  candidate: RecommendationCandidate,
  context: RecommendationContext,
) => SignalResult | null;

const energyMatchSignal: Signal = (candidate, context) => {
  if (!candidate.energyLevel) return null;
  if (candidate.energyLevel === context.energyLevel) {
    return {
      points: ENERGY_MATCH_SCORE,
      reason: `matches your ${context.energyLevel} energy`,
    };
  }
  const isOppositeEnds =
    (context.energyLevel === EnergyLevel.LOW &&
      candidate.energyLevel === EnergyLevel.HIGH) ||
    (context.energyLevel === EnergyLevel.HIGH &&
      candidate.energyLevel === EnergyLevel.LOW);
  return isOppositeEnds ? { points: ENERGY_MISMATCH_PENALTY } : null;
};

const mentalStateMatchSignal: Signal = (candidate, context) => {
  if (!context.mentalState || !candidate.mentalState) return null;
  if (candidate.mentalState !== context.mentalState) return null;
  return {
    points: MENTAL_STATE_MATCH_SCORE,
    reason: `fits your ${context.mentalState.replace("_", " ")} mindset`,
  };
};

const timeFitSignal: Signal = (candidate, context) => {
  if (!context.availableMinutes || !candidate.estimatedMinutes) return null;
  if (candidate.estimatedMinutes <= context.availableMinutes) {
    return {
      points: TIME_FIT_SCORE,
      reason: `fits your ${context.availableMinutes} min window`,
    };
  }
  return { points: TIME_OVER_BUDGET_PENALTY };
};

const activePathRelevanceSignal: Signal = (candidate) => {
  if (!candidate.isNextInActivePath) return null;
  return {
    points: ACTIVE_PATH_RELEVANCE_SCORE,
    reason: candidate.pathTitle
      ? `next step in ${candidate.pathTitle}`
      : "next step in an active path",
  };
};

const abandonmentSignal: Signal = (candidate) => {
  if (!candidate.lastViewed) return null;
  const daysSinceViewed = Math.floor(
    (Date.now() - candidate.lastViewed.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (daysSinceViewed < ABANDONMENT_DAYS_THRESHOLD) return null;

  const cappedDays = Math.min(daysSinceViewed, ABANDONMENT_DAYS_CAP);
  const points = Math.round(
    (cappedDays / ABANDONMENT_DAYS_CAP) * ABANDONMENT_MAX_PENALTY,
  );

  return {
    points,
    reason: `You haven't opened this in ${daysSinceViewed} days`,
  };
};

const SIGNALS: Signal[] = [
  energyMatchSignal,
  mentalStateMatchSignal,
  timeFitSignal,
  activePathRelevanceSignal,
  abandonmentSignal,
];

const scoreCandidate = (
  candidate: RecommendationCandidate,
  context: RecommendationContext,
): ScoredRecommendation => {
  let score = 0;
  const why: string[] = [];

  for (const signal of SIGNALS) {
    const result = signal(candidate, context);
    if (!result) continue;
    score += result.points;
    if (result.reason) why.push(result.reason);
  }

  return {
    resourceId: candidate.resourceId,
    nodeId: candidate.nodeId,
    pathId: candidate.pathId,
    title: candidate.title,
    score,
    why,
  };
};

export const scoreRecommendations = (
  candidates: RecommendationCandidate[],
  context: RecommendationContext,
): ScoredRecommendation[] =>
  candidates
    .map((candidate) => scoreCandidate(candidate, context))
    .sort((a, b) => b.score - a.score);

const buildResourceCandidate = (
  resource: LearningResourceCandidate,
): RecommendationCandidate => ({
  resourceId: resource.resourceId,
  title: resource.title,
  energyLevel: resource.energyLevel,
  mentalState: resource.mentalState,
  estimatedMinutes: resource.estimatedMinutes,
  lastViewed: resource.lastViewed,
  isNextInActivePath: false,
});

const buildStandalonePathNodeCandidate = (
  node: LearningPathNodeCandidate,
): RecommendationCandidate => ({
  nodeId: node.nodeId,
  pathId: node.pathId,
  pathTitle: node.pathTitle,
  resourceId: node.resourceId,
  title: node.nodeTitle,
  energyLevel: node.energyLevel,
  mentalState: node.mentalState,
  estimatedMinutes: node.estimatedMinutes,
  lastViewed: node.lastViewed,
  isNextInActivePath: true,
});

export const mergeCandidates = (
  resourceCandidates: LearningResourceCandidate[],
  pathCandidates: LearningPathNodeCandidate[],
): RecommendationCandidate[] => {
  const candidatesByResourceId = new Map<UUID, RecommendationCandidate>();

  for (const resource of resourceCandidates) {
    candidatesByResourceId.set(
      resource.resourceId,
      buildResourceCandidate(resource),
    );
  }

  const standalonePathCandidates: RecommendationCandidate[] = [];

  for (const node of pathCandidates) {
    const matchedResource = node.resourceId
      ? candidatesByResourceId.get(node.resourceId)
      : undefined;

    if (matchedResource) {
      matchedResource.isNextInActivePath = true;
      matchedResource.pathId = node.pathId;
      matchedResource.pathTitle = node.pathTitle;
      matchedResource.nodeId = node.nodeId;
      continue;
    }

    standalonePathCandidates.push(buildStandalonePathNodeCandidate(node));
  }

  return [...candidatesByResourceId.values(), ...standalonePathCandidates];
};
