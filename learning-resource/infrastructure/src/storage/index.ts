import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type {
  LearningResource,
  ResourceType,
  Topic,
} from "@learning-resource/domain";
import { JsonStorage } from "infrastructure-lib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../../../../apps/api/data");

export const learningResourceStorage = new JsonStorage<LearningResource>(
  resolve(dataDir, "learning-resources.json"),
);
export const topicStorage = new JsonStorage<Topic>(
  resolve(dataDir, "topics.json"),
);
export const resourceTypeStorage = new JsonStorage<ResourceType>(
  resolve(dataDir, "resource-types.json"),
);
