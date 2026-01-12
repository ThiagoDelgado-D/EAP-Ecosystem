import {
  arrayField,
  createValidationSchema,
  type CryptoService,
  enumField,
  InvalidDataError,
  NotFoundError,
  numberField,
  optionalEnum,
  optionalString,
  stringField,
  urlField,
  type UUID,
  uuidField,
  ValidationError,
} from "domain-lib";
import {
  DifficultyType,
  EnergyLevelType,
  type ILearningResourceRepository,
  type IResourceTypeRepository,
  type ITopicRepository,
  type LearningResource,
  ResourceStatusType,
} from "@learning-resource/domain";
import { calculateEnergyLevel } from "../../utils/calculate-energy-level";

export interface AddResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
  resourceTypeRepository: IResourceTypeRepository;
  topicRepository: ITopicRepository;
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

export const addResourceSchema =
  createValidationSchema<AddResourceRequestModel>({
    title: stringField("Title", {
      required: true,
      maxLength: 500,
    }),
    url: urlField("Url", { required: false }),
    resourceTypeId: uuidField("ResourceTypeId", { required: true }),
    topicIds: arrayField<UUID>("TopicIds", {
      required: true,
      minLength: 1,
    }),
    difficulty: enumField(
      Object.values(DifficultyType) as DifficultyType[],
      "Difficulty",
      { required: true }
    ),
    estimatedDurationMinutes: numberField("EstimatedDuration", {
      required: true,
      positive: true,
      integer: true,
    }),
    energyLevel: optionalEnum(
      Object.values(EnergyLevelType) as EnergyLevelType[],
      "Energy Level"
    ),
    status: optionalEnum(
      Object.values(ResourceStatusType) as ResourceStatusType[],
      "Status"
    ),
    notes: optionalString("Notes", { maxLength: 5000 }),
  });

export const addResource = async (
  {
    learningResourceRepository,
    resourceTypeRepository,
    topicRepository,
    cryptoService,
  }: AddResourceDependencies,
  request: AddResourceRequestModel
): Promise<void | InvalidDataError | NotFoundError> => {
  const validationResult = await addResourceSchema(request);
  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const validatedData = validationResult;

  const existingResourceType = await resourceTypeRepository.findById(
    validatedData.resourceTypeId
  );

  if (!existingResourceType) {
    return new NotFoundError({
      resource: "ResourceType",
      id: validatedData.resourceTypeId,
    });
  }

  for (const topicId of validatedData.topicIds) {
    const topic = await topicRepository.findById(topicId);
    if (!topic) {
      return new NotFoundError({ resource: "Topic", id: topicId });
    }
  }

  const energyLevel =
    validatedData.energyLevel ||
    calculateEnergyLevel(
      validatedData.difficulty,
      validatedData.estimatedDurationMinutes
    );

  const id = await cryptoService.generateUUID();
  const now = new Date();

  const newResource: LearningResource = {
    id,
    title: validatedData.title,
    url: validatedData.url,
    typeId: validatedData.resourceTypeId,
    topicIds: validatedData.topicIds,
    difficulty: validatedData.difficulty,
    estimatedDuration: {
      value: validatedData.estimatedDurationMinutes,
      isEstimated: true,
    },
    energyLevel,
    status: validatedData.status
      ? validatedData.status
      : ResourceStatusType.PENDING,
    lastViewed: undefined,
    notes: validatedData.notes,
    createdAt: now,
    updatedAt: now,
  };

  await learningResourceRepository.save(newResource);
};
