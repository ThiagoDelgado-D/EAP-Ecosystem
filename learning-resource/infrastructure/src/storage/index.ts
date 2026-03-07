import { resolve } from "path";
import type {
  LearningResource,
  ResourceType,
  Topic,
} from "@learning-resource/domain";

import { JsonStorage } from "infrastructure-lib";

const dataDir = resolve("data");

export const learningResourceStorage = new JsonStorage<LearningResource>(
  resolve(dataDir, "learning-resources.json"),
);

export const topicStorage = new JsonStorage<Topic>(
  resolve(dataDir, "topics.json"),
);

export const resourceTypeStorage = new JsonStorage<ResourceType>(
  resolve(dataDir, "resource-types.json"),
);
