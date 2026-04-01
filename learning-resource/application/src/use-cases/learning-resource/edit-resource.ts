import {
  MentalStateType,
  type ILearningResourceRepository,
  type IResourceTypeRepository,
  type ITopicRepository,
  type LearningResource,
} from "@learning-resource/domain";
import {
  arrayField,
  createValidationSchema,
  InvalidDataError,
  NotFoundError,
  optionalEnum,
  optionalNumber,
  optionalString,
  urlField,
  uuidField,
  ValidationError,
  type UUID,
} from "domain-lib";
import { LearningResourceNotFoundError } from "../../errors/index.js";

export interface UpdateResourceDependencies {
  learningResourceRepository: ILearningResourceRepository;
  resourceTypeRepository: IResourceTypeRepository;
  topicRepository: ITopicRepository;
}

export interface UpdateResourceRequestModel {
  id: UUID;
  title?: string;
  url?: string;
  imageUrl?: string;
  typeId?: UUID;
  topicIds?: UUID[];
  estimatedDurationMinutes?: number;
  mentalState?: MentalStateType;
  notes?: string;
}

export const updateResourceSchema =
  createValidationSchema<UpdateResourceRequestModel>({
    id: uuidField("ResourceId", { required: true }),
    title: optionalString("Title", { allowEmpty: true, maxLength: 250 }),
    url: urlField("Url", { required: false, allowEmpty: true }),
    imageUrl: urlField("ImageUrl", { required: false, allowEmpty: true }),
    typeId: uuidField("ResourceType", { required: false }),
    topicIds: arrayField<UUID>("TopicIds", {
      required: false,
    }),
    estimatedDurationMinutes: optionalNumber("EstimatedDuration", {
      positive: true,
      integer: true,
    }),
    mentalState: optionalEnum(
      Object.values(MentalStateType) as MentalStateType[],
      "Mental State",
    ),
    notes: optionalString("Notes", { maxLength: 5000, allowEmpty: true }),
  });

export const updateResource = async (
  {
    learningResourceRepository,
    resourceTypeRepository,
    topicRepository,
  }: UpdateResourceDependencies,
  request: UpdateResourceRequestModel,
): Promise<
  void | InvalidDataError | LearningResourceNotFoundError | NotFoundError
> => {
  const hasUpdates =
    request.title !== undefined ||
    request.url !== undefined ||
    request.imageUrl !== undefined ||
    request.typeId !== undefined ||
    request.topicIds !== undefined ||
    request.estimatedDurationMinutes !== undefined ||
    request.mentalState !== undefined ||
    request.notes !== undefined;

  if (!hasUpdates) {
    return new InvalidDataError({
      general: "At least one field must be provided for update",
    });
  }

  const validationResult = updateResourceSchema(request);
  if (validationResult instanceof ValidationError) {
    const validationErrors = validationResult.errors;
    return new InvalidDataError(validationErrors);
  }

  const validatedData = validationResult;

  const existingResource = await learningResourceRepository.findById(
    validatedData.id,
  );
  if (!existingResource) {
    return new LearningResourceNotFoundError();
  }

  if (validatedData.typeId !== undefined) {
    const resourceType = await resourceTypeRepository.findById(
      validatedData.typeId,
    );
    if (!resourceType) {
      return new NotFoundError({
        resource: "ResourceType",
        id: validatedData.typeId,
      });
    }
  }

  if (
    validatedData.topicIds !== undefined &&
    validatedData.topicIds.length > 0
  ) {
    for (const topicId of validatedData.topicIds) {
      const topic = await topicRepository.findById(topicId);
      if (!topic) {
        return new NotFoundError({
          resource: "Topic",
          id: topicId,
        });
      }
    }
  }

  const updates: Partial<LearningResource> = { updatedAt: new Date() };

  if (validatedData.title !== undefined) updates.title = validatedData.title;
  if (validatedData.url !== undefined)
    updates.url = validatedData.url || undefined;
  if (validatedData.imageUrl !== undefined)
    updates.imageUrl = validatedData.imageUrl || undefined;
  if (validatedData.typeId !== undefined) updates.typeId = validatedData.typeId;
  if (validatedData.topicIds !== undefined)
    updates.topicIds = validatedData.topicIds;
  if (validatedData.estimatedDurationMinutes !== undefined) {
    updates.estimatedDuration = {
      value: validatedData.estimatedDurationMinutes,
      isEstimated: true,
    };
  }
  if (validatedData.mentalState !== undefined)
    updates.mentalState = validatedData.mentalState;
  if (validatedData.notes !== undefined)
    updates.notes = validatedData.notes || undefined;

  await learningResourceRepository.update(validatedData.id, updates);
};
