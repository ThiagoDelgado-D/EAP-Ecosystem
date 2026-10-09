import {
  createValidationSchema,
  InvalidDataError,
  optionalEnum,
  stringField,
  ValidationError,
  type CryptoService,
  type CurrentUser,
} from "domain-lib";
import { TopicTone, type ITopicRepository, type Topic } from "@learning-resource/domain";
import { DuplicateTopicNameError } from "../../errors/topic-errors.js";
import {
  TOPIC_NAME_MAX_LENGTH,
  toTopicResponse,
  type TopicResponseModel,
} from "./topic-response.js";

export interface CreateTopicDependencies {
  topicRepository: ITopicRepository;
  cryptoService: CryptoService;
  currentUser: CurrentUser;
}

export interface CreateTopicRequestModel {
  name: string;
  color?: TopicTone;
}

export const TOPIC_TONE_ROTATION: TopicTone[] = Object.values(TopicTone);

const createTopicSchema = createValidationSchema<CreateTopicRequestModel>({
  name: stringField("Name", { required: true, maxLength: TOPIC_NAME_MAX_LENGTH }),
  color: optionalEnum(TOPIC_TONE_ROTATION, "Color"),
});

const nextRotationTone = (existingTopicCount: number): TopicTone =>
  TOPIC_TONE_ROTATION[existingTopicCount % TOPIC_TONE_ROTATION.length];

export const createTopic = async (
  { topicRepository, cryptoService, currentUser }: CreateTopicDependencies,
  request: CreateTopicRequestModel,
): Promise<TopicResponseModel | InvalidDataError | DuplicateTopicNameError> => {
  const validationResult = createTopicSchema(request);
  if (validationResult instanceof ValidationError) {
    return new InvalidDataError(validationResult.errors);
  }

  const { name, color } = validationResult;

  const sameName = await topicRepository.findByName(currentUser.id, name);
  if (sameName) return new DuplicateTopicNameError();

  const existingTopics = await topicRepository.findAllByUserId(currentUser.id);
  const now = new Date();
  const topic: Topic = {
    id: await cryptoService.generateUUID(),
    userId: currentUser.id,
    name,
    color: color ?? nextRotationTone(existingTopics.length),
    createdAt: now,
    updatedAt: now,
  };

  await topicRepository.save(topic);
  return toTopicResponse(topic);
};
