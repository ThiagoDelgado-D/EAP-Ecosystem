import {
  createValidationSchema,
  InvalidDataError,
  isErrorResult,
  uuidField,
  ValidationError,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import type { ITopicRepository } from "@learning-resource/domain";
import { TopicNotFoundError } from "../../errors/topic-errors.js";
import { verifyTopicOwnership } from "./verify-topic-ownership.js";

export interface DeleteTopicDependencies {
  topicRepository: ITopicRepository;
  currentUser: CurrentUser;
}

export interface DeleteTopicRequestModel {
  topicId: UUID;
}

const deleteTopicSchema = createValidationSchema<DeleteTopicRequestModel>({
  topicId: uuidField("TopicId", { required: true }),
});

export const deleteTopic = async (
  { topicRepository, currentUser }: DeleteTopicDependencies,
  request: DeleteTopicRequestModel,
): Promise<void | InvalidDataError | TopicNotFoundError> => {
  const validationResult = deleteTopicSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const topic = await verifyTopicOwnership(topicRepository, validationResult.topicId, currentUser);
  if (isErrorResult(topic)) return topic;

  await topicRepository.delete(topic.id);
};
