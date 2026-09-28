import { faker } from "@faker-js/faker";
import {
  EnergyLevel,
  MentalState,
  type LearningPathNodeCandidate,
  type LearningResourceCandidate,
  type RecommendationContext,
} from "@recommendation/domain";
import type { UUID } from "domain-lib";

export const generateRecommendationContext = (
  opts?: Partial<RecommendationContext>,
): RecommendationContext => ({
  userId: faker.string.uuid() as UUID,
  energyLevel: faker.helpers.arrayElement(Object.values(EnergyLevel)),
  updatedAt: faker.date.recent({ days: 1 }),
  ...opts,
});

export const generateLearningResourceCandidate = (
  opts?: Partial<LearningResourceCandidate>,
): LearningResourceCandidate => ({
  resourceId: faker.string.uuid() as UUID,
  title: faker.lorem.sentence(4),
  energyLevel: faker.helpers.arrayElement(Object.values(EnergyLevel)),
  mentalState: faker.helpers.arrayElement(Object.values(MentalState)),
  estimatedMinutes: faker.helpers.arrayElement([10, 20, 30, 45, 60]),
  ...opts,
});

export const generateLearningPathNodeCandidate = (
  opts?: Partial<LearningPathNodeCandidate>,
): LearningPathNodeCandidate => ({
  pathId: faker.string.uuid() as UUID,
  pathTitle: faker.lorem.sentence(3),
  nodeId: faker.string.uuid() as UUID,
  nodeTitle: faker.lorem.sentence(4),
  ...opts,
});
