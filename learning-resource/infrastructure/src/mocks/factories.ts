import { faker } from "@faker-js/faker";
import {
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import type {
  LearningResource,
  ResourceType,
  Topic,
} from "@learning-resource/domain";
import type { UUID } from "domain-lib";

export const generateResourceType = (
  opts?: Partial<ResourceType>,
): ResourceType => {
  const createdAt = faker.date.past({ years: 1 });
  return {
    id: faker.string.uuid() as UUID,
    code: faker.hacker.noun(),
    displayName: faker.hacker.noun(),
    isActive: true,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    ...opts,
  };
};

export const generateTopic = (opts?: Partial<Topic>): Topic => {
  const createdAt = faker.date.past({ years: 1 });
  return {
    id: faker.string.uuid() as UUID,
    name: faker.hacker.noun(),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    ...opts,
  };
};

export const generateLearningResource = (
  opts?: Partial<LearningResource>,
): LearningResource => {
  const createdAt = faker.date.past({ years: 1 });
  return {
    id: faker.string.uuid() as UUID,
    title: faker.hacker.phrase(),
    url: faker.internet.url(),
    typeId: faker.string.uuid() as UUID,
    topicIds: [faker.string.uuid() as UUID],
    difficulty: faker.helpers.arrayElement(Object.values(DifficultyType)),
    estimatedDuration: {
      value: faker.number.int({ min: 5, max: 240 }),
      isEstimated: faker.datatype.boolean(),
    },
    energyLevel: faker.helpers.arrayElement(Object.values(EnergyLevelType)),
    status: faker.helpers.arrayElement(Object.values(ResourceStatusType)),
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    ...opts,
  };
};
