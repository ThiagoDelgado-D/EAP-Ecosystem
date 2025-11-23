import {
  CryptoService,
  InvalidDataError,
  NotFoundError,
  UUID,
} from "domain-lib";
import {
  DifficultyType,
  EnergyLevelType,
  ILearningResourceRepository,
  IResourceTypeRepository,
  ITopicRepository,
  LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { LearningResourceValidator } from "../../validators/learning-resource-validator";

export interface AddResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
  resourceTypeRepository: IResourceTypeRepository;
  topicRepository: ITopicRepository;
  validator: LearningResourceValidator;
  cryptoService: CryptoService;
}

export interface AddResourceRequestModel {
  title: string;
  url?: string;
  resourceTypeId: UUID;
  topicIds: UUID[];
  difficulty: DifficultyType;
  energyLevel: EnergyLevelType;
  status: ResourceStatusType;
  notes: string | null;
}

export const addResource = async (
  {
    learningResourceRepository,
    resourceTypeRepository,
    topicRepository,
    cryptoService,
    validator,
  }: AddResourceDependencies,
  request: AddResourceRequestModel
) => {
  if (!(await validator.isValidAddPayload(request))) {
    return new InvalidDataError();
  }

  const existingResourceType = await resourceTypeRepository.findById(
    request.resourceTypeId
  );

  if (!existingResourceType) {
    return new NotFoundError({
      resource: "ResourceType",
      id: request.resourceTypeId,
    });
  }

  for (const topicId of request.topicIds) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      return new NotFoundError({ resource: "Topic", id: topicId });
    }
  }

  const id = await cryptoService.generateUUID();
  const title = request.title.trim();
  const url = request.url?.trim() || undefined;
  const notes = request.notes?.trim() || undefined;
  const now = new Date();

  const newResource: LearningResource = {
    id,
    title,
    url,
    typeId: request.resourceTypeId,
    topicIds: request.topicIds,
    difficulty: request.difficulty,
    estimatedDuration: { value: 0, isEstimated: false },
    energyLevel: request.energyLevel,
    status: ResourceStatusType.PENDING,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  await learningResourceRepository.save(newResource);
};
