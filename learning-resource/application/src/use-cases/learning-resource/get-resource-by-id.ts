import {
  DifficultyType,
  EnergyLevelType,
  type ILearningResourceRepository,
  MentalStateType,
  ResourceStatusType,
} from "@learning-resource/domain";
import { LearningResourceNotFoundError } from "../../errors/learning-resource-not-found.js";
import {
  createValidationSchema,
  InvalidDataError,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";

export interface GetResourceByIdDependencies {
  learningResourceRepository: ILearningResourceRepository;
}

export interface GetResourceByIdRequestModel {
  resourceId: UUID;
}

export interface GetResourceByIdResponseModel {
  resourceId: UUID;
  title: string;
  url?: string;
  imageUrl?: string;
  topicIds: UUID[];
  difficulty: DifficultyType;
  estimatedDurationMinutes: number;
  energyLevel?: EnergyLevelType;
  mentalState?: MentalStateType;
  status?: ResourceStatusType;
  notes?: string;
}

export const getResourceByIdSchema =
  createValidationSchema<GetResourceByIdRequestModel>({
    resourceId: uuidField("ResourceId", { required: true }),
  });

export const GetResourceById = async (
  { learningResourceRepository }: GetResourceByIdDependencies,
  { resourceId }: GetResourceByIdRequestModel,
): Promise<
  | GetResourceByIdResponseModel
  | LearningResourceNotFoundError
  | InvalidDataError
> => {
  const validationResult = getResourceByIdSchema({ resourceId });

  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const resource = await learningResourceRepository.findById(resourceId);

  if (!resource) {
    return new LearningResourceNotFoundError();
  }

  const result: GetResourceByIdResponseModel = {
    resourceId: resource.id,
    title: resource.title,
    url: resource.url,
    imageUrl: resource.imageUrl,
    topicIds: resource.topicIds,
    difficulty: resource.difficulty,
    estimatedDurationMinutes: resource.estimatedDuration.value,
    energyLevel: resource.energyLevel,
    mentalState: resource.mentalState,
    status: resource.status,
    notes: resource.notes,
  };

  return result;
};
