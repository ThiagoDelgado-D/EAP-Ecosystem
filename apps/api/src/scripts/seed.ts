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

const resourceTypes: ResourceType[] = [
  {
    id: faker.string.uuid() as UUID,
    code: "article",
    displayName: "Article",
    isActive: true,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  },
  {
    id: faker.string.uuid() as UUID,
    code: "video",
    displayName: "Video",
    isActive: true,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  },
  {
    id: faker.string.uuid() as UUID,
    code: "course",
    displayName: "Course",
    isActive: true,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  },
  {
    id: faker.string.uuid() as UUID,
    code: "book",
    displayName: "Book",
    isActive: true,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  },
  {
    id: faker.string.uuid() as UUID,
    code: "podcast",
    displayName: "Podcast",
    isActive: true,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  },
];

const topics: Topic[] = Array.from({ length: 10 }, () => ({
  id: faker.string.uuid() as UUID,
  name: faker.hacker.noun(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
}));

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
    updatedAt: faker.date.recent(),
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
