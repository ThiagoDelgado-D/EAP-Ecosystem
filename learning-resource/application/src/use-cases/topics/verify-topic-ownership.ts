import type { CurrentUser, UUID } from "domain-lib";
import type { ITopicRepository, Topic } from "@learning-resource/domain";
import { TopicNotFoundError } from "../../errors/topic-errors.js";

export const verifyTopicOwnership = async (
  topicRepository: ITopicRepository,
  topicId: UUID,
  currentUser: CurrentUser,
): Promise<Topic | TopicNotFoundError> => {
  const topic = await topicRepository.findById(topicId);
  if (!topic) return new TopicNotFoundError();
  if (topic.userId !== currentUser.id) return new TopicNotFoundError();
  return topic;
};
