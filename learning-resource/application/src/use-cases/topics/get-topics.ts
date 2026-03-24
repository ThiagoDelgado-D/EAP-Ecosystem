import type { ITopicRepository, Topic } from "@learning-resource/domain";

export interface GetTopicsDependencies {
  topicRepository: ITopicRepository;
}

export interface GetTopicsResponseModel {
  topics: Topic[];
  total: number;
}

export const getTopics = async ({
  topicRepository,
}: GetTopicsDependencies): Promise<GetTopicsResponseModel> => {
  const topics = await topicRepository.findAll();
  return {
    topics,
    total: topics.length,
  };
};
