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
import { calculateEnergyLevel } from "../../utils/calculate-energy-level";

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
  estimatedDurationMinutes: number;
  energyLevel?: EnergyLevelType;
  status?: ResourceStatusType;
  notes?: string;
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
): Promise<void | InvalidDataError | NotFoundError> => {
  const validation = await validator.isValidAddPayload(request);
  if (!validation.isValid) {
    return new InvalidDataError(validation.errors);
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

  const energyLevel =
    request.energyLevel ||
    calculateEnergyLevel(request.difficulty, request.estimatedDurationMinutes);

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
    estimatedDuration: {
      value: request.estimatedDurationMinutes,
      isEstimated: true,
    },
    energyLevel,
    status: request.status ? request.status : ResourceStatusType.PENDING,
    lastViewed: undefined,
    notes,
    createdAt: now,
    updatedAt: now,
  };

  await learningResourceRepository.save(newResource);
};
