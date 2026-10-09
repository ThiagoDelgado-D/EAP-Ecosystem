import { NotFoundError, type CurrentUser, type UUID } from "domain-lib";
import type { ITopicRepository } from "@learning-resource/domain";

export const findUnavailableTopic = async (
  topicRepository: ITopicRepository,
  topicIds: UUID[],
  currentUser: CurrentUser,
): Promise<NotFoundError | undefined> => {
  for (const topicId of topicIds) {
    const topic = await topicRepository.findById(topicId);
    if (topic?.userId !== currentUser.id) {
      return new NotFoundError({ resource: "Topic", id: topicId });
    }
  }
  return undefined;
};
