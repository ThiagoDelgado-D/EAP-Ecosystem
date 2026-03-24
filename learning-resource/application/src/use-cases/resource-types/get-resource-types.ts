import type {
  IResourceTypeRepository,
  ResourceType,
} from "@learning-resource/domain";

export interface GetResourceTypesDependencies {
  resourceTypeRepository: IResourceTypeRepository;
}

export interface GetResourceTypesResponseModel {
  resourceTypes: ResourceType[];
  total: number;
}

export const getResourceTypes = async ({
  resourceTypeRepository,
}: GetResourceTypesDependencies): Promise<GetResourceTypesResponseModel> => {
  const resourceTypes = await resourceTypeRepository.findAll();
  return {
    resourceTypes,
    total: resourceTypes.length,
  };
};
