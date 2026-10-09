import type { UUID } from "domain-lib";
import type { Topic, TopicWithUsage } from "../entities/topic.js";

export interface ITopicRepository {
  save(topic: Topic): Promise<void>;
  update(id: UUID, topic: Partial<Topic>): Promise<void>;
  delete(id: UUID): Promise<void>;
  findById(id: UUID): Promise<Topic | null>;
  findAllByUserId(userId: UUID): Promise<TopicWithUsage[]>;
  findByName(userId: UUID, name: string): Promise<Topic | null>;
}
