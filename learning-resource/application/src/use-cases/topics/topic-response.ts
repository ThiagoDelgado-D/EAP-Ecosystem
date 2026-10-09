import type { Topic, TopicTone } from "@learning-resource/domain";
import type { UUID } from "domain-lib";

export interface TopicResponseModel {
  id: UUID;
  name: string;
  color: TopicTone;
  createdAt: Date;
  updatedAt: Date;
}

export const TOPIC_NAME_MAX_LENGTH = 100;

export const toTopicResponse = (topic: Topic): TopicResponseModel => ({
  id: topic.id,
  name: topic.name,
  color: topic.color,
  createdAt: topic.createdAt,
  updatedAt: topic.updatedAt,
});
