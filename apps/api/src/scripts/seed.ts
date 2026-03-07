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
import {
  learningResourceStorage,
  topicStorage,
  resourceTypeStorage,
} from "@learning-resource/infrastructure";

const makeResourceType = (code: string, displayName: string): ResourceType => {
  const createdAt = faker.date.past({ years: 1 });
  return {
    id: faker.string.uuid() as UUID,
    code,
    displayName,
    isActive: true,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
};
const resourceTypes: ResourceType[] = [
  makeResourceType("article", "Article"),
  makeResourceType("video", "Video"),
  makeResourceType("course", "Course"),
  makeResourceType("book", "Book"),
  makeResourceType("podcast", "Podcast"),
];

const topics: Topic[] = Array.from({ length: 10 }, () => {
  const createdAt = faker.date.past({ years: 1 });
  return {
    id: faker.string.uuid() as UUID,
    name: faker.hacker.noun(),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
});

const difficulties = Object.values(DifficultyType);
const energyLevels = Object.values(EnergyLevelType);
const statuses = Object.values(ResourceStatusType);

const learningResources: LearningResource[] = Array.from({ length: 30 }, () => {
  const createdAt = faker.date.past({ years: 1 });
  return {
    id: faker.string.uuid() as UUID,
    title: faker.hacker.phrase(),
    url: faker.internet.url(),
    typeId: faker.helpers.arrayElement(resourceTypes).id,
    topicIds: faker.helpers
      .arrayElements(topics, { min: 1, max: 3 })
      .map((t) => t.id),
    difficulty: faker.helpers.arrayElement(difficulties),
    estimatedDuration: {
      value: faker.number.int({ min: 5, max: 240 }),
      isEstimated: faker.datatype.boolean(),
    },
    energyLevel: faker.helpers.arrayElement(energyLevels),
    status: faker.helpers.arrayElement(statuses),
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
});

try {
  await resourceTypeStorage.writeAll(resourceTypes);
  await topicStorage.writeAll(topics);
  await learningResourceStorage.writeAll(learningResources);

  console.log(`✅ Seeded ${resourceTypes.length} resource types`);
  console.log(`✅ Seeded ${topics.length} topics`);
  console.log(`✅ Seeded ${learningResources.length} learning resources`);
} catch (error) {
  console.error("❌ Seed failed:", error);
  process.exit(1);
}
