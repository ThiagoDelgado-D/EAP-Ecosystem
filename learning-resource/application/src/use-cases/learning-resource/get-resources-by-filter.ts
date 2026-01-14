import {
  type ILearningResourceRepository,
  type LearningResource,
  DifficultyType,
  EnergyLevelType,
  ResourceStatusType,
} from "@learning-resource/domain";
import {
  arrayField,
  createValidationSchema,
  enumField,
  objectField,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";

export interface GetResourcesDependencies {
  learningResourceRepository: ILearningResourceRepository;
}

export interface GetResourcesFilters {
  topicIds?: UUID[];
  difficulty?: DifficultyType;
  energyLevel?: EnergyLevelType;
  status?: ResourceStatusType;
  resourceTypeId?: UUID;
}

export interface GetResourcesRequestModel {
  filters?: GetResourcesFilters;
}

export interface GetResourcesResponseModel {
  resources: LearningResource[];
  total: number;
}

const filtersSchemaMap = {
  topicIds: arrayField<UUID>("Topic IDs", {
    required: false,
    itemValidator: (item, index) =>
      uuidField(`Topic ID at position ${index}`)(item),
  }),
  difficulty: enumField(
    Object.values(DifficultyType) as DifficultyType[],
    "Difficulty",
    { required: false }
  ),
  energyLevel: enumField(
    Object.values(EnergyLevelType) as EnergyLevelType[],
    "Energy Level",
    { required: false }
  ),
  status: enumField(
    Object.values(ResourceStatusType) as ResourceStatusType[],
    "Status",
    { required: false }
  ),
  resourceTypeId: uuidField("Resource Type ID", { required: false }),
};

export const getResourcesSchema =
  createValidationSchema<GetResourcesRequestModel>({
    filters: objectField<GetResourcesFilters>("Filters", {
      required: false,
      schema: filtersSchemaMap,
    }),
  });

export const getResourcesByFilter = async (
  { learningResourceRepository }: GetResourcesDependencies,
  request: GetResourcesRequestModel = {}
): Promise<GetResourcesResponseModel> => {
  const validatedResult = getResourcesSchema(request);

  if (validatedResult instanceof ValidationError) {
    const resources = await learningResourceRepository.findAll();
    return {
      resources,
      total: resources.length,
    };
  }

  const validatedData = validatedResult;
  const { filters } = validatedData;

  if (!filters || Object.keys(filters).length === 0) {
    const resources = await learningResourceRepository.findAll();
    return {
      resources,
      total: resources.length,
    };
  }

  if (filters.topicIds) {
    const resources = await learningResourceRepository.findByTopicIds(
      filters.topicIds
    );
    return {
      resources,
      total: resources.length,
    };
  }

  if (filters.difficulty) {
    const resources = await learningResourceRepository.findByDifficulty(
      filters.difficulty
    );
    return {
      resources,
      total: resources.length,
    };
  }

  if (filters.energyLevel) {
    const resources = await learningResourceRepository.findByEnergyLevel(
      filters.energyLevel
    );
    return {
      resources,
      total: resources.length,
    };
  }

  if (filters.status) {
    const resources = await learningResourceRepository.findByStatus(
      filters.status
    );
    return {
      resources,
      total: resources.length,
    };
  }

  if (filters.resourceTypeId) {
    const resources = await learningResourceRepository.findByResourceTypeId(
      filters.resourceTypeId
    );
    return {
      resources,
      total: resources.length,
    };
  }

  const allResources = await learningResourceRepository.findAll();
  return {
    resources: allResources,
    total: allResources.length,
  };
};
