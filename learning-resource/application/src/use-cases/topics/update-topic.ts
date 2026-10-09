import {
  createValidationSchema,
  InvalidDataError,
  isErrorResult,
  optionalEnum,
  optionalString,
  uuidField,
  ValidationError,
  type CurrentUser,
  type UUID,
} from "domain-lib";
import { TopicTone, type ITopicRepository, type Topic } from "@learning-resource/domain";
import { DuplicateTopicNameError, TopicNotFoundError } from "../../errors/topic-errors.js";
import { verifyTopicOwnership } from "./verify-topic-ownership.js";
import {
  TOPIC_NAME_MAX_LENGTH,
  toTopicResponse,
  type TopicResponseModel,
} from "./topic-response.js";

export interface UpdateTopicDependencies {
  topicRepository: ITopicRepository;
  currentUser: CurrentUser;
}

export interface UpdateTopicRequestModel {
  topicId: UUID;
  name?: string;
  color?: TopicTone;
}

const updateTopicSchema = createValidationSchema<UpdateTopicRequestModel>({
  topicId: uuidField("TopicId", { required: true }),
  name: optionalString("Name", { minLength: 1, maxLength: TOPIC_NAME_MAX_LENGTH }),
  color: optionalEnum(Object.values(TopicTone) as TopicTone[], "Color"),
});

const isNameTakenByAnotherTopic = async (
  topicRepository: ITopicRepository,
  topic: Topic,
  name: string,
): Promise<boolean> => {
  const sameName = await topicRepository.findByName(topic.userId, name);
  if (!sameName) return false;
  return sameName.id !== topic.id;
};

export const updateTopic = async (
  { topicRepository, currentUser }: UpdateTopicDependencies,
  request: UpdateTopicRequestModel,
): Promise<
  TopicResponseModel | InvalidDataError | TopicNotFoundError | DuplicateTopicNameError
> => {
  const validationResult = updateTopicSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { topicId, name, color } = validationResult;

  const topic = await verifyTopicOwnership(topicRepository, topicId, currentUser);
  if (isErrorResult(topic)) return topic;

  if (name !== undefined && (await isNameTakenByAnotherTopic(topicRepository, topic, name))) {
    return new DuplicateTopicNameError();
  }

  const updated: Topic = {
    id: topic.id,
    userId: topic.userId,
    name: name ?? topic.name,
    color: color ?? topic.color,
    createdAt: topic.createdAt,
    updatedAt: new Date(),
  };

  await topicRepository.update(topic.id, {
    name: updated.name,
    color: updated.color,
    updatedAt: updated.updatedAt,
  });
  return toTopicResponse(updated);
};
