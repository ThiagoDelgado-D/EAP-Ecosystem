import { mockCryptoService } from "domain-lib";
import { describe, test, expect } from "vitest";
import { mockLearningResourceRepository } from "../../mocks/mock-learning-resource-repository";
import { mockResourceTypeRepository } from "../../mocks/mock-resource-type-repository";
import { mockTopicRepository } from "../../mocks/mock-topic-repository";

describe("addResource", () => {
  const cryptoService = mockCryptoService();
  const learningResourceRepository = mockLearningResourceRepository();
  const resourceTypeRepository = mockResourceTypeRepository();
  const topicRepository = mockTopicRepository();
});
