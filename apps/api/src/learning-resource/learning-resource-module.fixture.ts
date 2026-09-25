import {
  mockLearningResourceRepository,
  mockResourceTypeRepository,
  mockTopicRepository,
  type IUrlMetadataService,
} from "@learning-resource/application";
import type { ResourceType, Topic } from "@learning-resource/domain";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { mockJwtService, type MockedJwtService } from "domain-lib";
import { CryptoServiceImpl } from "infrastructure-lib";
import {
  LearningResourceEntity,
  ResourceTypeEntity,
  TopicEntity,
} from "@learning-resource/infrastructure";
import { LearningResourceModule } from "./learning-resource.module.js";
import { GlobalExceptionFilter } from "../filters/http-exception-filter.js";

export interface TopicSeed {
  name: string;
  color: string;
}

export interface ResourceTypeSeed {
  code: string;
  displayName: string;
}

export interface LearningResourceTestAppOptions {
  topics?: TopicSeed[];
  resourceTypes?: ResourceTypeSeed[];
  metadataService?: IUrlMetadataService;
}

export interface LearningResourceTestApp {
  app: INestApplication;
  resourceRepo: ReturnType<typeof mockLearningResourceRepository>;
  topicRepo: ReturnType<typeof mockTopicRepository>;
  resourceTypeRepo: ReturnType<typeof mockResourceTypeRepository>;
  cryptoService: CryptoServiceImpl;
  jwtService: MockedJwtService;
  topics: Topic[];
  resourceTypes: ResourceType[];
}

const defaultMetadataService: IUrlMetadataService = {
  extract: async () => ({}),
};

export async function createLearningResourceTestApp(
  options: LearningResourceTestAppOptions = {},
): Promise<LearningResourceTestApp> {
  const cryptoService = new CryptoServiceImpl();
  const now = new Date();

  const topics: Topic[] = await Promise.all(
    (options.topics ?? []).map(async (seed) => ({
      id: await cryptoService.generateUUID(),
      createdAt: now,
      updatedAt: now,
      ...seed,
    })),
  );
  const resourceTypes: ResourceType[] = await Promise.all(
    (options.resourceTypes ?? []).map(async (seed) => ({
      id: await cryptoService.generateUUID(),
      createdAt: now,
      updatedAt: now,
      ...seed,
    })),
  );

  const resourceRepo = mockLearningResourceRepository([]);
  const topicRepo = mockTopicRepository(topics);
  const resourceTypeRepo = mockResourceTypeRepository(resourceTypes);
  const jwtService = mockJwtService();

  const module = await Test.createTestingModule({
    imports: [LearningResourceModule],
  })
    .overrideProvider(getRepositoryToken(LearningResourceEntity))
    .useValue({})
    .overrideProvider(getRepositoryToken(TopicEntity))
    .useValue({})
    .overrideProvider(getRepositoryToken(ResourceTypeEntity))
    .useValue({})
    .overrideProvider("ILearningResourceRepository")
    .useValue(resourceRepo)
    .overrideProvider("ITopicRepository")
    .useValue(topicRepo)
    .overrideProvider("IResourceTypeRepository")
    .useValue(resourceTypeRepo)
    .overrideProvider("ICryptoService")
    .useValue(cryptoService)
    .overrideProvider("IUrlMetadataService")
    .useValue(options.metadataService ?? defaultMetadataService)
    .overrideProvider("IJwtService")
    .useValue(jwtService)
    .compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();

  return {
    app,
    resourceRepo,
    topicRepo,
    resourceTypeRepo,
    cryptoService,
    jwtService,
    topics,
    resourceTypes,
  };
}
