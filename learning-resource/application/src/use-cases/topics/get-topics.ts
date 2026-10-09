import type { ITopicRepository, TopicWithUsage } from "@learning-resource/domain";
import type { CurrentUser } from "domain-lib";
import type { TopicResponseModel } from "./topic-response.js";

export interface GetTopicsDependencies {
  topicRepository: ITopicRepository;
  currentUser: CurrentUser;
}

export interface TopicListItemResponseModel extends TopicResponseModel {
  resourceCount: number;
}

export interface GetTopicsResponseModel {
  topics: TopicListItemResponseModel[];
  total: number;
}

const toListItem = (topic: TopicWithUsage): TopicListItemResponseModel => ({
  id: topic.id,
  name: topic.name,
  color: topic.color,
  resourceCount: topic.resourceCount,
  createdAt: topic.createdAt,
  updatedAt: topic.updatedAt,
});

export const getTopics = async ({
  topicRepository,
  currentUser,
}: GetTopicsDependencies): Promise<GetTopicsResponseModel> => {
  const topics = await topicRepository.findAllByUserId(currentUser.id);
  return {
    topics: topics.map(toListItem),
    total: topics.length,
  };
};
