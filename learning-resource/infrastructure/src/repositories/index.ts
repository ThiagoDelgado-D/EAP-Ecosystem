export * from "./json-learning-resource-repository.js";
export * from "./json-resource-type-repository.js";
export * from "./json-topic-repository.js";
import {
  learningResourceStorage,
  topicStorage,
  resourceTypeStorage,
} from "../storage/index.js";
import { JsonLearningResourceRepository } from "./json-learning-resource-repository.js";
import { JsonTopicRepository } from "./json-topic-repository.js";
import { JsonResourceTypeRepository } from "./json-resource-type-repository.js";

export const learningResourceRepository = new JsonLearningResourceRepository(
  learningResourceStorage,
);
export const topicRepository = new JsonTopicRepository(topicStorage);
export const resourceTypeRepository = new JsonResourceTypeRepository(
  resourceTypeStorage,
);
