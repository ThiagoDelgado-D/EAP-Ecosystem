import {
  createValidationSchema,
  InvalidDataError,
  urlField,
  ValidationError,
} from "domain-lib";
import type { IResourceTypeRepository } from "@learning-resource/domain";
import type {
  IUrlMetadataService,
  UrlMetadata,
} from "../../ports/IUrl-metadata-service.js";
import type { UUID } from "domain-lib";

export interface PreviewUrlDependencies {
  urlMetadataService: IUrlMetadataService;
  resourceTypeRepository: IResourceTypeRepository;
}

export interface PreviewUrlRequestModel {
  url: string;
}

export interface PreviewUrlResponseModel {
  title?: string;
  description?: string;
  imageUrl?: string;
  resourceTypeId?: UUID;
  resourceTypeCode?: string;
  author?: string;
  siteName?: string;
}

export const previewUrlSchema = createValidationSchema<PreviewUrlRequestModel>({
  url: urlField("Url", { required: true }),
});

export const previewUrl = async (
  { urlMetadataService, resourceTypeRepository }: PreviewUrlDependencies,
  request: PreviewUrlRequestModel,
): Promise<PreviewUrlResponseModel | InvalidDataError> => {
  const validationResult = previewUrlSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  let metadata: UrlMetadata;
  try {
    metadata = await urlMetadataService.extract(validationResult.url);
  } catch {
    metadata = {};
  }

  let resourceTypeId: UUID | undefined;
  if (metadata.resourceTypeCode) {
    const allTypes = await resourceTypeRepository.findAll();
    const matched = allTypes.find(
      (t) => t.code.toLowerCase() === metadata.resourceTypeCode!.toLowerCase(),
    );
    resourceTypeId = matched?.id;
  }

  return {
    title: metadata.title,
    description: metadata.description,
    imageUrl: metadata.imageUrl,
    resourceTypeId,
    resourceTypeCode: metadata.resourceTypeCode,
    author: metadata.author,
    siteName: metadata.siteName,
  };
};
