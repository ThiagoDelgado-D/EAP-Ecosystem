import { faker } from "@faker-js/faker";
import type {
  LearningResource,
  ResourceType,
  Topic,
} from "@learning-resource/domain";
import type { UUID } from "domain-lib";
import { JsonStorage } from "infrastructure-lib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../data");

const resourceTypeStorage = new JsonStorage<ResourceType>(
  resolve(dataDir, "resource-types.json"),
);
const topicStorage = new JsonStorage<Topic>(resolve(dataDir, "topics.json"));
const learningResourceStorage = new JsonStorage<LearningResource>(
  resolve(dataDir, "learning-resources.json"),
);

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
  description: faker.hacker.phrase(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
}));

const difficulties = ["low", "medium", "high"] as const;
const energyLevels = ["low", "medium", "high"] as const;
const statuses = ["pending", "in_progress", "completed"] as const;

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
