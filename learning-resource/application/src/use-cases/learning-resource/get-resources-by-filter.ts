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
      uuidField(`Topic ID at position ${index}`, { required: true })(item),
  }),
  difficulty: enumField(
    Object.values(DifficultyType) as DifficultyType[],
    "Difficulty",
    { required: false },
  ),
  energyLevel: enumField(
    Object.values(EnergyLevelType) as EnergyLevelType[],
    "Energy Level",
    { required: false },
  ),
  status: enumField(
    Object.values(ResourceStatusType) as ResourceStatusType[],
    "Status",
    { required: false },
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
  request: GetResourcesRequestModel = {},
): Promise<GetResourcesResponseModel> => {
  const validatedResult = getResourcesSchema(request);
  if (validatedResult instanceof ValidationError) {
    const resources = await learningResourceRepository.findAll();
    return { resources, total: resources.length };
  }

  const { filters } = validatedResult;

  if (!filters || Object.keys(filters).length === 0) {
    const resources = await learningResourceRepository.findAll();
    return { resources, total: resources.length };
  }

  let resources = await learningResourceRepository.findAll();

  if (filters.topicIds) {
    const byTopic = await learningResourceRepository.findByTopicIds(
      filters.topicIds,
    );
    const ids = new Set(byTopic.map((r) => r.id));
    resources = resources.filter((r) => ids.has(r.id));
  }

  if (filters.difficulty) {
    resources = resources.filter((r) => r.difficulty === filters.difficulty);
  }

  if (filters.energyLevel) {
    resources = resources.filter((r) => r.energyLevel === filters.energyLevel);
  }

  if (filters.status) {
    resources = resources.filter((r) => r.status === filters.status);
  }

  if (filters.resourceTypeId) {
    resources = resources.filter((r) => r.typeId === filters.resourceTypeId);
  }

  return { resources, total: resources.length };
};
