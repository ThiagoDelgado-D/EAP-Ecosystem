import { EnergyLevel, MentalState } from "@recommendation/domain";
import { describe, expect, test } from "vitest";
import {
  generateLearningPathNodeCandidate,
  generateLearningResourceCandidate,
  generateRecommendationContext,
} from "../mocks/factories.js";
import {
  ABANDONMENT_DAYS_THRESHOLD,
  mergeCandidates,
  scoreRecommendations,
} from "./recommendation-scorer.js";

describe("mergeCandidates", () => {
  test("enriches a resource candidate with active-path relevance when a node references it", () => {
    const resource = generateLearningResourceCandidate();
    const node = generateLearningPathNodeCandidate({
      resourceId: resource.resourceId,
    });

    const [merged] = mergeCandidates([resource], [node]);

    expect(merged).toMatchObject({
      resourceId: resource.resourceId,
      isNextInActivePath: true,
      pathId: node.pathId,
      pathTitle: node.pathTitle,
    });
  });

  test("keeps a standalone path node without an attached resource as its own candidate", () => {
    const node = generateLearningPathNodeCandidate({ resourceId: undefined });

    const merged = mergeCandidates([], [node]);

    expect(merged).toEqual([
      expect.objectContaining({
        nodeId: node.nodeId,
        title: node.nodeTitle,
        isNextInActivePath: true,
      }),
    ]);
  });

  test("keeps a resource with no matching active-path node unmarked", () => {
    const resource = generateLearningResourceCandidate();

    const [merged] = mergeCandidates([resource], []);

    expect(merged?.isNextInActivePath).toBe(false);
  });
});

describe("scoreRecommendations", () => {
  test("scores an energy match higher than an opposite-energy mismatch", () => {
    const context = generateRecommendationContext({
      energyLevel: EnergyLevel.LOW,
      mentalState: undefined,
      availableMinutes: undefined,
    });
    const matching = generateLearningResourceCandidate({
      energyLevel: EnergyLevel.LOW,
      mentalState: undefined,
      estimatedMinutes: undefined,
    });
    const mismatching = generateLearningResourceCandidate({
      energyLevel: EnergyLevel.HIGH,
      mentalState: undefined,
      estimatedMinutes: undefined,
    });

    const [scored] = scoreRecommendations(
      mergeCandidates([matching, mismatching], []),
      context,
    );

    expect(scored?.resourceId).toBe(matching.resourceId);
    expect(scored?.why).toContain("matches your low energy");
  });

  test("rewards a candidate matching the context's mental state", () => {
    const context = generateRecommendationContext({
      mentalState: MentalState.DEEP_FOCUS,
      availableMinutes: undefined,
    });
    const candidate = generateLearningResourceCandidate({
      energyLevel: context.energyLevel,
      mentalState: MentalState.DEEP_FOCUS,
      estimatedMinutes: undefined,
    });

    const [scored] = scoreRecommendations(
      mergeCandidates([candidate], []),
      context,
    );

    expect(scored?.why).toContain("fits your deep focus mindset");
  });

  test("rewards a candidate that fits the available time window and penalizes one that doesn't", () => {
    const context = generateRecommendationContext({
      availableMinutes: 20,
      mentalState: undefined,
    });
    const fits = generateLearningResourceCandidate({
      energyLevel: context.energyLevel,
      mentalState: undefined,
      estimatedMinutes: 15,
    });
    const overBudget = generateLearningResourceCandidate({
      energyLevel: context.energyLevel,
      mentalState: undefined,
      estimatedMinutes: 60,
    });

    const scored = scoreRecommendations(
      mergeCandidates([fits, overBudget], []),
      context,
    );

    const fitsScore = scored.find((s) => s.resourceId === fits.resourceId);
    const overBudgetScore = scored.find(
      (s) => s.resourceId === overBudget.resourceId,
    );

    expect(fitsScore?.why).toContain("fits your 20 min window");
    expect(fitsScore!.score).toBeGreaterThan(overBudgetScore!.score);
  });

  test("bonuses a candidate that is the next actionable node in an active path", () => {
    const context = generateRecommendationContext({
      mentalState: undefined,
      availableMinutes: undefined,
    });
    const resource = generateLearningResourceCandidate({
      energyLevel: context.energyLevel,
      mentalState: undefined,
      estimatedMinutes: undefined,
    });
    const node = generateLearningPathNodeCandidate({
      resourceId: resource.resourceId,
      pathTitle: "DevOps Fundamentals",
    });

    const [scored] = scoreRecommendations(
      mergeCandidates([resource], [node]),
      context,
    );

    expect(scored?.why).toContain("next step in DevOps Fundamentals");
  });

  test("penalizes a candidate the longer it has gone unviewed, explaining why in plain language", () => {
    const context = generateRecommendationContext({
      mentalState: undefined,
      availableMinutes: undefined,
    });
    const daysUnviewed = ABANDONMENT_DAYS_THRESHOLD + 3;
    const stale = generateLearningResourceCandidate({
      energyLevel: context.energyLevel,
      mentalState: undefined,
      estimatedMinutes: undefined,
      lastViewed: new Date(Date.now() - daysUnviewed * 24 * 60 * 60 * 1000),
    });
    const fresh = generateLearningResourceCandidate({
      energyLevel: context.energyLevel,
      mentalState: undefined,
      estimatedMinutes: undefined,
      lastViewed: new Date(),
    });

    const scored = scoreRecommendations(
      mergeCandidates([stale, fresh], []),
      context,
    );

    const staleScore = scored.find((s) => s.resourceId === stale.resourceId);
    const freshScore = scored.find((s) => s.resourceId === fresh.resourceId);

    expect(staleScore?.why).toContain(
      `You haven't opened this in ${daysUnviewed} days`,
    );
    expect(staleScore!.score).toBeLessThan(freshScore!.score);
  });
});
