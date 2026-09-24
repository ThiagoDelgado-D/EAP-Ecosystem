import {
  DifficultyType,
  EnergyLevelType,
  type ILearningResourceRepository,
  MentalStateType,
  ResourceStatusType,
} from "@learning-resource/domain";
import {
  LearningResourceForbiddenError,
  LearningResourceNotFoundError,
} from "../../errors/index.js";
import { verifyLearningResourceOwnership } from "./verify-learning-resource-ownership.js";
import {
  createValidationSchema,
  type CurrentUser,
  InvalidDataError,
  isErrorResult,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";

export interface GetResourceByIdDependencies {
  learningResourceRepository: ILearningResourceRepository;
  currentUser: CurrentUser;
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
  typeId: UUID;
  difficulty: DifficultyType;
  estimatedDurationMinutes: number;
  energyLevel?: EnergyLevelType;
  mentalState?: MentalStateType;
  status?: ResourceStatusType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const getResourceByIdSchema =
  createValidationSchema<GetResourceByIdRequestModel>({
    resourceId: uuidField("ResourceId", { required: true }),
  });

export const GetResourceById = async (
  { learningResourceRepository, currentUser }: GetResourceByIdDependencies,
  { resourceId }: GetResourceByIdRequestModel,
): Promise<
  | GetResourceByIdResponseModel
  | LearningResourceNotFoundError
  | LearningResourceForbiddenError
  | InvalidDataError
> => {
  const validationResult = getResourceByIdSchema({ resourceId });

  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const resource = await verifyLearningResourceOwnership(
    learningResourceRepository,
    validationResult.resourceId,
    currentUser,
  );
  if (isErrorResult(resource)) return resource;

  const result: GetResourceByIdResponseModel = {
    resourceId: resource.id,
    title: resource.title,
    url: resource.url,
    imageUrl: resource.imageUrl,
    topicIds: resource.topicIds,
    typeId: resource.typeId,
    difficulty: resource.difficulty,
    estimatedDurationMinutes: resource.estimatedDuration.value,
    energyLevel: resource.energyLevel,
    mentalState: resource.mentalState,
    status: resource.status,
    notes: resource.notes,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };

  return result;
};
