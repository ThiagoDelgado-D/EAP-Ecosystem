import type {
  ILearningResourceRepository,
  IResourceTypeRepository,
  ITopicRepository,
  LearningResource,
} from "@learning-resource/domain";
import { InvalidDataError, NotFoundError, type UUID } from "domain-lib";
import type { LearningResourceValidator } from "../../validators";
import { LearningResourceNotFoundError } from "../../errors";

export interface UpdateResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
  resourceTypeRepository: IResourceTypeRepository;
  topicRepository: ITopicRepository;
  validator: LearningResourceValidator;
}

export interface UpdateResourceRequestModel {
  id: UUID;
  title?: string;
  url?: string;
  typeId?: UUID;
  topicIds?: UUID[];
  estimatedDurationMinutes?: number;
  notes?: string;
}

export const updateResource = async (
  {
    learningResourceRepository,
    resourceTypeRepository,
    topicRepository,
    validator,
  }: UpdateResourceDependencies,
  request: UpdateResourceRequestModel
): Promise<
  void | InvalidDataError | LearningResourceNotFoundError | NotFoundError
> => {
  const hasUpdates =
    request.title !== undefined ||
    request.url !== undefined ||
    request.typeId !== undefined ||
    request.topicIds !== undefined ||
    request.estimatedDurationMinutes !== undefined ||
    request.notes !== undefined;

  if (!hasUpdates) {
    return new InvalidDataError({
      general: "At least one field must be provided for update",
    });
  }

  const validation = await validator.isValidUpdatePayload(request);
  if (!validation.isValid) {
    return new InvalidDataError(validation.errors);
  }

  const existingResource = await learningResourceRepository.findById(
    request.id
  );
  if (!existingResource) {
    return new LearningResourceNotFoundError();
  }

  if (request.typeId !== undefined) {
    const resourceType = await resourceTypeRepository.findById(request.typeId);
    if (!resourceType) {
      return new NotFoundError({
        resource: "ResourceType",
        id: request.typeId,
      });
    }
  }

  if (request.topicIds !== undefined && request.topicIds.length > 0) {
    for (const topicId of request.topicIds) {
      const topic = await topicRepository.findById(topicId);
      if (!topic) {
        return new NotFoundError({
          resource: "Topic",
          id: topicId,
        });
      }
    }
  }

  const updates: Partial<LearningResource> = {
    updatedAt: new Date(),
  };

  if (request.title !== undefined) {
    updates.title = request.title.trim();
  }

  if (request.url !== undefined) {
    updates.url = request.url.trim() || undefined;
  }

  if (request.typeId !== undefined) {
    updates.typeId = request.typeId;
  }

  if (request.topicIds !== undefined) {
    updates.topicIds = request.topicIds;
  }

  if (request.estimatedDurationMinutes !== undefined) {
    updates.estimatedDuration = {
      value: request.estimatedDurationMinutes,
      isEstimated: true,
    };
  }

  if (request.notes !== undefined) {
    updates.notes = request.notes.trim() || undefined;
  }

  await learningResourceRepository.update(request.id, updates);
};
