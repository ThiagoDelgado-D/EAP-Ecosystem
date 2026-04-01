import { faker } from "@faker-js/faker";
import { config } from "dotenv";
import { In } from "typeorm";
import {
  DifficultyType,
  EnergyLevelType,
  MentalStateType,
  ResourceStatusType,
} from "@learning-resource/domain";
import type {
  LearningResource,
  ResourceType,
  Topic,
} from "@learning-resource/domain";
import type { UUID } from "domain-lib";
import {
  LearningResourceEntity,
  ResourceTypeEntity,
  TopicEntity,
} from "@learning-resource/infrastructure";
import { AppDataSource } from "../database/data-source.js";

config({ path: "../../.env" });

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
    color: faker.color.rgb({ format: "hex", prefix: "#" }),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
});

const difficulties = Object.values(DifficultyType);
const energyLevels = Object.values(EnergyLevelType);
const statuses = Object.values(ResourceStatusType);
const mentalStates = Object.values(MentalStateType);

const learningResources: LearningResource[] = Array.from({ length: 30 }, () => {
  const createdAt = faker.date.past({ years: 1 });
  return {
    id: faker.string.uuid() as UUID,
    title: faker.hacker.phrase(),
    url: faker.internet.url(),
    imageUrl: faker.datatype.boolean()
      ? faker.image.url({ width: 640, height: 360 })
      : undefined,
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
    mentalState: faker.datatype.boolean()
      ? faker.helpers.arrayElement(mentalStates)
      : undefined,
    status: faker.helpers.arrayElement(statuses),
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
  };
});

try {
  await AppDataSource.initialize();

  const resourceTypeRepo = AppDataSource.getRepository(ResourceTypeEntity);
  const topicRepo = AppDataSource.getRepository(TopicEntity);
  const learningResourceRepo = AppDataSource.getRepository(
    LearningResourceEntity,
  );

  await resourceTypeRepo.save(
    resourceTypes.map((rt) => {
      const entity = new ResourceTypeEntity();
      entity.id = rt.id;
      entity.code = rt.code;
      entity.displayName = rt.displayName;
      entity.isActive = rt.isActive ?? true;
      entity.createdAt = rt.createdAt;
      entity.updatedAt = rt.updatedAt;
      return entity;
    }),
  );

  await topicRepo.save(
    topics.map((t) => {
      const entity = new TopicEntity();
      entity.id = t.id;
      entity.name = t.name;
      entity.color = t.color ?? "#000000";
      entity.createdAt = t.createdAt;
      entity.updatedAt = t.updatedAt;
      return entity;
    }),
  );

  await learningResourceRepo.save(
    await Promise.all(
      learningResources.map(async (lr) => {
        const entity = new LearningResourceEntity();
        entity.id = lr.id;
        entity.title = lr.title;
        entity.url = lr.url ?? null;
        entity.imageUrl = lr.imageUrl ?? null;
        entity.notes = lr.notes ?? null;
        entity.difficulty = lr.difficulty;
        entity.energyLevel = lr.energyLevel;
        entity.mentalState = lr.mentalState ?? null;
        entity.status = lr.status;
        entity.estimatedDurationMinutes = lr.estimatedDuration.value;
        entity.isDurationEstimated = lr.estimatedDuration.isEstimated;
        entity.resourceTypeId = lr.typeId;
        entity.lastViewedAt = lr.lastViewed ?? null;
        entity.createdAt = lr.createdAt;
        entity.updatedAt = lr.updatedAt;
        entity.topics = await topicRepo.findBy({ id: In(lr.topicIds) });
        return entity;
      }),
    ),
  );

  console.log(`✅ Seeded ${resourceTypes.length} resource types`);
  console.log(`✅ Seeded ${topics.length} topics`);
  console.log(`✅ Seeded ${learningResources.length} learning resources`);

  await AppDataSource.destroy();
} catch (error) {
  console.error("❌ Seed failed:", error);
  process.exit(1);
}
